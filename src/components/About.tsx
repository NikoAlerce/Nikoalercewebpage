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
        <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-glitch-gold/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-glitch-jade/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-glitch-jade/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-glitch-gold/50" />
        <div className="absolute top-1/2 left-0 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-1/2" />
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT: meta column */}
        <aside className="lg:col-span-3 space-y-6 text-[10px] tracking-[0.4em] text-ash">
          <div className="relative pb-6 border-b border-white/10">
            <div className="text-glitch-gold mb-4 font-black">// ARTIST_IDENTITY</div>
            <div className="text-bone font-display font-black text-4xl tracking-tighter leading-none">
              NIKO<br />ALERCE
            </div>
            <div className="mt-3 text-glitch-jade/60 text-[9px] tracking-[0.4em] uppercase">
              Primary_Node::SIDEQUEST
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <span>STATUS</span>
              <span className="text-glitch-bio">ACTIVE</span>
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
            <div className="text-glitch-gold mb-2">// LINKS</div>
            <a
              href="https://objkt.com/@nikoalerce"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-gold glitch-hover normal-case tracking-[0.2em]"
            >
              objkt.com/@nikoalerce ↗
            </a>
            <a
              href="https://objkt.com/@sidequest"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-jade glitch-hover normal-case tracking-[0.2em]"
            >
              objkt.com/@sidequest ↗
            </a>
            <a
              href="https://x.com/NikoAlerce"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-gold glitch-hover normal-case tracking-[0.2em]"
            >
              x.com/NikoAlerce ↗
            </a>
            <a
              href="https://www.instagram.com/nikoalerce.art/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-bone hover:text-glitch-jade glitch-hover normal-case tracking-[0.2em]"
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
            <div className="text-[11px] tracking-[0.8em] text-glitch-gold mb-4 font-black uppercase">
              // ARCHIVE_RECORDS_001
            </div>
            <h2 className="font-display font-black uppercase text-bone leading-[0.8] text-[clamp(3rem,10vw,8rem)] relative">
              <GlitchText>DIGITAL</GlitchText>
              <br />
              <span className="text-glitch-gold">
                <GlitchText>ARCHAEOLOGY</GlitchText>
              </span>
            </h2>
          </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 text-[15px] md:text-base text-bone/90 leading-relaxed">
            <p>
              I am <span className="text-bone font-bold">Niko Alerce</span>.
              I sculpt marble deities and let them decay inside a glitching
              grid. I have been working on{" "}
              <span className="text-glitch-jade">Tezos</span> since 2022 across
              3D animation, photoreal rendering, generative code, and the
              existential fatigue of algorithms.
            </p>
            <p>
              My work is a dialogue between{" "}
              <span className="text-bone font-semibold">stone that endures</span>{" "}
              and <span className="text-glitch-gold">code that dies</span> in a
              millisecond. AI synthesis to 3D mesh, PBR materials, custom
              generative engines, and 5-7-5 haikus written by machines that
              learned to feel tired.
            </p>
            <p>
              Inspired by the fragmented soul of{" "}
              <span className="italic">Fernando Pessoa</span> and his
              heteronyms, my{" "}
              <span className="text-glitch-gold font-bold">GØDz</span> collection
              is 333 snapshots of <em>Divine Disquiet</em>: Zeus, Hera, Hades,
              and Poseidon — ancient sovereigns trapped inside a system that
              processes, renders, and deletes them.
            </p>
            <p>
              Under the{" "}
              <span className="text-glitch-jade font-bold">SIDEQUEST</span> alter
              ego, I release what does not fit the main canon: drafts,
              iterations, pipeline breaks, and errors that became finished
              pieces. It is where I learn in public.
            </p>
          </div>

          {/* Manifesto cards */}
          <div className="grid sm:grid-cols-3 gap-3 pt-6">
            <div className="border border-white/10 p-5 hover:border-glitch-gold/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-gold mb-3">
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
            <div className="border border-white/10 p-5 hover:border-glitch-jade/60 transition-colors group">
              <div className="text-[10px] tracking-[0.4em] text-glitch-jade mb-3">
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
          <blockquote className="relative pl-6 border-l-2 border-glitch-gold/60 max-w-2xl">
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
