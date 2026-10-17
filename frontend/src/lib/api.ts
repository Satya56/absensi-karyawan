const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const tokenKey = "daymark_token";

export async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${api}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Something went wrong. Please try again.");
  }
  return response;
}

export const workDate = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: import.meta.env.VITE_ATTENDANCE_TIMEZONE || "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

