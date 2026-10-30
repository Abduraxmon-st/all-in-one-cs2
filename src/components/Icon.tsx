import type { ReactNode } from "react";

export type IconName =
  | "bolt"
  | "upload"
  | "target"
  | "map"
  | "game"
  | "layers"
  | "clock"
  | "users"
  | "arrow"
  | "spark"
  | "crosshair"
  | "play"
  | "chevron"
  | "menu";

const iconPaths: Record<IconName, ReactNode> = {
  bolt: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" />,
  upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 15v4h14v-4" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  map: <><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></>,
  game: <><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-.9 2.5a2.4 2.4 0 0 1-4 1L14 16h-4l-1.8 2.2a2.4 2.4 0 0 1-4-1l-.9-2.5A5 5 0 0 1 8 8Z" /><path d="M8 11v4m-2-2h4m6-1h.01m2 2h.01" /></>,
  layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 12 9 5 9-5m-18 4 9 5 9-5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3" /><path d="M17 10a3 3 0 0 1 0 6m1.5 4a3.5 3.5 0 0 0-2-3.2" /></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
  spark: <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Zm7 14 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />,
  crosshair: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></>,
  play: <path d="m9 7 8 5-8 5V7Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}
