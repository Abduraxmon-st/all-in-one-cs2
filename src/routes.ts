import { useEffect, useState } from "react";
import type { IconName } from "./components/Icon";

export const routes: { path: string; label: string; icon: IconName; kicker: string; title: string }[] = [
  { path: "/", label: "Command center", icon: "bolt", kicker: "GOOD EVENING, PLAYER", title: "Ready to lock in?" },
  { path: "/match-analyzer", label: "Match analyzer", icon: "target", kicker: "DEMO INTELLIGENCE", title: "Match analyzer" },
  { path: "/strat-board", label: "Strat board", icon: "map", kicker: "LIVE TEAM SESSION", title: "Strat board" },
  { path: "/daily-games", label: "Daily games", icon: "game", kicker: "DAILY CHALLENGE", title: "Guess the Elo" },
  { path: "/loadout-lab", label: "Loadout lab", icon: "layers", kicker: "CATALOG & COMMUNITY", title: "Loadout lab" },
];

const basePath = new URL(import.meta.env.BASE_URL, "http://localhost").pathname.replace(/\/$/, "");
const routeChangeEvent = "clutch-labs-route-change";

export function routeHref(path: string): string {
  return `${basePath}${path}` || "/";
}

function currentPath(): string {
  let path = window.location.pathname;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    path = path.slice(basePath.length) || "/";
  }
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

export function navigate(path: string): void {
  window.history.pushState({}, "", routeHref(path));
  window.dispatchEvent(new Event(routeChangeEvent));
  window.scrollTo(0, 0);
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(currentPath);
  useEffect(() => {
    const update = () => setPathname(currentPath());
    window.addEventListener("popstate", update);
    window.addEventListener(routeChangeEvent, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(routeChangeEvent, update);
    };
  }, []);
  return pathname;
}
