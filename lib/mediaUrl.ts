import { getApiUrl } from "./getApiUrl";

/** Turn stored `/uploads/...` or absolute URLs into a fetchable image URI. */
export function resolveMediaUrl(uri?: string | null): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (uri.startsWith("/")) return `${getApiUrl()}${uri}`;
  return uri;
}
