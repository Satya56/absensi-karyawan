import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Home,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

type User = { employee_id: string; name: string; email: string; role: string };
type Entry = {
  attendance_id: string;
  employee_id?: string;
  employee_name?: string;
  email?: string;
  timestamp: string;
  is_clock_in: boolean;
  is_clock_out: boolean;
  distance_from_home_m?: number;
  outside_radius?: boolean;
  evidence_url: string;
};
type Employee = {
  employee_id: string;
  name: string;
  email: string;
  birth_date: string;
  address: string;
  address_latitude: number;
  address_longitude: number;
  role_name: string;
};
const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const workDate = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: import.meta.env.VITE_ATTENDANCE_TIMEZONE || "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
const tokenKey = "daymark_token";
async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${api}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Something went wrong. Please try again.");
  }
  return response;
}
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const raw = localStorage.getItem("daymark_user");
    if (raw) setUser(JSON.parse(raw));
    setBooting(false);
  }, []);
  const signOut = () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem("daymark_user");
    setUser(null);
  };
  if (booting) return null;
  if (!user) return <Login onLogin={setUser} />;
  return <Workspace user={user} onSignOut={signOut} />;
}

export default App;

function Login({ onLogin }: { onLogin: (user: User) => void }) {
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
          daymark
        </div>
        <div className="story-copy">
          <div className="eyebrow light-eye">
            <span /> YOUR WORKDAY, IN RHYTHM
          </div>
          <h1>
            Good work
            <br />
            leaves a <i>mark.</i>
          </h1>
          <p>
            A calmer way to keep your remote workday on track. Check in, find
            your flow, and get back to what matters.
          </p>
        </div>
        <div className="story-bottom">
          <span>Built for the way you work now.</span>
          <span>01 — 03</span>
        </div>
        <div className="orb orb-one" />
        <div className="orb orb-two" />
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-kicker">WELCOME BACK</div>
          <h2>Your workday starts here.</h2>
          <p className="subcopy">Sign in to manage your attendance.</p>
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
          DAYMARK <span>•</span> REMOTE WORK, IN GOOD TIME
        </footer>
      </section>
    </main>
  );
}

