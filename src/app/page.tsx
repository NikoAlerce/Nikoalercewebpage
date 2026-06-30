import Link from "next/link";
import Hero from "@/components/Hero";
import About from "@/components/About";

// The realms surfaced as an editorial index — the bridge from the bio into
// the interior pages. (The pre-home "choose your portal" splash is retired;
// visitors land straight in the hero.)
const REALMS = [
  {
    n: "01",
    href: "/art-on-tezos",
    title: "Art on Tezos",
    blurb:
      "Two collections synced live with Tezos — Works (the main gallery) and Sidequest (the experiments) — open to collect on-chain.",
  },
  {
    n: "02",
    href: "/music",
    title: "Music",
    blurb:
      "El Bosquecito Records. Composed, recorded, mixed and mastered in-house — out on every platform.",
  },
  {
    n: "03",
    href: "/metaverse",
    title: "3D Gallery",
    blurb:
      "Walk a first-person gallery of the work, rendered in real time in your browser.",
  },
  {
    n: "04",
    href: "/decentraland",
    title: "Decentraland",
    blurb:
      "Virtual real estate and wearables — designed, built and deployed on-chain.",
  },
  {
    n: "05",
    href: "/shop",
    title: "Shop",
    blurb:
      "Physical objects: prints, sculptures and limited drops with their digital counterparts.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />
      <About />

      {/* ── Index of realms ── */}
      <section
        id="enter"
        className="relative px-6 md:px-10 py-28 md:py-40 max-w-[1500px] mx-auto border-t border-white/5"
      >
        <header className="mb-16 md:mb-20 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-px rule-accent" />
            <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
              Index
            </span>
          </div>
          <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.4rem,6vw,4.5rem)]">
            Five ways into the studio.
          </h2>
          <p className="mt-5 font-sans text-[15px] md:text-base text-ash leading-relaxed">
            One practice, many surfaces — art, sound, video and immersive
            worlds. Pick a thread and pull.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {REALMS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className={`group relative bg-void hover:bg-ink transition-colors duration-500 p-8 md:p-10 flex flex-col min-h-[15rem] ${
                r.n === "01" ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-[0.3em] text-ash/60 group-hover:text-accent transition-colors duration-500">
                  {r.n}
                </span>
                <span className="text-ash/40 group-hover:text-accent group-hover:translate-x-1 transition-all duration-500 text-lg leading-none">
                  ↗
                </span>
              </div>

              <h3 className="mt-8 font-graffiti text-bone leading-[1.05] text-[1.8rem] md:text-[2.05rem] group-hover:text-accent transition-colors duration-500">
                {r.title}
              </h3>

              <p className="mt-4 font-sans text-[13.5px] text-ash leading-relaxed max-w-xs opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                {r.blurb}
              </p>

              {/* baseline accent rule that draws in on hover */}
              <span className="mt-auto pt-6 block h-px w-0 bg-accent/70 group-hover:w-12 transition-all duration-500" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
