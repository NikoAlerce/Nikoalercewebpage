"use client";

import GlitchText from "./GlitchText";

export default function About() {
  return (
    <section
      id="about"
      className="relative py-28 md:py-40 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* Background grid + corners */}
      <div className="absolute inset-x-6 md:inset-x-12 top-12 bottom-12 pointer-events-none">
        <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-glitch-red/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-glitch-cyan/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-glitch-cyan/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-glitch-red/50" />
        <div className="absolute top-1/2 left-0 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-1/2" />
      </div>

      {/* ── Bio header / landing video ── */}
      <div className="relative z-10 mb-16 md:mb-24">
        <div className="text-[10px] tracking-[0.6em] text-glitch-red uppercase mb-4 font-black">
          // SHOWREEL
        </div>
        <div className="relative w-full aspect-video border border-white/10 overflow-hidden bg-black shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/1MQ428VFzIo?autoplay=1&mute=1&loop=1&playlist=1MQ428VFzIo&controls=1&rel=0&modestbranding=1&playsinline=1"
            title="Niko Alerce — showreel"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT: meta column */}
        <aside className="lg:col-span-3 space-y-6 text-[10px] tracking-[0.4em] text-ash">
          <div className="relative pb-6 border-b border-white/10">
            <div className="text-glitch-red mb-4 font-black">// ARTIST_IDENTITY</div>
            <div className="text-bone font-display font-black text-4xl tracking-tighter leading-none">
              NIKO<br />ALERCE
            </div>
            <div className="mt-3 text-glitch-cyan/60 text-[9px] tracking-[0.4em] uppercase">
              Full-Stack Creative
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>STATUS</span>
              <span className="text-glitch-lime">ACTIVE</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>FIELDS</span>
              <span className="text-bone">3D · MUSIC · XR</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>LABEL</span>
              <span className="text-bone">EL BOSQUECITO</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>CHAINS</span>
              <span className="text-bone">TEZOS · DCL</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>BASE</span>
              <span className="text-bone">EL BOLSÓN, AR</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-glitch-red mb-2">// LINKS</div>
            <a
              href="https://objkt.com/@nikoalerce"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-red glitch-hover normal-case tracking-[0.2em]"
            >
              objkt.com/@nikoalerce ↗
            </a>
            <a
              href="https://objkt.com/@sidequest"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-cyan glitch-hover normal-case tracking-[0.2em]"
            >
              objkt.com/@sidequest ↗
            </a>
            <a
              href="https://x.com/NikoAlerce"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-red glitch-hover normal-case tracking-[0.2em]"
            >
              x.com/NikoAlerce ↗
            </a>
            <a
              href="https://www.instagram.com/nikoalerce.art/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-cyan glitch-hover normal-case tracking-[0.2em]"
            >
              ig/nikoalerce.art ↗
            </a>
          </div>
        </aside>

        {/* RIGHT: bio */}
        <div className="lg:col-span-9 space-y-10">
          <div>
          <div className="relative">
            <div className="absolute -left-12 top-0 text-[10rem] font-black text-white/5 select-none pointer-events-none leading-none">BIO</div>
            <div className="text-[11px] tracking-[0.8em] text-glitch-red mb-4 font-black uppercase">
              // ARCHIVE_RECORDS_001
            </div>
            <h2 className="font-display font-black uppercase text-bone leading-[0.8] text-[clamp(3rem,10vw,8rem)] relative">
              <GlitchText>FULL STACK</GlitchText>
              <br />
              <span className="text-glitch-red">
                <GlitchText>CREATIVE</GlitchText>
              </span>
            </h2>
          </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 text-[15px] md:text-base text-bone/90 leading-relaxed">
            <p>
              I am <span className="text-bone font-bold">Niko Alerce</span>, a
              full-stack creative based in{" "}
              <span className="text-glitch-cyan">El Bolsón, Patagonia</span>. I
              work at the intersection of visual art, sound design, and
              immersive technology, delivering end-to-end production for clients
              who need more than a single-discipline contractor.
            </p>
            <p>
              I produce high-quality{" "}
              <span className="text-bone font-semibold">3D illustration, motion graphics, and glitch aesthetics</span>{" "}
              in Blender — character design, environmental art, and animated
              assets optimized for web, game engines, and VR. I have shipped
              original collections as NFTs on{" "}
              <span className="text-glitch-cyan">Objkt</span> and exhibited work
              born from artist residencies in Patagonia.
            </p>
            <p>
              I am the founder of{" "}
              <span className="text-glitch-red font-bold">El Bosquecito Records</span>,
              where I produce, record, mix, and master original music —
              hip-hop, trap, lo-fi, and experimental electronic — handling the
              whole pipeline from composition to master, released across
              Spotify, TIDAL, Deezer, and YouTube Music.
            </p>
            <p>
              I design and build virtual real estate and wearables for{" "}
              <span className="text-glitch-cyan font-bold">Decentraland</span>,
              authored a commercial Blender addon that turns video textures into
              optimized GLB/GLTF animations, and handle video post-production in
              After Effects and Premiere. One stack, one vision — concept to
              delivery.
            </p>
          </div>

          {/* Manifesto cards */}
          <div className="grid sm:grid-cols-3 gap-3 pt-6">
            <div className="border border-white/10 p-5 hover:border-glitch-red/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-red mb-3">
                // 01 · VISUAL
              </div>
              <div className="font-display text-lg text-bone mb-2">
                3D &amp; Motion
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                Blender 3D, animation, motion graphics and glitch. Characters,
                environments and assets for web, games and VR.
              </p>
            </div>
            <div className="border border-white/10 p-5 hover:border-glitch-cyan/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-cyan mb-3">
                // 02 · SOUND
              </div>
              <div className="font-display text-lg text-bone mb-2">
                El Bosquecito Records
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                Compose, record, mix and master. Hip-hop, trap, lo-fi and
                experimental electronic — released on every major platform.
              </p>
            </div>
            <div className="border border-white/10 p-5 hover:border-bone transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-ash mb-3">
                // 03 · BUILD
              </div>
              <div className="font-display text-lg text-bone mb-2">
                Metaverse &amp; Tools
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                Decentraland real estate and wearables, a commercial Blender
                addon, and full video post-production.
              </p>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="relative pl-6 border-l-2 border-glitch-red/60 max-w-2xl">
            <p className="font-display italic text-xl md:text-2xl text-bone/90 leading-snug">
              &ldquo;One studio, one vision. You are not coordinating four
              contractors — I own the full stack, from concept to delivery.&rdquo;
            </p>
            <footer className="mt-3 text-[10px] tracking-[0.4em] text-ash">
              — N.A.
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
