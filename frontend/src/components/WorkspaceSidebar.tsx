import {
  Activity,
  ChevronDown,
  Clock3,
  Compass,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import type { User } from "../types/attendance";

type WorkspaceSidebarProps = {
  user: User;
  isHr: boolean;
  items: string[];
  activeTab: string;
  attendanceCount: number;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
};

export default function WorkspaceSidebar({
  user,
  isHr,
  items,
  activeTab,
  attendanceCount,
  onTabChange,
  onSignOut,
}: WorkspaceSidebarProps) {
  return (
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
        {items.map((item, index) => (
          <button
            onClick={() => onTabChange(item)}
            className={`nav-item ${activeTab === item ? "selected" : ""}`}
            key={item}
          >
            {index === 0 && !isHr ? (
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
              <span className="nav-count">{attendanceCount}</span>
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
  );
}
