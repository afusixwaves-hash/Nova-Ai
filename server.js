import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." }
});
app.use("/api/", apiLimiter);

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Server owner has not configured OPENAI_API_KEY.");
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "Nova-Ai" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 8000) return res.status(400).json({ error: "Message is too long (max 8,000 characters)." });

    const safeHistory = history.slice(-12).map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").slice(0, 4000)
    })).filter((item) => item.content);

    const client = getClient();
    const response = await client.responses.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
      instructions: "You are Nova-Ai, a helpful, friendly and accurate AI assistant. Reply in the language used by the user. Be clear and concise. Never claim to have performed actions you did not perform.",
      input: [...safeHistory, { role: "user", content: message }],
      max_output_tokens: 1200
    });

    res.json({ reply: response.output_text || "I could not generate a reply. Please try again." });
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500;
    res.status(status).json({
      error: status === 401 ? "OpenAI API key is invalid. Check the server environment variable." :
             status === 429 ? "OpenAI quota/rate limit reached. Check API billing and limits." :
             "Nova-Ai could not reply. Check server logs and API settings."
    });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Please describe the image you want." });
    if (prompt.length > 2000) return res.status(400).json({ error: "Prompt is too long (max 2,000 characters)." });

    const client = getClient();
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst",
      prompt,
      size: "1024x1024"
    });

    const image = result.data?.[0]?.b64_json;
    if (!image) throw new Error("No image data returned.");
    res.json({ image: `data:image/png;base64,${image}` });
  } catch (error) {
    console.error("Image error:", error?.message || error);
    const status = Number(error?.status) >= 400 && Number(error.status) < 600 ? Number(error.status) : 500;
    res.status(status).json({
      error: status === 401 ? "OpenAI API key is invalid. Check the server environment variable." :
             status === 429 ? "Image quota/rate limit reached. Check API billing and limits." :
             "Image generation failed. Check that your API project has image model access."
    });
  }
});

app.use((req, res) => {
  if (req.method === "GET") return res.sendFile(path.join(__dirname, "public", "index.html"));
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => console.log(`Nova-Ai running on port ${PORT}`));