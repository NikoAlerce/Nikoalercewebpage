import { ipfsPath, ipfsToUrl, objktCdnUrl } from "./objkt";
import type { ObjktToken } from "./types";

export function thumbnailSources(token: ObjktToken): string[] {
  const uris = [...new Set([token.thumbnail_uri, token.display_uri,
    token.mime?.startsWith("image/") ? token.artifact_uri : null].filter((uri): uri is string => !!uri))];
  const optimized = uris.map((uri) => {
    const path = ipfsPath(uri);
    return path ? `/api/thumbnail?uri=${encodeURIComponent(path)}` : ipfsToUrl(uri);
  });
  // Try the alternate image, not only another gateway for a permanently missing CID.
  return [...new Set([...optimized, ...uris.map(objktCdnUrl)].filter((uri): uri is string => !!uri))];
}
