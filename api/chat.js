import { cleanText, readJson, requireMethod, sendJson } from "../lib/api-utils.js";

const DEFAULT_MODEL = "llama3.1:8b";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;

  const body = await readJson(req);
  const configuredHost =
    process.env.OLLAMA_BASE_URL ||
    process.env.OLLAMA_HOST ||
    process.env.OLLAMA_API_BASE_URL ||
    process.env.OLLAMA_URL ||
    process.env.OLLAMA_SERVER_URL ||
    (process.env.OLLAMA_API_KEY ? "https://ollama.com" : "");

  const baseUrl = configuredHost
    .replace(/\/$/, "")
    .replace(/\/v1$/, "")
    .replace(/\/api$/, "");
  const endpoint = process.env.OLLAMA_CHAT_ENDPOINT || (baseUrl ? `${baseUrl}/api/chat` : "");
  const model = cleanText(body.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL, 80);
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const projectName = cleanText(body.projectName || "Astra_AI", 120);
  const friendlyMode = body.friendlyMode !== false;
  const safetyMode = body.safetyMode !== false;

  const messages = incomingMessages
    .slice(-20)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: cleanText(message.content, 6000)
    }))
    .filter((message) => message.content);

  const system = {
    role: "system",
    content:
      `You are Aurexis, the friendly AI chatbot inside Astra_AI. ` +
      `${friendlyMode ? "Be warm, encouraging, clear, practical, and imaginative. " : "Be clear, practical, and concise. "}` +
      `${safetyMode ? "Refuse unsafe requests, protect private data, and avoid asking users to paste secrets into chat. " : ""}` +
      `The active project is "${projectName}". ` +
      `Keep answers helpful and concise unless the user asks for detail.`
  };

  if (!endpoint) {
    sendJson(res, 200, {
      ok: false,
      model,
      reply:
        "Aurexis is ready, but Ollama is not connected yet. Add OLLAMA_BASE_URL in Vercel, then I can reply through your Ollama server."
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }

    const ollamaResponse = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [system, ...messages],
        options: {
          temperature: Number(process.env.OLLAMA_TEMPERATURE || 0.72)
        }
      })
    });

    const data = await ollamaResponse.json().catch(() => ({}));

    if (!ollamaResponse.ok) {
      sendJson(res, 200, {
        ok: false,
        model,
        reply:
          data.error ||
          "I reached the Ollama connection, but it did not accept this request. Please check the model name and server URL."
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      model,
      reply: data.message?.content || data.response || "I am here with you. What should we build next?"
    });
  } catch (error) {
    const aborted = error?.name === "AbortError";
    sendJson(res, 200, {
      ok: false,
      model,
      reply: aborted
        ? "Ollama took too long to answer. Try a smaller model or check the server."
        : "I could not reach Ollama yet. Check OLLAMA_BASE_URL and make sure the server allows requests from this app."
    });
  } finally {
    clearTimeout(timeout);
  }
}
