import { useState } from "react";
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react";
import type { User } from "../types/attendance";
import { request, tokenKey } from "../lib/api";

export default function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      localStorage.setItem(tokenKey, data.accessToken);
      localStorage.setItem("daymark_user", JSON.stringify(data.employee));
      onLogin(data.employee);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <div className="brand light">
          <span className="brand-mark">
            <Activity size={19} />
          </span>{" "}
          HRIS
        </div>
        <div className="story-copy">
          <div className="eyebrow light-eye">
            <span /> Employee Attendance <em>Management</em>
          </div>
          <h1>
            Track team’s attendance.
          </h1>
          <p>
           Employee Attendance Tracking System
          </p>
        </div>
        <div className="story-bottom">
          <span>Attendance tracking made simple.</span>
          <span>01 — 03</span>
        </div>
        <div className="orb orb-one" />
        <div className="orb orb-two" />
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-kicker">WELCOME BACK</div>
          <p className="subcopy">Please sign in</p>
          <form onSubmit={submit}>
            <label>
              Work email
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <div className="error-note">{error}</div>}
            <button className="button primary full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="secure-note">
            <ShieldCheck size={15} /> Your account is protected with secure
            sign-in
          </div>
        </div>
        <footer>
          HRIS <span>•</span> 2024 <span>•</span> Made by company
        </footer>
      </section>
    </main>
  );
}
