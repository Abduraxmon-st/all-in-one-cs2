import { useState, type MouseEvent, type ReactNode } from "react";
import Icon from "./components/Icon";
import CommandCenterPage from "./pages/CommandCenterPage";
import MatchAnalyzerPage from "./pages/MatchAnalyzerPage";
import StratBoardPage from "./pages/StratBoardPage";
import DailyGamesPage from "./pages/DailyGamesPage";
import LoadoutPage from "./pages/LoadoutPage";
import NotFoundPage from "./pages/NotFoundPage";
import { navigate, routeHref, routes, usePathname } from "./routes";

function handleRouteClick(event: MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(path);
}

export default function App() {
  const pathname = usePathname();
  const activeRoute = routes.find((route) => route.path === pathname);
  const [code, setCode] = useState("");
  const [budget, setBudget] = useState(250);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

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
    default:
      page = <NotFoundPage />;
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
          {routes.map((route) => (
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
          <div className="live-pill"><span /> 2,841 online</div>
          <div className="player">
            <div className="avatar">AK</div>
            <div><strong>Anonymous</strong><span>Sign in with Steam</span></div>
            <Icon name="chevron" size={16} />
          </div>
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
            <div className="streak"><Icon name="bolt" size={15} /><strong>7</strong><span>day streak</span></div>
            <button className="steam-button" onClick={() => notify("Steam sign-in opened")}>Connect Steam <Icon name="arrow" size={16} /></button>
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
    </div>
  );
}
