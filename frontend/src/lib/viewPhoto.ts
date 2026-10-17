import type { Entry } from "../types/attendance";
import { request } from "./api";

export async function viewPhoto(entry: Entry) {
  try {
    const response = await request(entry.evidence_url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    // The API error is intentionally not surfaced from this optional preview action.
  }
}
