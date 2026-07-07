import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with API key from environment
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API endpoint for AI assistant FAQ chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    if (!apiKey || !ai) {
      // Return helpful fallback answer if the API key is not yet set
      return res.json({
        text: "Hola, soy el asistente IA de Clínica Sinergia. En este momento el servidor no cuenta con una clave API de Gemini activa en la configuración de Secrets, pero te puedo dar respuestas estándar:\n\n1. **¿Qué horarios de atención tienen?** Lunes a Viernes de 8:00 a 20:00, Sábados de 9:00 a 14:00.\n2. **¿Dónde están ubicados?** En la Av. Sinergia Médica #104, Colonia Salud.\n3. **¿Cómo agendar una cita?** Ve a la pestaña 'Mis Citas' para solicitar una cita en tiempo real.\n\nPor favor, configura la variable GEMINI_API_KEY en Settings > Secrets para habilitar la inteligencia artificial completa con respuestas personalizadas."
      });
    }

    // Set up system instructions for Clínica Sinergia FAQ
    const systemInstruction = `
Eres el Asistente IA Oficial de la Clínica Sinergia, un portal y centro terapéutico líder en Terapia Física, Terapia Ocupacional, Integración Sensorial, Terapia del Habla y Lenguaje, y Psicología Infantil.
Tu objetivo es responder de manera profesional, empática, clara y concisa a las preguntas frecuentes de los pacientes y familiares.

Aquí tienes información clave sobre la Clínica Sinergia para responder preguntas frecuentes:
- Horarios de atención: Lunes a Viernes de 8:00 AM a 8:00 PM (20:00), Sábados de 9:00 AM a 2:00 PM (14:00). Domingos cerrado.
- Especialidades terapéuticas:
  1. Terapia Física: Mejorar tono muscular, postura, equilibrio y motricidad gruesa.
  2. Terapia Ocupacional e Integración Sensorial: Ayuda con TEA, TDAH, y regulación sensorial.
  3. Terapia del Habla y Lenguaje: Trastorno del habla, disfasia, deglución y comunicación.
  4. Psicología Infantil y Apoyo Familiar: Ansiedad, orientación de crianza, conducta y emociones.
- Agendamiento de citas: Los pacientes pueden solicitar y ver sus citas en tiempo real en la pestaña 'Mis Citas'. El administrador o terapeuta confirmará o cancelará las citas correspondientes.
- Expedientes Clínicos: Los terapeutas registran el progreso clínico en la pestaña 'Expedientes Clínicos', incluyendo el diagnóstico, plan de intervención y observaciones de evolución. Es un sistema seguro y confidencial.
- Mensajería Directa: Los pacientes pueden iniciar un chat instantáneo sincrónico con su terapeuta o especialista asignado desde la pestaña 'Chat Directo'.
- Guía de Terapias: Hay un manual educativo con recomendaciones prácticas para el hogar en la pestaña 'Manual de Terapias'.
- Ubicación: Av. Sinergia Médica #104, Colonia Salud, Ciudad Médica.
- Contacto: +52 (55) 5555-1234 / contacto@clinicasinergia.com.

Instrucciones de formato:
- Responde siempre en español.
- Sé muy empático y comprensivo con las familias que buscan apoyo para la rehabilitación de sus hijos o seres queridos.
- Mantén las respuestas claras y estructuradas usando viñetas (bullets) si es necesario.
- Si una pregunta no está relacionada con la clínica o con terapias del desarrollo, responde amablemente que eres el asistente de Clínica Sinergia y redirige la conversación hacia temas de salud terapéutica.
`;

    // Parse history to contents structure for generateContent
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in AI FAQ Chat endpoint:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor al procesar la solicitud con Gemini." });
  }
});

// Vite middleware or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
