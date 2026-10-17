import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import type { Employee } from "../types/attendance";
import { request } from "../lib/api";

export default function EmployeeModal({
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