function Workspace({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const isHr = user.role === "human-resources";
  const [tab, setTab] = useState(isHr ? "Overview" : "My attendance");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    request(isHr ? "/attendances/review" : "/attendances/mine")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => {});
    if (isHr)
      request("/employees")
        .then((r) => r.json())
        .then(setEmployees)
        .catch(() => {});
  }, [isHr, refresh]);
  const items = isHr
    ? ["Overview", "Attendance", "Employees"]
    : ["My attendance"];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={18} />
          </span>{" "}
          daymark
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-pill">
          <div className="workspace-avatar">N</div>
          <span>
            <b>Northstar Studio</b>
            <small>Remote team</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">MENU</div>
        <nav>
          {items.map((item, i) => (
            <button
              onClick={() => setTab(item)}
              className={`nav-item ${tab === item ? "selected" : ""}`}
              key={item}
            >
              {i === 0 && !isHr ? (
                <Clock3 size={17} />
              ) : item === "Employees" ? (
                <Users size={17} />
              ) : item === "Attendance" ? (
                <MapPin size={17} />
              ) : (
                <Activity size={17} />
              )}{" "}
              {item}
              {item === "Attendance" && (
                <span className="nav-count">{entries.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <Compass size={17} />
            </div>
            <b>Working remotely?</b>
            <p>Your location is only used when you check in.</p>
            <div className="privacy-chip">
              <span /> Private by design
            </div>
          </div>
          <button className="profile" onClick={onSignOut}>
            <div className="profile-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <span>
              <b>{user.name}</b>
              <small>{isHr ? "Human resources" : "Employee"}</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <b>{tab}</b>
          </div>
          <div className="topbar-right">
            <span className="live-dot" /> <span>All systems normal</span>
            <div className="top-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> {dateLabel()}
              </div>
              <h1>
                {isHr
                  ? tab === "Employees"
                    ? "Your people"
                    : tab === "Attendance"
                      ? "Attendance review"
                      : "Team overview"
                  : "Make today count."}
              </h1>
              <p>
                {isHr
                  ? "A clear view of how your team is showing up."
                  : "One small check-in, then back to your best work."}
              </p>
            </div>
            {isHr && tab === "Employees" && (
              <button
                className="button primary"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} /> Add employee
              </button>
            )}
          </div>
          {isHr ? (
            tab === "Employees" ? (
              <EmployeesTable
                employees={employees}
                refresh={() => setRefresh((v) => v + 1)}
              />
            ) : (
              <HrDashboard
                entries={entries}
                employees={employees}
                setTab={setTab}
              />
            )
          ) : (
            <EmployeeHome
              user={user}
              entries={entries}
              refresh={() => setRefresh((v) => v + 1)}
            />
          )}
        </section>
      </main>
      {showForm && (
        <EmployeeModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setRefresh((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
function dateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();
}
function time(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";
}
function day(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function EmployeeHome({
  user,
  entries,
  refresh,
}: {
  user: User;
  entries: Entry[];
  refresh: () => void;
}) {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const today = entries.filter(
    (e) => workDate(new Date(e.timestamp)) === workDate(new Date()),
  );
  const checkedIn = today.some((e) => e.is_clock_in);
  const checkedOut = today.some((e) => e.is_clock_out);
  async function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError(
          "Location access is needed to record attendance. Check your browser permissions.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  async function openCamera() {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = s;
      setCamera(true);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError("Camera access is needed to take an attendance selfie.");
    }
  }
  useEffect(() => {
    if (camera && videoRef.current && streamRef.current)
      videoRef.current.srcObject = streamRef.current;
  }, [camera]);
  function snap() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCaptured(blob);
          setPreview(URL.createObjectURL(blob));
          closeCamera();
        }
      },
      "image/jpeg",
      0.88,
    );
  }
  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }
  async function submit(clockIn: boolean) {
    if (!coords || !captured) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("photo", captured, `selfie-${Date.now()}.jpg`);
      data.append("latitude", String(coords.latitude));
      data.append("longitude", String(coords.longitude));
      data.append("is_clock_in", String(clockIn));
      await request("/attendances/clock", { method: "POST", body: data });
      setCaptured(null);
      setPreview("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record attendance.");
    } finally {
      setBusy(false);
    }
  }
  const canClockIn = !checkedIn;
  const clockMode = canClockIn;
  return (
    <div className="employee-grid">
      <div className="left-column">
        <section className="welcome-card">
          <div className="welcome-top">
            <div>
              <span className="welcome-tag">
                <span /> YOUR PERSONAL WORKDAY
              </span>
              <h2>
                Hey, {user.name.split(" ")[0]} <span>✳</span>
              </h2>
              <p>Show up for yourself today. The rest follows.</p>
            </div>
            <div className="welcome-date">
              <strong>{new Date().getDate()}</strong>
              <span>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  weekday: "short",
                })
                  .format(new Date())
                  .toUpperCase()}
              </span>
            </div>
          </div>
          <div className="day-progress">
            <span>YOUR DAY</span>
            <div className="progress-line">
              <i
                style={{
                  width: checkedOut ? "100%" : checkedIn ? "55%" : "4%",
                }}
              />
            </div>
            <b>
              {checkedOut
                ? "COMPLETE"
                : checkedIn
                  ? "IN PROGRESS"
                  : "READY WHEN YOU ARE"}
            </b>
          </div>
        </section>
        <div className="section-title">
          <div>
            <h2>Today at a glance</h2>
            <p>Your check-ins, all in one place.</p>
          </div>
          <span className="today-chip">
            <span />
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(new Date())}
          </span>
        </div>
        <section className="stats-row">
          <div className={`stat-card ${checkedIn ? "done" : ""}`}>
            <div className="stat-icon coral">
              <ArrowDownLeft size={19} />
            </div>
            <div>
              <small>CHECK IN</small>
              <strong>
                {time(today.find((e) => e.is_clock_in)?.timestamp)}
              </strong>
              <span>
                {checkedIn ? "You’re checked in" : "Not yet recorded"}
              </span>
            </div>
            <div className="stat-marker">
              {checkedIn ? <Check size={15} /> : <span />}
            </div>
          </div>
          <div className={`stat-card ${checkedOut ? "done" : ""}`}>
            <div className="stat-icon blue">
              <ArrowUpRight size={19} />
            </div>
            <div>
              <small>CHECK OUT</small>
              <strong>
                {time(today.find((e) => e.is_clock_out)?.timestamp)}
              </strong>
              <span>{checkedOut ? "Day wrapped up" : "Coming up later"}</span>
            </div>
            <div className="stat-marker">
              {checkedOut ? <Check size={15} /> : <span />}
            </div>
          </div>
        </section>
        <section className="activity-card">
          <div className="activity-head">
            <div>
              <h2>Recent activity</h2>
              <p>A little consistency goes a long way.</p>
            </div>
            <span className="count-pill">{entries.length} TOTAL</span>
          </div>
          {entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Clock3 size={20} />
              </div>
              <b>Your story starts today.</b>
              <span>Your attendance history will show up here.</span>
            </div>
          ) : (
            <div className="activity-list">
              {entries.slice(0, 6).map((e) => (
                <div className="activity-row" key={e.attendance_id}>
                  <div
                    className={`activity-symbol ${e.is_clock_in ? "in" : "out"}`}
                  >
                    {e.is_clock_in ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>
                  <div className="activity-label">
                    <b>{e.is_clock_in ? "Clock in" : "Clock out"}</b>
                    <span>{day(e.timestamp)}</span>
                  </div>
                  <time>{time(e.timestamp)}</time>
                  <button className="text-button" onClick={() => viewPhoto(e)}>
                    View photo
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="right-column">
        <section className="check-card">
          <div className="check-card-head">
            <div>
              <div className="eyebrow">
                <span /> ATTENDANCE
              </div>
              <h2>
                {checkedOut
                  ? "See you tomorrow."
                  : checkedIn
                    ? "Your day is underway."
                    : "Ready to check in?"}
              </h2>
              <p>
                {checkedOut
                  ? "Your attendance is complete for today."
                  : checkedIn
                    ? "Remember to check out when you wrap up."
                    : "Share your location and take a quick selfie."}
              </p>
            </div>
            <div className="check-illustration">
              <div className="illustration-circle">
                <Home size={22} />
              </div>
              <span className="spark spark-a">✳</span>
              <span className="spark spark-b">✦</span>
            </div>
          </div>
          <div className="check-steps">
            <button
              className={`step-row ${coords ? "complete" : ""}`}
              onClick={locate}
              disabled={locating || checkedOut}
            >
              <div className="step-icon">
                <MapPin size={17} />
              </div>
              <span>
                <b>
                  {locating
                    ? "Finding your location…"
                    : coords
                      ? "Location ready"
                      : "Share your location"}
                </b>
                <small>
                  {coords
                    ? "Location captured for this check-in"
                    : "Used only to verify your check-in"}
                </small>
              </span>
              {coords ? (
                <Check className="step-check" size={17} />
              ) : (
                <ArrowUpRight className="step-arrow" size={16} />
              )}
            </button>
            <button
              className={`step-row ${captured ? "complete" : ""}`}
              onClick={
                captured
                  ? () => {
                      setCaptured(null);
                      setPreview("");
                    }
                  : openCamera
              }
              disabled={checkedOut}
            >
              <div className="step-icon">
                <Camera size={17} />
              </div>
              <span>
                <b>{captured ? "Selfie captured" : "Take a quick selfie"}</b>
                <small>
                  {captured
                    ? "Tap to retake your selfie"
                    : "Camera is only on for the photo"}
                </small>
              </span>
              {captured ? (
                <Check className="step-check" size={17} />
              ) : (
                <ArrowUpRight className="step-arrow" size={16} />
              )}
            </button>
          </div>
          {preview && (
            <img
              className="selfie-preview"
              src={preview}
              alt="Captured attendance selfie"
            />
          )}
          {camera && (
            <div className="camera-panel">
              <video ref={videoRef} autoPlay playsInline />
              <div>
                <button className="button secondary" onClick={closeCamera}>
                  Cancel
                </button>
                <button className="button primary" onClick={snap}>
                  <Camera size={16} /> Capture
                </button>
              </div>
            </div>
          )}
          {error && <div className="error-note compact">{error}</div>}
          <button
            className="button primary full check-submit"
            disabled={!coords || !captured || busy || checkedOut}
            onClick={() => void submit(clockMode)}
          >
            {busy
              ? "Recording…"
              : checkedOut
                ? "Attendance complete"
                : clockMode
                  ? "Confirm check in"
                  : "Confirm check out"}{" "}
            {!checkedOut && <ArrowUpRight size={17} />}
          </button>
          <div className="check-privacy">
            <ShieldCheck size={14} /> Your photo and location are shared with HR
          </div>
        </section>
        <section className="quote-card">
          <span className="quote-mark">“</span>
          <p>Small rituals create space for the big things.</p>
          <span className="quote-credit">A GOOD WAY TO BEGIN</span>
          <div className="quote-dots">
            <i />
            <i />
            <i />
          </div>
        </section>
        <div className="help-note">
          <div className="help-icon">?</div>
          <span>
            <b>Need a hand?</b>
            <small>Reach out to your HR team for support.</small>
          </span>
          <ArrowUpRight size={15} />
        </div>
      </div>
    </div>
  );
}
async function viewPhoto(entry: Entry) {
  try {
    const response = await request(entry.evidence_url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {}
}

function HrDashboard({
  entries,
  employees,
  setTab,
}: {
  entries: Entry[];
  employees: Employee[];
  setTab: (tab: string) => void;
}) {
  const today = entries.filter(
    (e) => workDate(new Date(e.timestamp)) === workDate(new Date()),
  );
  const present = new Set(
    today.filter((e) => e.is_clock_in).map((e) => e.employee_id),
  ).size;
  const flags = today.filter((e) => e.outside_radius).length;
  return (
    <>
      <div className="hr-summary">
        <div className="metric-card">
          <div className="metric-top">
            <span>TEAM MEMBERS</span>
            <div className="metric-icon violet">
              <Users size={17} />
            </div>
          </div>
          <strong>{employees.length.toString().padStart(2, "0")}</strong>
          <small>Active employee records</small>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>CHECKED IN TODAY</span>
            <div className="metric-icon green">
              <Check size={17} />
            </div>
          </div>
          <strong>
            {present.toString().padStart(2, "0")}
            <em> / {employees.length.toString().padStart(2, "0")}</em>
          </strong>
          <small>Employees with a check-in</small>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>LOCATION FLAGS</span>
            <div className="metric-icon orange">
              <MapPin size={17} />
            </div>
          </div>
          <strong>{flags.toString().padStart(2, "0")}</strong>
          <small>Outside the 2 km radius today</small>
        </div>
      </div>
      <div className="section-title hr-section-title">
        <div>
          <h2>Latest attendance</h2>
          <p>Review your team’s recent check-ins.</p>
        </div>
        <button className="text-button" onClick={() => setTab("Attendance")}>
          View all <ArrowUpRight size={15} />
        </button>
      </div>
      <AttendanceTable entries={entries.slice(0, 6)} />
      <div className="hr-footnote">
        <ShieldCheck size={15} /> Attendance photos and exact locations are
        visible to HR only.
      </div>
    </>
  );
}

function AttendanceTable({ entries }: { entries: Entry[] }) {
  if (!entries.length)
    return <div className="table-empty">No attendance submissions yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>EMPLOYEE</th>
            <th>DATE & TIME</th>
            <th>TYPE</th>
            <th>DISTANCE FROM HOME</th>
            <th>REVIEW</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.attendance_id}>
              <td>
                <div className="table-person">
                  <div className="mini-avatar">
                    {(e.employee_name || "?").slice(0, 1)}
                  </div>
                  <span>
                    <b>{e.employee_name}</b>
                    <small>{e.email}</small>
                  </span>
                </div>
              </td>
              <td>
                <b>{day(e.timestamp)}</b>
                <small className="table-time">{time(e.timestamp)}</small>
              </td>
              <td>
                <span
                  className={`type-pill ${e.is_clock_in ? "type-in" : "type-out"}`}
                >
                  {e.is_clock_in ? "Check in" : "Check out"}
                </span>
              </td>
              <td>{e.distance_from_home_m?.toLocaleString()} m</td>
              <td>
                {e.outside_radius ? (
                  <span className="review-pill flagged">
                    <span />
                    Outside 2 km
                  </span>
                ) : (
                  <span className="review-pill okay">
                    <Check size={12} /> Within radius
                  </span>
                )}
              </td>
              <td>
                <button
                  className="table-action"
                  onClick={() => viewPhoto(e)}
                  aria-label="View attendance photo"
                >
                  <Camera size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeesTable({
  employees,
  refresh,
}: {
  employees: Employee[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Employee | null>(null);
  return (
    <>
      <div className="section-title employee-list-title">
        <div>
          <h2>Team directory</h2>
          <p>{employees.length} employee records, managed in one place.</p>
        </div>
      </div>
      {employees.length === 0 ? (
        <div className="table-empty">
          No employees yet. Add your first employee to get started.
        </div>
      ) : (
        <div className="table-wrap employee-table">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th>HOME LOCATION</th>
                <th>EMAIL</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.employee_id}>
                  <td>
                    <div className="table-person">
                      <div className="mini-avatar">{e.name.slice(0, 1)}</div>
                      <span>
                        <b>{e.name}</b>
                        <small>{e.employee_id.slice(0, 8)}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`role-pill ${e.role_name === "human-resources" ? "role-hr" : ""}`}
                    >
                      {e.role_name === "human-resources"
                        ? "Human resources"
                        : "Employee"}
                    </span>
                  </td>
                  <td>
                    {e.address_latitude.toFixed(3)},{" "}
                    {e.address_longitude.toFixed(3)}
                  </td>
                  <td>{e.email}</td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => setEditing(e)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <EmployeeModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function EmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee?: Employee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    password: "",
    birth_date: employee?.birth_date?.slice(0, 10) || "",
    address: employee?.address || "",
    address_latitude: employee?.address_latitude?.toString() || "",
    address_longitude: employee?.address_longitude?.toString() || "",
    role_name: employee?.role_name || "employee",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        address_latitude: Number(form.address_latitude),
        address_longitude: Number(form.address_longitude),
      };
      await request(
        employee ? `/employees/${employee.employee_id}` : "/employees",
        { method: employee ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save employee.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="employee-modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow">
              <span /> TEAM DIRECTORY
            </div>
            <h2>{employee ? "Edit employee" : "Add an employee"}</h2>
            <p>Set up their work profile and home location.</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Full name
              <input
                name="name"
                required
                minLength={2}
                value={form.name}
                onChange={change}
                placeholder="Employee name"
              />
            </label>
            <label>
              Work email
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={change}
                placeholder="name@company.com"
              />
            </label>
            <label>
              {employee ? "New password (optional)" : "Temporary password"}
              <input
                name="password"
                type="password"
                minLength={8}
                required={!employee}
                value={form.password}
                onChange={change}
                placeholder={
                  employee
                    ? "Leave blank to keep current"
                    : "At least 8 characters"
                }
              />
            </label>
            <label>
              Date of birth
              <input
                name="birth_date"
                type="date"
                required
                value={form.birth_date}
                onChange={change}
              />
            </label>
            <label className="span-two">
              Home address
              <input
                name="address"
                required
                value={form.address}
                onChange={change}
                placeholder="Street, city, country"
              />
            </label>
            <label>
              Home latitude
              <input
                name="address_latitude"
                type="number"
                step="any"
                required
                value={form.address_latitude}
                onChange={change}
                placeholder="e.g. -6.2088"
              />
            </label>
            <label>
              Home longitude
              <input
                name="address_longitude"
                type="number"
                step="any"
                required
                value={form.address_longitude}
                onChange={change}
                placeholder="e.g. 106.8456"
              />
            </label>
            <label className="span-two">
              Access role
              <select name="role_name" value={form.role_name} onChange={change}>
                <option value="employee">Employee</option>
                <option value="human-resources">Human resources</option>
              </select>
            </label>
          </div>
          {error && <div className="error-note">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : employee ? "Save changes" : "Add employee"}{" "}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
