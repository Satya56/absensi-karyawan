import { useState } from "react";
import { Camera, Check, MapPin } from "lucide-react";
import type { Entry } from "../types/attendance";
import { day, time } from "../lib/format";
import AttendancePhotoDialog from "./AttendancePhotoDialog";

export default function AttendanceTable({ entries }: { entries: Entry[] }) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

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
              <td>
                {e.location_unavailable || e.distance_from_home_m == null
                  ? "Unavailable"
                  : `${e.distance_from_home_m.toLocaleString()} m`}
              </td>
              <td>
                {e.location_unavailable || e.distance_from_home_m == null ? (
                  <span className="review-pill flagged">
                    <MapPin size={12} /> Location unavailable
                  </span>
                ) : e.outside_radius ? (
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
                  onClick={() => setSelectedEntry(e)}
                  aria-label="View attendance photo"
                >
                  <Camera size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedEntry && (
        <AttendancePhotoDialog
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
