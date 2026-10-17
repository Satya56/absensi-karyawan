import { useState } from "react";
import type { Employee } from "../types/attendance";
import EmployeeModal from "./EmployeeModal";

export default function EmployeesTable({
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
