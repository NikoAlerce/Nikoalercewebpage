"use client";

import { useState, useCallback } from "react";
import { detectKind, ipfsToUrl, ipfsWithGateway, IPFS_GATEWAYS } from "@/lib/objkt";
import type { ObjktToken } from "@/lib/types";

type Props = {
  token: ObjktToken;
  active?: boolean;
};

/**
 * Decide which URI to use as the image/video source:
 * thumbnail_uri → display_uri → artifact_uri (en ese orden)
 */
function resolveDisplayUri(token: ObjktToken): string | null {
  return (
    ipfsToUrl(token.thumbnail_uri) ??
    ipfsToUrl(token.display_uri) ??
    ipfsToUrl(token.artifact_uri)
  );
}

/**
 * Image with automatic fallback to the next IPFS gateways when the previous one fails.
 */
function IpfsImage({
  token,
  className,
}: {
  token: ObjktToken;
  className?: string;
}) {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const rawUri =
    token.thumbnail_uri ?? token.display_uri ?? token.artifact_uri;
  const src = ipfsWithGateway(rawUri, gatewayIdx);

  const handleError = useCallback(() => {
    if (gatewayIdx < IPFS_GATEWAYS.length - 1) {
      setGatewayIdx((i) => i + 1);
    } else {
      setFailed(true);
    }
  }, [gatewayIdx]);

  if (failed || !src) {
    return (
      <div className="w-full h-full grid place-items-center text-[10px] text-ash">
        NO_MEDIA
      </div>
    );
  }

  return (
    <>
      {!loaded && !failed && (
        <div className="absolute inset-0 grid place-items-center text-[10px] text-ash animate-pulse">
          DECRYPTING...
        </div>
      )}
      <img
        key={src}
        src={src}
        alt={token.name ?? "untitled"}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={className}
      />
    </>
  );
}

export default function MediaRenderer({ token, active = true }: Props) {
  const kind = detectKind(token.mime);

  const artifact = ipfsToUrl(token.artifact_uri);

  if (kind === "video" && artifact) {
    return (
      <video
        src={artifact}
        poster={resolveDisplayUri(token) ?? undefined}
        autoPlay={active}
        loop
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    );
  }

  // Para modelos 3D mostramos siempre el thumbnail/display (no montamos un
  // Canvas inline porque consume un contexto WebGL y compite con el shader del
  // Hero). El visor 3D real se abre en una vista dedicada al hacer click.
  return (
    <IpfsImage token={token} className="w-full h-full object-cover" />
  );
}
