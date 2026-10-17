import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Employee, Entry, User } from "../types/attendance";
import { request } from "../lib/api";
import { dateLabel } from "../lib/format";
import EmployeeAttendancePage from "./EmployeeAttendancePage";
import HrDashboardPage from "./HrDashboardPage";
import EmployeesTable from "../components/EmployeesTable";
import EmployeeModal from "../components/EmployeeModal";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import WorkspaceTopbar from "../components/WorkspaceTopbar";

type WorkspacePageProps = {
  user: User;
  onSignOut: () => void;
};

export default function WorkspacePage({
  user,
  onSignOut,
}: WorkspacePageProps) {
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
      <WorkspaceSidebar
        user={user}
        isHr={isHr}
        items={items}
        activeTab={tab}
        attendanceCount={entries.length}
        onTabChange={setTab}
        onSignOut={onSignOut}
      />
      <main className="main-area">
        <WorkspaceTopbar
          activeTab={tab}
          employeeName={user.name}
          onSignOut={onSignOut}
        />
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
              <HrDashboardPage
                entries={entries}
                employees={employees}
                setTab={setTab}
              />
            )
          ) : (
            <EmployeeAttendancePage
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
