// Shared by redirectWithFlash() (server) and the dashboard's toaster
// (client): a one-shot message carried across a redirect.
export const FLASH_COOKIE = "admin-flash";

export interface Flash {
  tone: "success" | "error";
  message: string;
}

export function serializeFlash(flash: Flash): string {
  return encodeURIComponent(JSON.stringify(flash));
}

export function parseFlash(raw: string): Flash | null {
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<Flash>;
    if ((value.tone === "success" || value.tone === "error") && typeof value.message === "string") {
      return { tone: value.tone, message: value.message.slice(0, 300) };
    }
  } catch {
    // Malformed cookie — ignore.
  }
  return null;
}
