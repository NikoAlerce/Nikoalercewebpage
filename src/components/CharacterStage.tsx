"use client";

import { useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { usePathname } from "next/navigation";
import { anyCharacterVisible, subscribeCharacterVisibility } from "@/lib/characterVisibility";

// ONE shared WebGL context for every title character on the page.
//
// Previously each <TitleCharacter> spun up its own <Canvas> → its own WebGL context.
// Browsers cap active contexts (~16) and start killing the oldest ("Too many active
// WebGL contexts: oldest context will be lost" → THREE "Context Lost"), which is what
// caused the on-page errors and the memory growth.
//
// drei's <View> lets many on-page "tiles" share a single renderer: this fixed, full-
// viewport, click-through canvas hosts <View.Port/>, and each character renders into
// the screen-rect of its own tracking <div> via scissoring. So no matter how many
// characters are on the page, there's exactly ONE context.
export default function CharacterStage() {
  // The 3D gallery is its own full-screen WebGL experience — no title characters there.
  const pathname = usePathname();
  // Pause the whole render loop while no character is on-screen: reading text sections or
  // watching the showreel video no longer competes with a continuously-rendering WebGL canvas.
  const anyVisible = useSyncExternalStore(
    subscribeCharacterVisibility,
    anyCharacterVisible,
    () => false, // SSR: assume none visible
  );
  if (pathname === "/metaverse") return null;

  return (
    <Canvas
      frameloop={anyVisible ? "always" : "never"}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <View.Port />
    </Canvas>
  );
}
