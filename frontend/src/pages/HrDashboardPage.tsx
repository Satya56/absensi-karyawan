import { ArrowUpRight, Check, MapPin, ShieldCheck, Users } from "lucide-react";
import type { Employee, Entry } from "../types/attendance";
import { workDate } from "../lib/api";
import AttendanceTable from "../components/AttendanceTable";

export default function HrDashboardPage({
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
  const flags = today.filter(
    (e) => e.outside_radius || e.location_unavailable,
  ).length;
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
          <small>Outside radius or location unavailable today</small>
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
