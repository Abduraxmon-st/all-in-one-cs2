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
  | "menu"
  | "smoke"
  | "flash"
  | "molotov"
  | "he"
  | "player"
  | "ct"
  | "t"
  | "select"
  | "pencil"
  | "undo"
  | "trash";

const iconPaths: Record<IconName, ReactNode> = {
  bolt: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" />,
  upload: (
    <>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M5 15v4h14v-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" />
      <path d="M8 3v15m8-12v15" />
    </>
  ),
  game: (
    <>
      <path d="M8 8h8a5 5 0 0 1 4.7 6.7l-.9 2.5a2.4 2.4 0 0 1-4 1L14 16h-4l-1.8 2.2a2.4 2.4 0 0 1-4-1l-.9-2.5A5 5 0 0 1 8 8Z" />
      <path d="M8 11v4m-2-2h4m6-1h.01m2 2h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3-9 5 9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5m-18 4 9 5 9-5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3" />
      <path d="M17 10a3 3 0 0 1 0 6m1.5 4a3.5 3.5 0 0 0-2-3.2" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  spark: (
    <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Zm7 14 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </>
  ),
  play: <path d="m9 7 8 5-8 5V7Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  // Tactical Strat Board Icons
  smoke: (
    <>
      <path d="M7 16a4 4 0 0 1-.88-7.9 5 5 0 0 1 9.76-1.3A4 4 0 0 1 18 16H7Z" />
      <path d="M8 12c1-1 3-1 4 0m-1 2c1 1 3 1 4 0" strokeWidth="1.4" />
    </>
  ),
  flash: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-15.07-7.07 2.12 2.12m9.9 9.9 2.12 2.12m-14.14 0 2.12-2.12m9.9-9.9 2.12-2.12" />
    </>
  ),
  molotov: (
    <>
      <path d="M12 2c1.5 2.2 4 4.8 4 8.2a6 6 0 1 1-12 0c0-3.4 2.5-6 4-8.2 1 2 2 3 4 3 0-2 0-3 0-3Z" />
      <path d="M12 12c.8 1 2 2 2 3.5a2 2 0 1 1-4 0c0-1.5 1.2-2.5 2-3.5Z" />
    </>
  ),
  he: (
    <>
      <path d="M12 7a5 5 0 0 0-5 5c0 3 2.5 6 5 8 2.5-2 5-5 5-8a5 5 0 0 0-5-5Z" />
      <path d="M10 3h4v4h-4zM7 12h10M8 16h8M12 7v13" />
    </>
  ),
  player: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </>
  ),
  ct: (
    <>
      <path d="M12 2 4 5v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V5l-8-3Z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  t: (
    <>
      <path d="m12 2 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 16.3 6.4 19.2l1.1-6.2-4.5-4.4 6.2-.9L12 2Z" />
    </>
  ),
  select: <path d="m4 4 6.5 15.5 2.5-5.5 5.5-2.5L4 4Z" />,
  pencil: <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />,
  undo: (
    <>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6" />
    </>
  ),
};

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}
