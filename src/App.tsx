import { useState, type MouseEvent, type ReactNode } from "react";
import Icon from "./components/Icon";
import CommandCenterPage from "./pages/CommandCenterPage";
import MatchAnalyzerPage from "./pages/MatchAnalyzerPage";
import StratBoardPage from "./pages/StratBoardPage";
import DailyGamesPage from "./pages/DailyGamesPage";
import LoadoutPage from "./pages/LoadoutPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import { navigate, routeHref, routes, usePathname } from "./routes";
import AuthPanel from "./features/identity/AuthPanel";
import { useAuth } from "./features/identity/AuthProvider";

function handleRouteClick(event: MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(path);
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();
  const activeRoute = routes.find((route) => route.path === pathname) ?? (pathname.startsWith("/m/") ? routes[1] : pathname.startsWith("/strat-board/") ? routes[2] : pathname.startsWith("/users/") ? routes.find((route) => route.path === "/profile") : undefined);
  const [code, setCode] = useState("");
  const [budget, setBudget] = useState(250);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  let page: ReactNode;
  switch (pathname) {
    case "/":
      page = <CommandCenterPage code={code} setCode={setCode} budget={budget} setBudget={setBudget} notify={notify} navigate={navigate} />;
      break;
    case "/match-analyzer":
      page = <MatchAnalyzerPage code={code} setCode={setCode} notify={notify} />;
      break;
    case "/strat-board":
      page = <StratBoardPage notify={notify} />;
      break;
    case "/daily-games":
      page = <DailyGamesPage notify={notify} />;
      break;
    case "/loadout-lab":
      page = <LoadoutPage budget={budget} setBudget={setBudget} notify={notify} />;
      break;
    case "/admin":
      page = <AdminPage />;
      break;
    case "/profile":
      page = <ProfilePage notify={notify} />;
      break;
    default:
      page = pathname.startsWith("/m/") ? <MatchAnalyzerPage code={code} setCode={setCode} notify={notify} shareSlug={pathname.slice(3)} /> : pathname.startsWith("/strat-board/") ? <StratBoardPage notify={notify} roomCodeFromRoute={pathname.slice("/strat-board/".length)} /> : pathname.startsWith("/users/") ? <ProfilePage userId={pathname.slice("/users/".length)} notify={notify} /> : <NotFoundPage />;
  }

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? "sidebar sidebar-open" : "sidebar"}>
        <a className="brand" href={routeHref("/")} onClick={(event) => { handleRouteClick(event, "/"); setMobileOpen(false); }}>
          <div className="brand-mark"><Icon name="crosshair" size={22} /></div>
          <div><strong>CLUTCH</strong><span>LABS</span></div>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <p className="eyebrow">PLAYGROUND</p>
          {routes.filter((route) => (route.path !== "/admin" || user?.role === "ADMIN") && (route.path !== "/profile" || !!user)).map((route) => (
            <a
              className={pathname === route.path ? "nav-item active" : "nav-item"}
              href={routeHref(route.path)}
              key={route.path}
              aria-current={pathname === route.path ? "page" : undefined}
              onClick={(event) => { handleRouteClick(event, route.path); setMobileOpen(false); }}
            >
              <Icon name={route.icon} />
              <span>{route.label}</span>
              {route.label === "Daily games" && <i>3</i>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="live-pill"><span /> CS2 community</div>
          <button className="player" onClick={() => setAuthOpen(true)}>
            <div className="avatar">AK</div>
            <div><strong>{user?.username ?? "Anonymous"}</strong><span>{user ? user.role : "Sign in with Steam"}</span></div>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu"><Icon name="menu" /></button>
          <div>
            <p className="eyebrow">{activeRoute?.kicker ?? "UNKNOWN ROUTE"}</p>
            <h1>{activeRoute?.title ?? "Page not found"}</h1>
          </div>
          <div className="top-actions">
            <button className="steam-button" onClick={() => setAuthOpen(true)}>{authLoading ? "Loading…" : user ? user.username : "Sign In / Connect"} <Icon name="arrow" size={16} /></button>
            {user && (
              <button
                className="topbar-signout-btn"
                onClick={() => {
                  logout();
                  notify("Signed out successfully");
                }}
                title="Sign out of account"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        {page}

        <footer>
          <div><Icon name="crosshair" size={17} /><strong>CLUTCH LABS</strong></div>
          <p>Built for the rounds you’ll never live down.</p>
          <span>NOT AFFILIATED WITH VALVE CORP.</span>
        </footer>
      </main>

      {toast && <div className="toast"><span /><p>{toast}</p></div>}
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} notify={notify} />}
    </div>
  );
}
