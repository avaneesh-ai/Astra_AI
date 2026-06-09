import { cleanText, readJson, requireMethod, sendJson } from "../lib/api-utils.js";
import { extractProviderReply, getCandidateCreateEndpoints, getCreateHeaders, getCreateProviderBaseUrl } from "./provider-utils.js";

const DEFAULT_MODEL = "create-pied";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;

  const body = await readJson(req);
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const projectName = cleanText(body.projectName || "Astra_AI", 120);
  const model = cleanText(body.model || process.env.CREATE_MODEL || DEFAULT_MODEL, 80);
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
      `You are Aurexis, the friendly AI chatbot inside Astra_AI, powered by Create. ` +
      `Be warm, clear, practical, imaginative, and safe. The active project is "${projectName}".`
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    let lastError = "";
    for (const endpoint of getCandidateCreateEndpoints("chat")) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getCreateHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          projectName,
          friendlyMode: body.friendlyMode !== false,
          safetyMode: body.safetyMode !== false,
          messages: [system, ...messages],
          prompt: messages[messages.length - 1]?.content || ""
        })
      });

      const data = await response.json().catch(() => ({}));
      const reply = extractProviderReply(data);
      if (response.ok && reply) {
        sendJson(res, 200, {
          ok: true,
          model,
          provider: getCreateProviderBaseUrl(),
          reply
        });
        return;
      }
      lastError = data.error || data.message || `HTTP ${response.status}`;
    }

    sendJson(res, 200, {
      ok: false,
      model,
      provider: getCreateProviderBaseUrl(),
      reply:
        `Aurexis is linked to Create, but ${getCreateProviderBaseUrl()} does not expose a chat API I can use yet. ` +
        `Ask the Create app owner for the chat API endpoint, or add it as CREATE_CHAT_ENDPOINT. Last check: ${lastError}`
    });
  } catch (error) {
    sendJson(res, 200, {
      ok: false,
      model,
      provider: getCreateProviderBaseUrl(),
      reply:
        error?.name === "AbortError"
          ? "Create took too long to answer. Try again in a moment."
          : "I could not reach the Create provider yet. Check https://create-pied.vercel.app and redeploy if needed."
    });
  } finally {
    clearTimeout(timeout);
  }
}
