"use client";

import { detectKind, ipfsToUrl } from "@/lib/objkt";
import { optimizedVideoUrl } from "@/lib/optimizedMedia";
import { thumbnailSources } from "@/lib/thumbnailSources";
import type { ObjktToken } from "@/lib/types";
import ArtworkThumbnail from "./ArtworkThumbnail";

export default function MediaRenderer({ token, active = false, priority = false }: {
  token: ObjktToken; active?: boolean; priority?: boolean;
}) {
  const kind = detectKind(token.mime);
  const video = optimizedVideoUrl(token.artifact_uri) ?? (kind === "video" ? ipfsToUrl(token.artifact_uri) : null);
  return <>
    <ArtworkThumbnail key={`${token.fa_contract}:${token.token_id}`} sources={thumbnailSources(token)} alt={token.name ?? "untitled"} priority={priority} />
    {active && video && <video src={video} autoPlay loop muted playsInline preload="none"
      aria-label={token.name ?? "untitled"} className="absolute inset-0 w-full h-full object-cover"
      onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />}
  </>;
}
