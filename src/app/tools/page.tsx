import type { Metadata } from "next";
import Tools from "@/components/Tools";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Tools by Niko Alerce — the Video to GLB Texture Blender addon and PixAlerce, a free browser tool.",
};

export default function ToolsPage() {
  return (
    <main className="pt-24">
      <Tools />
    </main>
  );
}
