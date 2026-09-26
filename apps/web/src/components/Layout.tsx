import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { Avatar } from "./Avatar";
import { ChatIcon, HomeIcon, JournalIcon, LogoutIcon, ShieldIcon } from "./Icons";

const NAV = [
  { to: "/", label: "Home", Icon: HomeIcon, matches: (p: string) => p === "/" || p.startsWith("/bereiche") },
  { to: "/journal", label: "Journal", Icon: JournalIcon, matches: (p: string) => p.startsWith("/journal") },
  { to: "/urges", label: "Urges", Icon: ShieldIcon, matches: (p: string) => p.startsWith("/urges") },
  { to: "/coach", label: "Coach", Icon: ChatIcon, matches: (p: string) => p.startsWith("/coach") },
];

function NavItems() {
  const { pathname } = useLocation();
  return (
    <>
      {NAV.map(({ to, label, Icon, matches }) => (
        <NavLink
          key={to}
          to={to}
          className={matches(pathname) ? "nav-item active" : "nav-item"}
          aria-current={matches(pathname) ? "page" : undefined}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Meglio
          <svg width="64" height="9" viewBox="0 0 72 10" aria-hidden="true">
            <path d="M2 8C20 2 52 2 70 8" fill="none" stroke="#D12A24" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </div>
        <nav className="sidebar-nav" aria-label="Hauptnavigation">
          <NavItems />
        </nav>
        <div className="spacer" />
        <div className="sidebar-user">
          <NavLink to="/profil" className="sidebar-profile" aria-label="Profil öffnen">
            <Avatar />
            <div className="sidebar-user-text">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-mail">{user?.email}</div>
            </div>
          </NavLink>
          <button type="button" className="icon-button" onClick={logout} aria-label="Abmelden">
            <LogoutIcon size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <NavItems />
      </nav>
    </div>
  );
}
