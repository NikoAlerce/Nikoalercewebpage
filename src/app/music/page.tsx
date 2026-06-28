import type { Metadata } from "next";
import Music from "@/components/Music";

export const metadata: Metadata = {
  title: "Music",
  description:
    "Music by Niko Alerce — El Bosquecito Records. Production, recording, mixing and mastering. Listen on YouTube and SoundCloud, and book studio time.",
};

export default function MusicPage() {
  return (
    <div className="pt-20">
      <Music />
    </div>
  );
}
