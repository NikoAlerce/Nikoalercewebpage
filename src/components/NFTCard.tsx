"use client";

import { useState } from "react";
import clsx from "clsx";
import MediaRenderer from "./MediaRenderer";
import {
  detectKind,
  tokenStatus,
  lowestPriceXtz,
  editionsLabel,
} from "@/lib/objkt";
import { useTokenViewer } from "./TokenViewerContext";
import type { ObjktToken } from "@/lib/types";

type Props = {
  token: ObjktToken;
  index: number;
};

const kindLabel: Record<string, string> = {
  video: "MP4",
  image: "IMG",
  model: "GLB",
  audio: "AUDIO",
  html: "HTML",
  unknown: "FILE",
};

const statusBadge: Record<
  ReturnType<typeof tokenStatus>,
  { label: string; className: string }
> = {
  for_sale: {
    label: "FOR SALE",
    className: "bg-glitch-bio/20 text-glitch-bio border-glitch-bio/50",
  },
  sold_out: {
    label: "SOLD OUT",
    className: "bg-glitch-terra/15 text-glitch-terra border-glitch-terra/40",
  },
  in_collection: {
    label: "ARCHIVE",
    className: "bg-void/80 text-ash/70 border-white/10",
  },
};

export default function NFTCard({ token, index }: Props) {
  const [hover, setHover] = useState(false);
  const { open } = useTokenViewer();
  const kind = detectKind(token.mime);
  const status = tokenStatus(token);
  const price = lowestPriceXtz(token);
  const editions = editionsLabel(token);
  const badge = statusBadge[status];

  return (
    <button
      type="button"
      onClick={() => open(token)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative block w-full text-left bg-ink border border-white/5 hover:border-glitch-gold/60 transition-colors cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-black">
        <div
          className={clsx(
            "absolute inset-0 transition-transform duration-700 will-change-transform",
            hover ? "scale-105" : "scale-100",
          )}
        >
          <MediaRenderer token={token} active={hover || kind === "video"} />
        </div>

        <div className="absolute top-2 left-2 z-10 flex gap-1.5">
          <span className="px-1.5 py-0.5 text-[9px] tracking-[0.2em] bg-void/80 text-bone border border-white/10">
            {kindLabel[kind] ?? "FILE"}
          </span>
          <span className="px-1.5 py-0.5 text-[9px] tracking-[0.2em] bg-void/80 text-ash border border-white/10">
            #{String(index + 1).padStart(3, "0")}
          </span>
        </div>

        <div className="absolute top-2 right-2 z-10">
          <span
            className={clsx(
              "px-1.5 py-0.5 text-[9px] tracking-[0.2em] border",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </div>

        <div
          className={clsx(
            "absolute inset-0 pointer-events-none transition-opacity duration-200",
            hover ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(212,168,83,0.05) 0 1px, transparent 1px 3px)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      <div className="p-3 flex items-start justify-between gap-2 border-t border-white/5">
        <div className="min-w-0">
          <div className="text-xs font-medium text-bone truncate group-hover:text-glitch-gold transition-colors">
            {token.name ?? "untitled"}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] tracking-[0.2em]">
            <span className="text-ash">{editions}</span>
            {price !== null && status === "for_sale" && (
              <span className="text-glitch-bio font-mono">
                {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} XTZ
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-ash group-hover:text-glitch-jade transition-colors mt-0.5">
          ↗
        </span>
      </div>
    </button>
  );
}
