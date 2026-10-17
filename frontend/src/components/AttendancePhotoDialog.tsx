import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Entry } from "../types/attendance";
import { day, time } from "../lib/format";
import { request } from "../lib/api";

type AttendancePhotoDialogProps = {
  entry: Entry;
  onClose: () => void;
};

export default function AttendancePhotoDialog({
  entry,
  onClose,
}: AttendancePhotoDialogProps) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadPhoto() {
      try {
        const response = await request(entry.evidence_url);
        const photo = await response.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(photo);
        setPhotoUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setError("This attendance photo could not be loaded.");
        }
      }
    }

    void loadPhoto();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.evidence_url]);

  return (
    <div
      className="modal-backdrop photo-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="photo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-photo-title"
      >
        <div className="photo-dialog-header">
          <div>
            <div className="eyebrow">
              <span /> ATTENDANCE EVIDENCE
            </div>
            <h2 id="attendance-photo-title">
              {entry.employee_name || "Employee"}
            </h2>
            <p>
              {day(entry.timestamp)} · {time(entry.timestamp)} ·{" "}
              {entry.is_clock_in ? "Check in" : "Check out"}
            </p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close attendance photo"
          >
            <X size={18} />
          </button>
        </div>
        {photoUrl ? (
          <img
            className="attendance-photo"
            src={photoUrl}
            alt={`Attendance selfie from ${entry.employee_name || "employee"}`}
          />
        ) : error ? (
          <div className="photo-message error-note">{error}</div>
        ) : (
          <div className="photo-message">Loading attendance photo…</div>
        )}
      </section>
    </div>
  );
}
