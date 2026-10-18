import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Check,
  Clock3,
  Home,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Entry, User } from "../types/attendance";
import { request, workDate } from "../lib/api";
import { day, time } from "../lib/format";
import { viewPhoto } from "../lib/viewPhoto";

export default function EmployeeAttendancePage({
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
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationIssue, setLocationIssue] = useState<
    "denied" | "unavailable" | "unsupported" | null
  >(null);
  const [proceedWithoutLocation, setProceedWithoutLocation] = useState(false);
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
  function openLocationPrompt() {
    setError("");
    setLocationIssue(null);
    setProceedWithoutLocation(false);
    setShowLocationPrompt(true);
  }
  function locate() {
    setLocationIssue(null);
    if (!navigator.geolocation) {
      setLocationIssue("unsupported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setProceedWithoutLocation(false);
        setLocating(false);
        setShowLocationPrompt(false);
      },
      (positionError) => {
        setLocationIssue(
          positionError.code === positionError.PERMISSION_DENIED
            ? "denied"
            : "unavailable",
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
    if ((!coords && !proceedWithoutLocation) || !captured) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("photo", captured, `selfie-${Date.now()}.jpg`);
      if (coords) {
        data.append("latitude", String(coords.latitude));
        data.append("longitude", String(coords.longitude));
      }
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
              className={`step-row ${coords || proceedWithoutLocation ? "complete" : ""}`}
              onClick={openLocationPrompt}
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
                    : proceedWithoutLocation
                      ? "HR will review this attendance without a location"
                      : "Used only to verify your check-in"}
                </small>
              </span>
              {coords || proceedWithoutLocation ? (
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
            disabled={
              (!coords && !proceedWithoutLocation) ||
              !captured ||
              busy ||
              checkedOut
            }
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
            <ShieldCheck size={14} /> Your photo and attendance details are shared with HR
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
      {showLocationPrompt && (
        <div className="modal-backdrop location-backdrop">
          <section
            className="location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-dialog-title"
          >
            <div className="location-modal-top">
              <div className="location-modal-icon">
                <MapPin size={20} />
              </div>
              <button
                className="icon-button"
                onClick={() => setShowLocationPrompt(false)}
                aria-label="Close location prompt"
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="location-dialog-title">
              {locationIssue === "denied"
                ? "Allow location in your browser"
                : locationIssue === "unsupported"
                  ? "Location isn’t available"
                  : locationIssue === "unavailable"
                    ? "Couldn’t get your location"
                    : "Enable browser location"}
            </h2>
            <p className="location-modal-copy">
              {locationIssue === "denied"
                ? "Location access is blocked for this site. Change the site’s location permission, then try again."
                : locationIssue === "unsupported"
                  ? "This browser doesn’t support location sharing. Open HRIS in a current browser over HTTPS or localhost."
                  : locationIssue === "unavailable"
                    ? "Your device couldn’t determine its location. Check that device location services are on, then try again."
                    : "Your browser will ask for permission to share your location. We use it only to verify this attendance check-in."}
            </p>
            {locationIssue === "denied" && (
              <div className="location-guidance">
                Select the site controls beside the address bar, open site
                settings, and change Location to Allow. Then choose Try again.
              </div>
            )}
            <div className="location-modal-actions">
              <button
                className="button secondary"
                onClick={() => setShowLocationPrompt(false)}
              >
                Close
              </button>
              {locationIssue !== "unsupported" && (
                <button
                  className="button primary"
                  onClick={locate}
                  disabled={locating}
                >
                  {locating
                    ? "Waiting for browser…"
                    : locationIssue
                      ? "Try again"
                      : "Enable location"}
                  {!locating && <ArrowUpRight size={16} />}
                </button>
              )}
              {locationIssue && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setProceedWithoutLocation(true);
                    setCoords(null);
                    setShowLocationPrompt(false);
                  }}
                >
                  Continue without location
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
