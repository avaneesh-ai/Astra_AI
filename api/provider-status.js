import { requireMethod, sendJson } from "../lib/api-utils.js";
import { extractProviderReply, getCandidateCreateEndpoints, getCreateHeaders, getCreateProviderBaseUrl } from "./provider-utils.js";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "GET")) return;

  const provider = getCreateProviderBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let lastMessage = "";
    for (const endpoint of getCandidateCreateEndpoints("chat")) {
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
      if (response.ok && extractProviderReply(data)) {
        sendJson(res, 200, {
          ok: true,
          provider,
          endpoint,
          message: "Create chat API connected."
        });
        return;
      }
      lastMessage = data.error || data.message || `HTTP ${response.status}`;
    }

    const siteResponse = await fetch(provider, {
      method: "GET",
      signal: controller.signal
    });

    sendJson(res, 200, {
      ok: siteResponse.ok,
      provider,
      endpoint: provider,
      apiReady: false,
      message: siteResponse.ok
        ? `Create site is linked, but I could not find a public chat API. Last API check: ${lastMessage}`
        : `Create site returned HTTP ${siteResponse.status}.`
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
