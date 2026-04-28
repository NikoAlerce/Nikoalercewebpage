import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Simple mark so `/icon` exists; `/favicon.ico` redirects here in `next.config.mjs`. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "#0c0c0f",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b8ff6b",
        }}
      >
        ◆
      </div>
    ),
    { ...size },
  );
}
