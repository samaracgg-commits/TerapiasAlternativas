# Security Specification & Adversarial Test Plan

This document outlines the security invariants, adversarial "Dirty Dozen" payloads designed to compromise the system, and the corresponding rules-based defenses.

## 1. Data Invariants

1. **User Profiling**:
   - Only authenticated users can register their profiles.
   - Users cannot update their `role` once set, nor can they update other users' profiles.
   - Profile creation requires setting `role` strictly to `patient` (since therapists/admins are pre-assigned or validated, preventing self-assigned privileges).
2. **Appointments**:
   - A patient can only create or edit an appointment with themselves as the `patientId`.
   - A patient cannot cancel an appointment that has been marked as `completed`.
   - Therapists/admins have full rights to confirm, reschedule, or cancel appointments.
3. **Clinical Records**:
   - Only therapists and admins can create or update clinical records. Patients are strictly read-only.
   - A clinical record must reference a valid `patientId` and have a `createdAt` timestamp matching `request.time`.
4. **Messages**:
   - Any message must have `senderId` matching `request.auth.uid`.
   - Users can only read or write messages where they are either the `senderId` or the `receiverId`.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to bypass authorization, inject corrupt data, escalate privileges, or poison records.

### Payload 1: Privilege Escalation (Self-Assigned Admin Role)
* **Goal**: A registering patient attempts to set their role as `admin`.
* **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "name": "Attacker",
    "email": "attacker@gmail.com",
    "role": "admin",
    "createdAt": "request.time"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Handled by restricting role creation or preventing standard users from setting their role to `admin`/`therapist` dynamically.

### Payload 2: Profile Spoofing (Impersonation)
* **Goal**: Attacker tries to update another user's profile.
* **Path**: `/users/victim_uid`
* **Payload**:
  ```json
  {
    "name": "Hacked User Name"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Handled by validating `request.auth.uid == userId`.

### Payload 3: Role Hijacking (Overwriting Role Post-Creation)
* **Goal**: A registered patient tries to modify their role to `therapist`.
* **Path**: `/users/patient_uid`
* **Payload**:
  ```json
  {
    "role": "therapist"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Protected by `affectedKeys()` checking that `role` cannot be altered after creation.

### Payload 4: Orphaned Appointment (Creating Appointment for Someone Else)
* **Goal**: Attacker schedules an appointment and sets the `patientId` to a different victim.
* **Payload**:
  ```json
  {
    "id": "app_123",
    "patientId": "victim_uid",
    "patientName": "Victim",
    "therapistId": "therapist_uid",
    "therapistName": "Dr. Good",
    "date": "2026-07-10",
    "time": "10:00",
    "therapyType": "Fisioterapia",
    "status": "pending"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Rejects unless `incoming().patientId == request.auth.uid` or the sender is a therapist.

### Payload 5: Denying Wallet (Massive Injection into String ID Fields)
* **Goal**: Inject a 1MB junk string as the appointment ID to exploit firestore billing/processing.
* **Path**: `/appointments/HUGE_JUNK_STRING_OF_100000_CHARACTERS`
* **Failure Code**: `PERMISSION_DENIED` - Enforced by `isValidId()` restricting ID length to `<= 128`.

### Payload 6: Clinical Note Tampering by Patient
* **Goal**: A patient attempts to write a fake clinical record showing they are fully healed.
* **Payload**:
  ```json
  {
    "id": "rec_1",
    "patientId": "patient_uid",
    "therapistId": "therapist_uid",
    "therapistName": "Dr. Therapist",
    "date": "2026-07-06",
    "therapyType": "Speech Therapy",
    "objective": "None",
    "evolution": "Patient is magically cured.",
    "recommendations": "No more therapies needed."
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Rejects clinical record write operations unless the user's registered role in `/users/$(request.auth.uid)` is `therapist` or `admin`.

### Payload 7: Client-Side Timestamp Spoofing (Faking Appointment Creation Date)
* **Goal**: Attacker tries to set a past/future `createdAt` manually.
* **Payload**:
  ```json
  {
    "id": "app_2",
    "patientId": "patient_uid",
    "patientName": "Attacker",
    "therapistId": "therapist_uid",
    "therapistName": "Dr. Good",
    "date": "2026-07-10",
    "time": "10:00",
    "therapyType": "Fisioterapia",
    "status": "pending",
    "createdAt": "2000-01-01T00:00:00Z"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Enforced by comparing `incoming().createdAt` directly with `request.time`.

### Payload 8: Message Interception (Eavesdropping on Other Chats)
* **Goal**: A user tries to query list of messages that don't belong to them.
* **Query**: `collection("messages")` without user filter.
* **Failure Code**: `PERMISSION_DENIED` - Enforced by rule-side list query enforcer check: `resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid`.

### Payload 9: Message Spoofing (Sending Messages as Dr. Therapist)
* **Goal**: A patient tries to send a message claiming the sender is the therapist.
* **Payload**:
  ```json
  {
    "id": "msg_1",
    "senderId": "therapist_uid",
    "senderName": "Dr. Therapist",
    "receiverId": "another_patient",
    "text": "Your sessions are canceled."
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Enforced by `incoming().senderId == request.auth.uid`.

### Payload 10: State Shortcut (Force Confirming Appointment)
* **Goal**: A patient schedules an appointment and sets status directly to `confirmed` or `completed` without therapist review.
* **Payload**:
  ```json
  {
    "id": "app_3",
    "patientId": "patient_uid",
    "patientName": "Attacker",
    "therapistId": "therapist_uid",
    "therapistName": "Dr. Good",
    "date": "2026-07-10",
    "time": "10:00",
    "therapyType": "Fisioterapia",
    "status": "completed"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Handled by requiring patients to only create appointments with `pending` status. Only therapists/admins can set `confirmed` or `completed`.

### Payload 11: Ghost Field Vulnerability (Bypassing Checks via Additional Properties)
* **Goal**: Inject random parameters into a clinical record.
* **Payload**:
  ```json
  {
    "id": "rec_123",
    "patientId": "patient_uid",
    "therapistId": "therapist_uid",
    "therapistName": "Dr. Good",
    "date": "2026-07-06",
    "therapyType": "Fisioterapia",
    "objective": "Strengthen limbs",
    "evolution": "Good",
    "recommendations": "Rest",
    "ghostField": "someMaliciousData"
  }
  ```
* **Failure Code**: `PERMISSION_DENIED` - Handled by `data.keys().size()` checks to prevent shadow fields.

### Payload 12: Terminal State Overwriting (Re-opening Cancelled Appointment)
* **Goal**: A patient tries to reopen an appointment that has been cancelled or completed.
* **Failure Code**: `PERMISSION_DENIED` - Enforced by blocking edits if the existing status is `cancelled` or `completed`.
