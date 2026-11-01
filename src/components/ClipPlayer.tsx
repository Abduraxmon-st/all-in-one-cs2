import { useMemo, useState } from "react";
import type { ChallengeRound } from "../features/minigames/types";
import "./ClipPlayer.css";

export type VideoPlatform = "YOUTUBE" | "TWITCH" | "MEDAL" | "DIRECT" | "EXTERNAL";

export interface ClipPlayerProps {
  round?: ChallengeRound;
  videoUrl?: string;
  title?: string;
  videoProvider?: string;
  mapName?: string;
  clipId?: string;
  className?: string;
  autoplay?: boolean;
}

export function detectPlatform(rawUrl: string): VideoPlatform {
  if (!rawUrl) return "EXTERNAL";
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
      return "YOUTUBE";
    }
    if (host === "clips.twitch.tv" || host === "twitch.tv" || host.endsWith(".twitch.tv")) {
      return "TWITCH";
    }
    if (host === "medal.tv" || host.endsWith(".medal.tv")) {
      return "MEDAL";
    }
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(pathname)) {
      return "DIRECT";
    }
    return "EXTERNAL";
  } catch {
    return "EXTERNAL";
  }
}

export function resolveVideoEmbed(rawUrl: string, autoplay = false): {
  platform: VideoPlatform;
  embedUrl: string | null;
  directUrl: string | null;
  safeUrl: string | null;
  badgeLabel: string;
} {
  try {
    const url = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(url.protocol)) {
      return { platform: "EXTERNAL", embedUrl: null, directUrl: null, safeUrl: null, badgeLabel: "UNSUPPORTED" };
    }
    const safeUrl = url.href;
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const parentHost = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";

    // 1. YouTube
    if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
      let id: string | null = null;
      if (host === "youtu.be") {
        id = pathname.slice(1).split(/[?#]/)[0];
      } else {
        id =
          url.searchParams.get("v") ??
          pathname.match(/^\/(?:shorts|embed)\/([^/?#]+)/)?.[1] ??
          null;
      }
      if (id && /^[\w-]{11}$/.test(id)) {
        const auto = autoplay ? "&autoplay=1" : "";
        return {
          platform: "YOUTUBE",
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${auto}`,
          directUrl: null,
          safeUrl,
          badgeLabel: "YOUTUBE",
        };
      }
    }

    // 2. Twitch (Clips and VODs)
    if (host === "clips.twitch.tv" || host === "twitch.tv" || host.endsWith(".twitch.tv")) {
      // Direct clips.twitch.tv/{slug}
      if (host === "clips.twitch.tv") {
        const slug = pathname.slice(1).split(/[/?#]/)[0];
        if (slug) {
          return {
            platform: "TWITCH",
            embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${parentHost}&autoplay=${autoplay}`,
            directUrl: null,
            safeUrl,
            badgeLabel: "TWITCH CLIP",
          };
        }
      }
      // twitch.tv/{channel}/clip/{slug}
      const clipMatch = pathname.match(/\/clip\/([^\/?#]+)/i);
      if (clipMatch?.[1]) {
        return {
          platform: "TWITCH",
          embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clipMatch[1])}&parent=${parentHost}&autoplay=${autoplay}`,
          directUrl: null,
          safeUrl,
          badgeLabel: "TWITCH CLIP",
        };
      }
      // twitch.tv/videos/{id}
      const vodMatch = pathname.match(/\/videos\/(\d+)/i);
      if (vodMatch?.[1]) {
        return {
          platform: "TWITCH",
          embedUrl: `https://player.twitch.tv/?video=${encodeURIComponent(vodMatch[1])}&parent=${parentHost}&autoplay=${autoplay}`,
          directUrl: null,
          safeUrl,
          badgeLabel: "TWITCH VOD",
        };
      }
    }

    // 3. Medal.tv
    if (host === "medal.tv" || host.endsWith(".medal.tv")) {
      const medalMatch = pathname.match(/\/(?:clips?|games\/[^/]+\/clips)\/([^\/?#]+)/i);
      if (medalMatch?.[1]) {
        const clipId = medalMatch[1];
        return {
          platform: "MEDAL",
          embedUrl: `https://medal.tv/clip/${encodeURIComponent(clipId)}/vp?autoplay=${autoplay ? 1 : 0}&muted=0`,
          directUrl: null,
          safeUrl,
          badgeLabel: "MEDAL.TV",
        };
      }
    }

    // 4. Direct video file
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(pathname)) {
      return {
        platform: "DIRECT",
        embedUrl: null,
        directUrl: safeUrl,
        safeUrl,
        badgeLabel: "DIRECT VIDEO",
      };
    }

    // 5. External highlight / platform
    let badge = "EXTERNAL CLIP";
    if (host.includes("faceit")) badge = "FACEIT HIGHLIGHT";
    else if (host.includes("steam")) badge = "STEAM COMMUNITY";
    else if (host.includes("streamable")) badge = "STREAMABLE";
    else if (host.includes("reddit")) badge = "REDDIT CLIP";
    else badge = host.replace(/^www\./, "").toUpperCase();

    return {
      platform: "EXTERNAL",
      embedUrl: null,
      directUrl: null,
      safeUrl,
      badgeLabel: badge,
    };
  } catch {
    return {
      platform: "EXTERNAL",
      embedUrl: null,
      directUrl: null,
      safeUrl: null,
      badgeLabel: "INVALID URL",
    };
  }
}

export default function ClipPlayer({
  round,
  videoUrl,
  title,
  mapName,
  clipId,
  className = "",
  autoplay = false,
}: ClipPlayerProps) {
  const effectiveUrl = round?.videoUrl ?? videoUrl ?? "";
  const effectiveTitle = round?.title ?? title ?? "CS2 Gameplay Clip";
  const effectiveMap = round?.mapName ?? mapName ?? "";
  const effectiveKey = round?.clipId ?? clipId ?? effectiveUrl;

  const [hasError, setHasError] = useState(false);

  const { platform, embedUrl, directUrl, safeUrl, badgeLabel } = useMemo(
    () => resolveVideoEmbed(effectiveUrl, autoplay),
    [effectiveUrl, autoplay],
  );

  return (
    <div className={`clip-player-frame big-clip minigame-video ${className}`}>
      {/* Top Overlay Badge */}
      <div className="clip-player-header">
        <span className={`clip-platform-badge ${platform.toLowerCase()}`}>
          {badgeLabel}
        </span>
        {effectiveMap && (
          <span className="clip-map-badge">
            {effectiveMap.replace(/^de_/, "").toUpperCase()}
          </span>
        )}
        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clip-external-link"
            title="Open original video link in new tab"
          >
            Source ↗
          </a>
        )}
      </div>

      {/* Embedded Iframe Player (YouTube / Twitch / Medal) */}
      {embedUrl && !hasError && (
        <iframe
          key={effectiveKey}
          src={embedUrl}
          title={effectiveTitle}
          className="clip-player-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      )}

      {/* Native HTML5 Video Player (Direct MP4/WebM) */}
      {directUrl && !hasError && (
        <video
          key={effectiveKey}
          src={directUrl}
          controls
          playsInline
          preload="metadata"
          className="clip-player-video"
          onError={() => setHasError(true)}
        />
      )}

      {/* External / Fallback Card (Faceit, Steam, or Non-embeddable sites) */}
      {(!embedUrl && !directUrl) || hasError ? (
        <div className="clip-player-external-card">
          <div className="clip-external-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="clip-external-content">
            <p className="clip-external-eyebrow">{badgeLabel}</p>
            <h4 className="clip-external-title">{effectiveTitle}</h4>
            <p className="clip-external-desc">
              This platform requires playback in its native browser viewer. Click below to watch the highlight, then enter your Premier rating estimate.
            </p>
            {safeUrl ? (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="clip-external-btn"
              >
                Watch Gameplay Clip in New Tab ↗
              </a>
            ) : (
              <span className="clip-unavailable-tag">No Video URL Available</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
