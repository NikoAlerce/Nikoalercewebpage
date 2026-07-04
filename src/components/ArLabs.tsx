"use client";

import { useRef, useState } from "react";
import TitleCharacter from "@/components/TitleCharacter";
import { useLang } from "@/lib/i18n";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M22 9l-6 6M16 9l6 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a9 9 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}

// The phone mockup — the AR video playing "inside" a handset, so the concept reads instantly.
function PhoneAR() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const { lang } = useLang();
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };
  return (
    <div className="relative mx-auto w-[244px] sm:w-[272px] md:w-[296px] shrink-0">
      {/* soft glow behind the device */}
      <div aria-hidden className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      {/* device body */}
      <div className="relative rounded-[2.7rem] border border-white/15 bg-[#0a0a0c] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
        {/* side buttons */}
        <span className="absolute -left-[3px] top-28 h-12 w-[3px] rounded-full bg-white/15" />
        <span className="absolute -right-[3px] top-24 h-8 w-[3px] rounded-full bg-white/15" />
        {/* screen */}
        <div className="relative aspect-[392/850] w-full overflow-hidden rounded-[2.15rem] bg-black">
          <video ref={ref} src="/arvideo.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover" />
          {/* notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 h-5 w-20 rounded-full bg-black flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
          {/* live badge */}
          <div className="absolute top-4 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[8px] tracking-[0.25em] uppercase text-bone/85">
              {lang === "es" ? "AR en vivo" : "AR live"}
            </span>
          </div>
          {/* sound toggle */}
          <button
            onClick={toggle}
            aria-label={lang === "es" ? (muted ? "Activar sonido" : "Silenciar") : (muted ? "Unmute" : "Mute")}
            className="absolute bottom-4 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/50 text-bone backdrop-blur hover:bg-black/70 transition-colors"
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="w-8 h-px bg-accent" />
      <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">{children}</span>
    </div>
  );
}

const PROMOS = [
  { src: "/promo2.mp4", title: "Promo · 01" },
  { src: "/promo3.mp4", title: "Promo · 02" },
];

const MAIL = "mailto:alercebolson@gmail.com?subject=AR%20Labs%20project%20inquiry";
const WHATSAPP = "https://wa.me/542944803301";

