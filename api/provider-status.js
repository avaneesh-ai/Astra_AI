import { requireMethod, sendJson } from "../lib/api-utils.js";
import { getCreateEndpoint, getCreateHeaders, getCreateProviderBaseUrl } from "./provider-utils.js";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "GET")) return;

  const provider = getCreateProviderBaseUrl();
  const endpoint = getCreateEndpoint("/api/chat");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getCreateHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.CREATE_MODEL || "create-pied",
        stream: false,
        messages: [{ role: "user", content: "Reply with OK." }],
        prompt: "Reply with OK."
      })
    });

    const data = await response.json().catch(() => ({}));
    sendJson(res, 200, {
      ok: response.ok,
      provider,
      endpoint,
      message: response.ok ? "Create provider connected." : data.error || data.message || `Create provider returned HTTP ${response.status}.`
    });
  } catch (error) {
    sendJson(res, 200, {
      ok: false,
      provider,
      endpoint,
      message:
        error?.name === "AbortError"
          ? "Create provider timed out."
          : "Could not reach the Create provider. Check CREATE_PROVIDER_URL or https://create-pied.vercel.app."
    });
  } finally {
    clearTimeout(timeout);
  }
}
