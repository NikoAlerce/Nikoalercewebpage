"use client";

import GlitchText from "./GlitchText";

export default function About() {
  return (
    <section
      id="about"
      className="relative py-28 md:py-40 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* Background grid + corners */}
      <div className="absolute inset-x-6 md:inset-x-10 top-10 bottom-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-glitch-red/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-glitch-cyan/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-glitch-cyan/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-glitch-red/40" />
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT: meta column */}
        <aside className="lg:col-span-3 space-y-6 text-[10px] tracking-[0.4em] text-ash">
          <div>
            <div className="text-glitch-red mb-3">// ID</div>
            <div className="text-bone font-display text-2xl tracking-normal">
              NIKO ALERCE
            </div>
            <div className="mt-1 text-ash/60 normal-case tracking-[0.2em]">
              a.k.a. <span className="text-glitch-cyan">SIDEQUEST</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>STATUS</span>
              <span className="text-glitch-lime">ACTIVE</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>MEDIUM</span>
              <span className="text-bone">3D / GLITCH</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>CHAIN</span>
              <span className="text-bone">TEZOS</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>BASE</span>
              <span className="text-bone">PATAGONIA</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>SINCE</span>
              <span className="text-bone font-mono">~2022</span>
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
            <div className="text-[10px] tracking-[0.5em] text-glitch-red mb-3">
              // ARCHIVE :: 0x01
            </div>
            <h2 className="font-display font-bold uppercase text-bone leading-[0.9] text-[clamp(2.5rem,7vw,6rem)]">
              <GlitchText>DIGITAL</GlitchText>
              <br />
              <span className="text-glitch-red">
                <GlitchText>ARCHAEOLOGY</GlitchText>
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 text-[15px] md:text-base text-bone/90 leading-relaxed">
            <p>
              I am <span className="text-bone font-bold">Niko Alerce</span>.
              I sculpt marble deities and let them decay inside a glitching
              grid. I have been working on{" "}
              <span className="text-glitch-cyan">Tezos</span> since 2022 across
              3D animation, photoreal rendering, generative code, and the
              existential fatigue of algorithms.
            </p>
            <p>
              My work is a dialogue between{" "}
              <span className="text-bone font-semibold">stone that endures</span>{" "}
              and <span className="text-glitch-red">code that dies</span> in a
              millisecond. AI synthesis to 3D mesh, PBR materials, custom
              generative engines, and 5-7-5 haikus written by machines that
              learned to feel tired.
            </p>
            <p>
              Inspired by the fragmented soul of{" "}
              <span className="italic">Fernando Pessoa</span> and his
              heteronyms, my{" "}
              <span className="text-glitch-red font-bold">GØDz</span> collection
              is 333 snapshots of <em>Divine Disquiet</em>: Zeus, Hera, Hades,
              and Poseidon — ancient sovereigns trapped inside a system that
              processes, renders, and deletes them.
            </p>
            <p>
              Under the{" "}
              <span className="text-glitch-cyan font-bold">SIDEQUEST</span> alter
              ego, I release what does not fit the main canon: drafts,
              iterations, pipeline breaks, and errors that became finished
              pieces. It is where I learn in public.
            </p>
          </div>

          {/* Manifesto cards */}
          <div className="grid sm:grid-cols-3 gap-3 pt-6">
            <div className="border border-white/10 p-5 hover:border-glitch-red/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-red mb-3">
                // 01 · MEDIUM
              </div>
              <div className="font-display text-lg text-bone mb-2">
                Marble + Glitch
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                AI-to-3D synthesis, PBR materials, realtime animation, and
                controlled tearing.
              </p>
            </div>
            <div className="border border-white/10 p-5 hover:border-glitch-cyan/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-cyan mb-3">
                // 02 · ENGINE
              </div>
              <div className="font-display text-lg text-bone mb-2">
                Generative Systems
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                Custom engines: Metropolis, Flora, Slit-Scan, Glitch. Every
                background is a living system.
              </p>
            </div>
            <div className="border border-white/10 p-5 hover:border-bone transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-ash mb-3">
                // 03 · WORDS
              </div>
              <div className="font-display text-lg text-bone mb-2">
                Machine Haikus
              </div>
              <p className="text-[13px] text-ash leading-relaxed">
                Every piece speaks in 5-7-5. Fragmented confessions from a
                system that learned to feel fatigue.
              </p>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="relative pl-6 border-l-2 border-glitch-red/60 max-w-2xl">
            <p className="font-display italic text-xl md:text-2xl text-bone/90 leading-snug">
              &ldquo;Stone lasts forever. Code disappears in a millisecond. I work in
              the space between them.&rdquo;
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