const T = {
  en: {
    kicker: "// AR Labs · Augmented Reality",
    titleMain: "AR is not the future.",
    titleAccent: "It's now.",
    intro: "A poster, a business card or a QR code becomes a doorway to a digital world. Point your phone and the image comes alive — video, 3D, sound and interaction layered straight onto the real world. No app to install, no download. Just scan and watch reality fold open.",
    viewServices: "View services",
    startProject: "Start a project →",
    howItWorks: "How it works",
    steps: [
      { t: "Scan", d: "Point your phone's camera at the QR code or the printed marker." },
      { t: "It opens", d: "A web page launches on its own — no app, no download." },
      { t: "It comes alive", d: "Digital content appears layered over the real world, in place." },
    ],
    twoWays: "Two ways to do it",
    models: [
      {
        tag: "Marker-based",
        title: "Artwork",
        body: "Your printed image or graphic design becomes the trigger. Aim your phone at it and it comes alive with video, animation, 3D models, interactive info, sound and visual effects.",
        uses: ["Animated business cards", "Storefront welcome videos", "Living artwork", "Restaurant menus"],
      },
      {
        tag: "Markerless",
        title: "Panels",
        body: "No special design needed — just a QR code. It opens virtual signage, 3D models, floating videos and animations, narration, music and jingles, anchored to the space around you.",
        uses: ["Tourism & heritage panels", "Museum displays", "Floating promotions", "Detailed menus"],
      },
    ],
    whatWeBuild: "What we can build",
    capabilities: [
      { t: "3D Modeling", d: "Custom objects and characters built for your brand." },
      { t: "Animation", d: "Movement, effects and synced sound." },
      { t: "Interactivity", d: "Buttons that link to your site, WhatsApp or Instagram." },
      { t: "Sound", d: "Narration, music and jingles." },
      { t: "Analytics", d: "Activation and engagement metrics for every experience." },
      { t: "Applications", d: "Marketing, events, art & culture, retail, tourism, education." },
    ],
    whyArWorks: "Why AR works",
    stats: [
      { n: "3×", d: "AR experiences are remembered 3× more than traditional content." },
      { n: "78%", d: "of users share an AR experience on social media." },
      { n: "5×", d: "more engagement than a conventional video." },
      { n: "+40%", d: "average lift in conversions with AR." },
      { n: "15%", d: "only 15% of companies use AR today — your edge." },
    ],
    pricingLabel: "Pricing",
    pricingTitle: "Per complete experience",
    pricingSub: "Prices in USD · one marker or one panel",
    tableHeaderExperience: "Experience",
    tableHeaderInitial: "Initial project",
    tableHeaderHosting: "Monthly hosting",
    tableHeaderUpdate: "Content update",
    pricingRows: [
      { cat: "Artwork · Basic", blurb: "Simple video or animation over a printed marker.", initial: "$120 – $250", hosting: "$20", updates: "$60 – $120" },
      { cat: "Artwork · Advanced", blurb: "3D models and interactivity.", initial: "$300 – $600", hosting: "$20", updates: "$150 – $300" },
      { cat: "Panels · Basic", blurb: "Simple markerless info panel.", initial: "$180 – $350", hosting: "$20", updates: "$90 – $180" },
      { cat: "Panels · Advanced", blurb: "Interactive 3D plus animation.", initial: "$500 – $950", hosting: "$25", updates: "$220 – $420" },
    ],
    setupLabel: "Initial",
    hostingLabel: "Hosting",
    updateLabel: "Update",
    pricingNote1: "Ranges are a starting point — the final quote depends on the brief: number of markers or panels, complexity of the 3D, and how much interaction is involved.",
    pricingNote2: "Hosting keeps the experience live and the QR working; content updates are billed per change. Setup includes 1–2 revision rounds.",
    plans: [
      {
        t: "Event plan",
        for: "Fairs, festivals, product launches, one-off campaigns.",
        body: "Full experience development — design, 3D animation & modeling, programming and testing. Hosting active for 1 month, extendable monthly or yearly.",
      },
      {
        t: "Continuous plan",
        for: "Shops, cultural spaces, brands, institutions.",
        body: "Full initial development, permanent hosting and one content update per month, on an ongoing subscription.",
      },
    ],
    theProcess: "The process",
    processSteps: [
      "Initial meeting — we listen to your idea and define the goals.",
      "Creative proposal — a visual and technical plan.",
      "Production — design, animation, 3D modeling and assembly.",
      "Testing & launch — verification and final delivery.",
      "Optional — monthly maintenance and updates.",
    ],
    letsBuild: "Let's build",
    bringIdea: "Bring your idea into AR",
    ctaBody: "Tell us what you want to come alive — a poster, a storefront, a museum, a menu — and we'll scope it, quote it and build it.",
  },
  es: {
    kicker: "// AR Labs · Realidad Aumentada",
    titleMain: "La AR no es el futuro.",
    titleAccent: "Es ahora.",
    intro: "Un afiche, una tarjeta de presentación o un código QR se convierten en la puerta a un mundo digital. Apuntá tu celular y la imagen cobra vida — video, 3D, sonido e interacción superpuestos directamente en el mundo real. Sin apps que instalar, sin descargas. Escaneá y mirá cómo la realidad se despliega.",
    viewServices: "Ver servicios",
    startProject: "Empezar un proyecto →",
    howItWorks: "Cómo funciona",
    steps: [
      { t: "Escaneá", d: "Apuntá la cámara de tu celular al código QR o al marcador impreso." },
      { t: "Se abre", d: "Se lanza una página web por sí sola — sin app, no hay descarga." },
      { t: "Cobra vida", d: "El contenido digital aparece superpuesto sobre el mundo real, en su lugar." },
    ],
    twoWays: "Dos formas de hacerlo",
    models: [
      {
        tag: "Basado en marcadores",
        title: "Artwork",
        body: "Tu imagen impresa o diseño gráfico se convierte en el disparador. Apuntá tu celu y cobra vida con video, animación, modelos 3D, info interactiva, sonido y efectos visuales.",
        uses: ["Tarjetas personales animadas", "Videos de bienvenida en locales", "Arte vivo", "Menús de restaurantes"],
      },
      {
        tag: "Sin marcador",
        title: "Paneles",
        body: "Sin necesidad de un diseño especial — solo un código QR. Abre cartelería virtual, modelos 3D, videos flotantes y animaciones, narración, música y jingles, anclados al espacio a tu alrededor.",
        uses: ["Paneles de turismo y patrimonio", "Muestras en museos", "Promociones flotantes", "Menús detallados"],
      },
    ],
    whatWeBuild: "Qué podemos construir",
    capabilities: [
      { t: "Modelado 3D", d: "Objetos y personajes a medida construidos para tu marca." },
      { t: "Animación", d: "Movimiento, efectos y sonido sincronizado." },
      { t: "Interactividad", d: "Botones que linkean a tu web, WhatsApp o Instagram." },
      { t: "Sonido", d: "Narración, música y jingles." },
      { t: "Métricas", d: "Datos de activación y engagement para cada experiencia." },
      { t: "Aplicaciones", d: "Marketing, eventos, arte y cultura, retail, turismo, educación." },
    ],
    whyArWorks: "Por qué sirve la AR",
    stats: [
      { n: "3×", d: "Las experiencias AR se recuerdan 3 veces más que el contenido tradicional." },
      { n: "78%", d: "de los usuarios comparte una experiencia AR en sus redes sociales." },
      { n: "5×", d: "más engagement que un video convencional." },
      { n: "+40%", d: "promedio de aumento en conversiones usando AR." },
      { n: "15%", d: "solo el 15% de las empresas usa AR hoy — tu ventaja competitiva." },
    ],
    pricingLabel: "Precios",
    pricingTitle: "Por experiencia completa",
    pricingSub: "Precios en USD · un marcador o un panel",
    tableHeaderExperience: "Experiencia",
    tableHeaderInitial: "Proyecto inicial",
    tableHeaderHosting: "Hosting mensual",
    tableHeaderUpdate: "Actualización de contenido",
    pricingRows: [
      { cat: "Artwork · Básico", blurb: "Video simple o animación sobre un marcador impreso.", initial: "$120 – $250", hosting: "$20", updates: "$60 – $120" },
      { cat: "Artwork · Avanzado", blurb: "Modelos 3D e interactividad.", initial: "$300 – $600", hosting: "$20", updates: "$150 – $300" },
      { cat: "Paneles · Básico", blurb: "Panel de info simple sin marcador.", initial: "$180 – $350", hosting: "$20", updates: "$90 – $180" },
      { cat: "Paneles · Avanzado", blurb: "3D interactivo más animación.", initial: "$500 – $950", hosting: "$25", updates: "$220 – $420" },
    ],
    setupLabel: "Inicial",
    hostingLabel: "Hosting",
    updateLabel: "Actualización",
    pricingNote1: "Los rangos son un punto de partida — el presupuesto final depende del brief: cantidad de marcadores o paneles, complejidad del 3D y cuánta interacción requiera.",
    pricingNote2: "El hosting mantiene la experiencia en vivo y el QR funcionando; las actualizaciones de contenido se facturan por cambio. La configuración incluye 1–2 rondas de revisión.",
    plans: [
      {
        t: "Plan evento",
        for: "Ferias, festivales, lanzamientos de producto, campañas puntuales.",
        body: "Desarrollo completo de la experiencia — diseño, modelado y animación 3D, programación y pruebas. Hosting activo por 1 mes, prorrogable mensual o anualmente.",
      },
      {
        t: "Plan continuo",
        for: "Locales, espacios culturales, marcas, instituciones.",
        body: "Desarrollo inicial completo, hosting permanente y una actualización de contenido por mes, bajo una suscripción continua.",
      },
    ],
    theProcess: "El proceso",
    processSteps: [
      "Reunión inicial — escuchamos tu idea y definimos los objetivos.",
      "Propuesta creativa — un plan técnico y visual.",
      "Producción — diseño, animación, modelado 3D y armado.",
      "Prueba y lanzamiento — verificación y entrega final.",
      "Opcional — mantenimiento mensual y actualizaciones.",
    ],
    letsBuild: "Construyamos",
    bringIdea: "Traé tu idea a la AR",
    ctaBody: "Contanos qué querés que cobre vida — un afiche, una vidriera, un museo, un menú — y lo dimensionamos, lo cotizamos y lo construimos.",
  },
};

