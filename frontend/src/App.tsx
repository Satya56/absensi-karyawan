import { useEffect, useState } from "react";
import type { User } from "./types/attendance";
import { tokenKey } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import WorkspacePage from "./pages/WorkspacePage";

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
  if (!user) return <LoginPage onLogin={setUser} />;
  return <WorkspacePage user={user} onSignOut={signOut} />;
}

export default App;
