import { LogOut } from "lucide-react";

type WorkspaceTopbarProps = {
  activeTab: string;
  employeeName: string;
  onSignOut: () => void;
};

export default function WorkspaceTopbar({
  activeTab,
  employeeName,
  onSignOut,
}: WorkspaceTopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        Workspace <span>/</span> <b>{activeTab}</b>
      </div>
      <div className="topbar-right">
        <span className="live-dot" /> <span>All systems normal</span>
        <div className="top-avatar">
          {employeeName.slice(0, 1).toUpperCase()}
        </div>
        <button
          className="signout-button"
          onClick={onSignOut}
          aria-label="Sign out"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