const PROCESS = [
  "Initial meeting — we listen to your idea and define the goals.",
  "Creative proposal — a visual and technical plan.",
  "Production — design, animation, 3D modeling and assembly.",
  "Testing & launch — verification and final delivery.",
  "Optional — monthly maintenance and updates.",
];

export default function ArLabs() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1500px] mx-auto border-t border-white/5">
      {/* ── Intro: headline + the AR video playing inside a phone ── */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center">
        <div className="max-w-2xl order-2 lg:order-1">
          <div className="text-[9px] tracking-[0.5em] text-ash uppercase mb-6">{t.kicker}</div>
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.6rem,7vw,5.6rem)]">
              {t.titleMain}
              <br />
              <span className="text-accent">{t.titleAccent}</span>
            </h2>
            <TitleCharacter clip="breakdance" size={470} flip className="shrink-0" />
          </div>
          <p className="mt-7 text-lg text-ash leading-relaxed">
            {t.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#services" className="inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-6 py-3 text-[11px] tracking-[0.25em] uppercase">
              {t.viewServices}
            </a>
            <a href={MAIL} className="inline-flex items-center gap-3 border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-6 py-3 text-[11px] tracking-[0.25em] uppercase">
              {t.startProject}
            </a>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <PhoneAR />
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="mt-20 md:mt-28">
        <SectionLabel>{t.howItWorks}</SectionLabel>
        <div className="grid sm:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {t.steps.map((s, i) => (
            <div key={s.t} className="group bg-void hover:bg-ink transition-colors duration-500 p-6">
              <div className="font-mono text-[11px] tracking-[0.3em] text-ash/60 group-hover:text-accent transition-colors">0{i + 1}</div>
              <div className="mt-5 font-display text-xl text-bone mb-2">{s.t}</div>
              <p className="text-[13px] text-ash leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two experience models ── */}
      <div id="services" className="mt-24 md:mt-32">
        <SectionLabel>{t.twoWays}</SectionLabel>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {t.models.map((m) => (
            <div key={m.title} className="border border-white/10 bg-ink p-7 md:p-9">
              <div className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">{m.tag}</div>
              <h3 className="font-display text-bone text-3xl md:text-4xl mb-4">{m.title}</h3>
              <p className="text-[15px] text-ash leading-relaxed mb-6">{m.body}</p>
              <div className="flex flex-wrap gap-2">
                {m.uses.map((u) => (
                  <span key={u} className="text-[10px] tracking-[0.2em] uppercase border border-white/15 text-ash px-3 py-1.5">{u}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Capabilities ── */}
      <div className="mt-24 md:mt-32">
        <SectionLabel>{t.whatWeBuild}</SectionLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {t.capabilities.map((c, i) => (
            <div key={c.t} className="group bg-void hover:bg-ink transition-colors duration-500 p-6">
              <div className="font-mono text-[11px] tracking-[0.3em] text-ash/60 group-hover:text-accent transition-colors">0{i + 1}</div>
              <div className="mt-5 font-display text-xl text-bone mb-2">{c.t}</div>
              <p className="text-[13px] text-ash leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why AR ── */}
      <div className="mt-24 md:mt-32">
        <SectionLabel>{t.whyArWorks}</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {t.stats.map((s) => (
            <div key={s.n} className="border border-white/10 bg-void/40 p-5">
              <div className="font-graffiti text-accent text-4xl md:text-5xl leading-none mb-3">{s.n}</div>
              <p className="text-[12px] text-ash leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing ── */}
      <div className="mt-24 md:mt-32">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>{t.pricingLabel}</SectionLabel>
            <h3 className="font-display text-bone text-3xl md:text-4xl">{t.pricingTitle}</h3>
          </div>
          <span className="text-[10px] tracking-[0.25em] uppercase border border-white/15 bg-white/[0.03] text-bone/80 px-3 py-1.5">
            {t.pricingSub}
          </span>
        </div>

        <div className="border border-white/10">
          {/* header row */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/10 text-[10px] tracking-[0.25em] uppercase text-ash">
            <span>{t.tableHeaderExperience}</span>
            <span className="text-right">{t.tableHeaderInitial}</span>
            <span className="text-right">{t.tableHeaderHosting}</span>
            <span className="text-right">{t.tableHeaderUpdate}</span>
          </div>
          {t.pricingRows.map((p) => (
            <div key={p.cat} className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-2 md:gap-4 px-5 py-4 border-b border-white/5 last:border-b-0">
              <div>
                <div className="text-bone font-medium">{p.cat}</div>
                <div className="text-[12px] text-ash leading-relaxed">{p.blurb}</div>
              </div>
              <div className="md:text-right text-sm font-mono text-bone"><span className="md:hidden text-ash text-[10px] uppercase tracking-[0.2em] mr-2">{t.setupLabel}</span>{p.initial}</div>
              <div className="md:text-right text-sm font-mono text-ash"><span className="md:hidden text-ash text-[10px] uppercase tracking-[0.2em] mr-2">{t.hostingLabel}</span>{p.hosting}</div>
              <div className="md:text-right text-sm font-mono text-ash"><span className="md:hidden text-ash text-[10px] uppercase tracking-[0.2em] mr-2">{t.updateLabel}</span>{p.updates}</div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-4 grid md:grid-cols-2 gap-3 md:gap-4 text-[12px] text-ash leading-relaxed">
          <p className="border-l-2 border-accent/50 pl-4">
            {t.pricingNote1}
          </p>
          <p className="border-l-2 border-accent/50 pl-4">
            {t.pricingNote2}
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mt-4">
          {t.plans.map((p) => (
            <div key={p.t} className="border border-white/10 bg-ink p-6">
              <div className="font-display text-bone text-2xl mb-1">{p.t}</div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-accent mb-3">{p.for}</div>
              <p className="text-[13px] text-ash leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Process ── */}
      <div className="mt-24 md:mt-32">
        <SectionLabel>{t.theProcess}</SectionLabel>
        <ol className="grid md:grid-cols-5 gap-3 md:gap-4">
          {t.processSteps.map((step, i) => (
            <li key={i} className="border-t-2 border-accent/40 pt-4">
              <div className="font-mono text-[11px] text-accent mb-2">0{i + 1}</div>
              <p className="text-[13px] text-ash leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── CTA ── */}
      <div className="mt-20 border border-white/10 bg-void/40 p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <SectionLabel>{t.letsBuild}</SectionLabel>
          <h3 className="font-display text-bone text-3xl md:text-5xl leading-[0.95] mb-4">{t.bringIdea}</h3>
          <p className="text-sm text-ash max-w-md leading-relaxed">
            {t.ctaBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-ash">
            <span>alercebolson@gmail.com</span>
            <span>+54 2944 803301</span>
            <a href="https://instagram.com/NikoAlerce.art" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">@NikoAlerce.art</a>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <a href={MAIL} className="group inline-flex items-center justify-center gap-3 whitespace-nowrap border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-8 py-5 text-[11px] tracking-[0.25em] uppercase">
            {lang === "es" ? "Empezar un proyecto" : "Start a project"} <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 whitespace-nowrap border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-8 py-4 text-[11px] tracking-[0.25em] uppercase">
            WhatsApp ↗
          </a>
        </div>
      </div>
    </section>
  );
}
