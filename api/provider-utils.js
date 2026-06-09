import { cleanText } from "../lib/api-utils.js";

export const DEFAULT_CREATE_PROVIDER_URL = "https://create-pied.vercel.app";

export function getCreateProviderBaseUrl() {
  return cleanText(
    process.env.CREATE_PROVIDER_URL ||
      process.env.CREATE_API_URL ||
      process.env.ASTRA_PROVIDER_URL ||
      DEFAULT_CREATE_PROVIDER_URL,
    400
  )
    .replace(/#.*$/, "")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
}

export function getCreateEndpoint(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCreateProviderBaseUrl()}${cleanPath}`;
}

export function getCreateHeaders() {
  const headers = { "Content-Type": "application/json" };
  const apiKey = process.env.CREATE_API_KEY || process.env.CREATE_PROVIDER_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export function extractProviderReply(data) {
  if (!data) return "";
  if (typeof data.reply === "string") return data.reply;
  if (typeof data.response === "string") return data.response;
  if (typeof data.output === "string") return data.output;
  if (typeof data.text === "string") return data.text;
  if (typeof data.message === "string") return data.message;
  if (typeof data.message?.content === "string") return data.message.content;
  if (Array.isArray(data.choices) && typeof data.choices[0]?.message?.content === "string") {
    return data.choices[0].message.content;
  }
  if (Array.isArray(data.choices) && typeof data.choices[0]?.text === "string") {
    return data.choices[0].text;
  }
  return "";
}

export function extractProviderImage(data) {
  if (!data) return "";
  if (typeof data.image === "string") return data.image;
  if (typeof data.url === "string") return data.url;
  if (typeof data.output === "string") return data.output;
  if (Array.isArray(data.data) && data.data[0]?.url) return data.data[0].url;
  if (Array.isArray(data.data) && data.data[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (Array.isArray(data.images) && data.images[0]) return data.images[0];
  return "";
}
