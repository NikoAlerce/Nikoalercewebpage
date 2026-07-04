"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLang, type Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Emergency support campaign — bilingual (EN/ES). Updated after the second fire
// (July 2026): the first home was lost to the January Epuyén wildfires; the
// rebuilt home was then lost to a heater malfunction, along with the couple's
// pets. Language follows the site-wide switch; /ayuda forces Spanish.
//
// Layout: the donation methods sit ABOVE the article headline (donate first,
// read the full story after) — the long-read essay is Niko's own words,
// unedited; only the January timeline note below it was expanded, with facts
// verified against news coverage of the Epuyén/Puerto Patriada fire (started
// Jan 5 2026, >20,000 ha burned, contained after 39 days, Chubut declared a
// state of catastrophe) — see the fire coverage cited in the project history.
// A method's button only renders if its value is set, so nothing broken ships.
// ─────────────────────────────────────────────────────────────────────────────
const DONATE = {
  coffee: "https://ko-fi.com/nikoalerce",
  paypal: "alercebolson@gmail.com",
  tezos: "tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb",
  eth: "0x70400e1B9Cf40151E5c76dF8B7C95c87001f51FB",
  btc: "bc1qxzvmjzszjk89uvtazclntp8ch959gu4axv5n8c",
  aliasMaru: { alias: "nectar.producciones", holder: "Mariela Fernanda Gonzalez" },
  aliasNiko: { alias: "giraleaniko", holder: "Nicolas Marcelo Krasniansky" },
};

/** A quiet section break inside the long-read, marking a shift in the story. */
function Divider() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <span className="w-10 h-px rule-accent" />
    </div>
  );
}

/** A photo/video breaking the text at the moment it belongs to, not dumped in a grid at the end. */
function InlineMedia({ children }: { children: React.ReactNode }) {
  return <div className="my-8 grid grid-cols-2 gap-3">{children}</div>;
}

function Photo({ src, caption }: { src: string; caption: string }) {
  return (
    <figure>
      <img
        src={src}
        alt={caption}
        loading="lazy"
        className="w-full h-40 md:h-52 object-cover border border-white/10"
      />
      <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
        {caption}
      </figcaption>
    </figure>
  );
}

function VideoClip({ src, caption }: { src: string; caption: string }) {
  return (
    <figure>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full h-40 md:h-52 object-cover border border-white/10 bg-black"
      />
      <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
        {caption}
      </figcaption>
    </figure>
  );
}

const T = {
  en: {
    kicker: "Emergency · we need your help",
    titleA: (
      <>
        There are kinds of grief
        <br />
        for which language has no words
      </>
    ),
    story: [
      <p key="s1">There are years that divide your life into a before and an after.</p>,
      <p key="s2">For me, 2026 became that year.</p>,
      <p key="s3">
        In January, the wildfire that swept through Epuyén destroyed the home where
        Maru and I had lived for five years. It was much more than a house. We had
        built our home, our studio, and our everyday life there. It was where our
        little family grew, surrounded by the forest and the community of Bosque
        Gracias, a place we had chosen not just to live, but to belong.
      </p>,
      <p key="s4">
        When the fire was finally over, the landscape was almost impossible to
        recognize. The forest had turned to ash, and our home was gone. Like so many
        other families, we had to begin again from nothing.
      </p>,
      <p key="s5">
        The provincial government announced that new houses would be built for
        people who had lost everything. We believed we would be among them.
      </p>,
      <p key="s6">We weren&apos;t.</p>,
      <p key="s7">
        The land where our house stood wasn&apos;t legally ours. Even though we had
        helped build the house, lived there for five years, and called it home, we
        were excluded from the reconstruction program because we didn&apos;t own the
        property.
      </p>,
      <p key="s8">It was a painful reality to accept.</p>,
      <p key="s9">
        We hadn&apos;t just lost a house. We had lost the place where we imagined
        our future.
      </p>,
      <p key="s10">
        A friend offered us a small studio apartment while we tried to figure out
        what came next.
      </p>,
      <p key="s11">We believed the worst was behind us.</p>,
      <p key="s12">We were wrong.</p>,
      <InlineMedia key="mediaJan">
        <Photo src="/fire-approaching.webp" caption="January — the fire reaching home" />
        <Photo src="/fire-aftermath.webp" caption="January — what was left" />
      </InlineMedia>,
      <p key="s13">During those months, our dog Roger was killed by a neighbor&apos;s dog.</p>,
      <p key="s14">Even now, writing that sentence hurts.</p>,
      <p key="s15">
        We were still trying to gather the pieces of our lives when we lost another
        member of our family.
      </p>,
      <p key="s16">Then our community held us up once again.</p>,
      <p key="s17">
        Bosque Gracias has never been just a place. It is a way of living, creating,
        and taking care of one another. Rocío and her family offered us the house the
        government had built for them. Since they were temporarily living in domes
        while rebuilding their own home, they invited us to stay there instead.
      </p>,
      <p key="s18">Because of them, we were able to return to the forest with our animals.</p>,
      <p key="s19">For a brief moment, life felt like it was beginning to settle again.</p>,
      <p key="s20">It lasted twenty days.</p>,
      <Divider key="d2" />,
      <p key="s21">
        One morning we lit the wood stove, just as we always did. About twenty
        minutes later, we smelled smoke.
      </p>,
      <p key="s22">
        When we saw the flames, we did everything we could to stop them. We ran in
        and out of the house trying to put the fire out until it became impossible
        to go back inside. By then, the house was completely engulfed.
      </p>,
      <p key="s23">All we could do was watch.</p>,
      <p key="s24">
        As the fire consumed our home, we kept telling ourselves that maybe Chopi
        and the cats had escaped without us noticing. It was the only hope we had
        left.
      </p>,
      <p key="s25">
        Hilacha survived. She had spent the night outside in her little shelter, and
        that simple coincidence saved her life.
      </p>,
      <p key="s26">We waited.</p>,
      <p key="s27">Hours passed.</p>,
      <p key="s28">They never came.</p>,
      <p key="s29">
        When we were finally able to get close to the house, we learned that Chopi,
        Boldo, Rudi, and Totoro had been trapped inside.
      </p>,
      <InlineMedia key="mediaJul">
        <Photo src="/fire2-burning.webp" caption="July — our home burning" />
        <VideoClip src="/fire2-video.mp4" caption="July — video of the fire" />
      </InlineMedia>,
      <p key="s30">There are kinds of grief for which language still has no words.</p>,
      <p key="s31">
        Maru and I shared more than ten years with them. They grew up alongside us.
        They were there through every move, every project, every joyful moment, and
        every difficult one. They had survived the first wildfire with us.
      </p>,
      <p key="s32">
        We never imagined we would lose them only twenty days after finding our way
        back home.
      </p>,
      <p key="s33">
        The days that followed became a blur of investigators, officials, neighbors,
        friends, and endless questions.
      </p>,
      <p key="s34">
        The first findings point to a chain of failures: a poorly built wood stove, a
        defective installation, and construction materials that may not have been
        suitable. Perhaps one day we will know exactly how the fire began.
      </p>,
      <p key="s35">But no explanation changes the outcome.</p>,
      <Divider key="d4" />,
      <p key="s36">It has only been two days since the second fire.</p>,
      <p key="s37">I still smell smoke.</p>,
      <p key="s38">
        Sometimes I wake up expecting to hear Chopi walking through the house or one
        of the cats waiting for breakfast. Then I remember the house is gone, and so
        are they.
      </p>,
      <p key="s39">In less than a year, we lost our home twice.</p>,
      <p key="s40">And this time, we also lost Chopi, Boldo, Rudi, and Totoro.</p>,
      <p key="s41">I&apos;m not writing these words because I&apos;ve found meaning in what happened.</p>,
      <p key="s42">I haven&apos;t.</p>,
      <p key="s43">
        I&apos;m writing because I need there to be a record that they existed. That
        they were loved. That they were part of our family for more than a decade.
      </p>,
      <p key="s44">A house can be rebuilt.</p>,
      <p key="s45">Some absences cannot.</p>,
      <p key="s46">I don&apos;t know what tomorrow will look like.</p>,
      <p key="s47">
        Today, two days after the fire, I&apos;m simply trying to survive the grief.
      </p>,
    ],
    tlJanLabel: "January 2026",
    tlJan: (
      <>
        The wildfire that started near Puerto Patriada spread fast, burning more
        than 20,000 hectares in a matter of weeks — Chubut declared a state of
        catastrophe. It reached <span className="text-bone">Bosque Gracias</span>,
        where we lived. Our home burned down with nearly everything we owned.
      </>
    ),
    tlJulLabel: "July 2026",
    tlJul: (
      <>
        While rebuilding, a heater malfunction set fire to the place we were living
        in. We lost everything we had recovered — and our beloved pets.
      </>
    ),
    waysTitle: "Ways to help",
    waysIntro: (
      <>
        Anything helps — a coffee, a few coins, collecting a piece on{" "}
        <a
          href="https://objkt.com/@nikoalerce"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone hover:text-accent transition-colors link-underline"
        >
          objkt
        </a>
        , or simply sharing this page.
      </>
    ),
    shareTitle: "Share it — this reaches more people than any single donation",
    shareMsg:
      "Niko & Maru lost their home to a fire for the second time this year — and their pets too. Any help counts, even just sharing:",
    shareWhatsApp: "WhatsApp",
    shareX: "X / Twitter",
    shareCopy: "Copy link",
    shareCopied: "Link copied ✓",
    readIn: "Leer en español",
    mIntl: "International — card & PayPal",
    kofiBtn: "☕ Ko-fi — buy us a coffee ↗",
    paypalCopy: "PayPal (send to this email)",
    mAr: "From Argentina — bank transfer / Mercado Pago",
    arIntro:
      "If you're in Argentina, the most direct way to help us is a transfer by alias, to either of our two accounts:",
    aliasMaruLabel: `Maru's alias — ${DONATE.aliasMaru.holder}`,
    aliasNikoLabel: `Niko's alias — ${DONATE.aliasNiko.holder}`,
    mCrypto: "Crypto — any amount",
    btcNote:
      "Send over the Bitcoin network ONLY — funds sent on any other network will be lost.",
    copy: "Copy",
    copied: "Copied ✓",
    closing: (
      <>
        Whatever you can give — even just sharing this page — means the world to us
        right now. Thank you, truly. — Niko &amp; Maru
      </>
    ),
  },
  es: {
    kicker: "Emergencia · necesitamos tu ayuda",
    titleA: (
      <>
        Hay dolores para los que
        <br />
        el lenguaje no inventó palabras
      </>
    ),
    story: [
      <p key="s1">Hay años que dividen una vida en dos.</p>,
      <p key="s2">Para mí, 2026 fue ese año.</p>,
      <p key="s3">
        En enero, el incendio de Epuyén se llevó la casa donde vivíamos con Maru.
        Era mucho más que un techo. Durante cinco años construimos ahí nuestro
        hogar, nuestro taller, nuestro refugio y el lugar donde crecía nuestra
        familia. Vivíamos en Bosque Gracias, una comunidad que elegimos como forma
        de vida y de la que nos sentimos parte.
      </p>,
      <p key="s4">
        Cuando el fuego finalmente se apagó, el paisaje era irreconocible. Donde
        antes había bosque, había cenizas. Donde estaba nuestra casa, quedaban
        apenas restos. Como tantas otras familias, nos tocó empezar de cero.
      </p>,
      <p key="s5">
        El gobierno provincial anunció viviendas para quienes lo habían perdido
        todo. Pensamos que nosotros también podríamos reconstruir nuestra vida.
      </p>,
      <p key="s6">Pero no fue así.</p>,
      <p key="s7">
        La tierra donde vivíamos no estaba a nuestro nombre. Habíamos ayudado a
        construir esa casa, la habitábamos desde hacía cinco años y era nuestro
        hogar. Sin embargo, para el Estado eso no alcanzó. Como no éramos los
        propietarios legales del terreno, quedamos afuera del programa de
        viviendas.
      </p>,
      <p key="s8">Fue un golpe muy difícil de entender.</p>,
      <p key="s9">
        No habíamos perdido solamente una casa. También habíamos perdido el lugar
        donde imaginábamos nuestro futuro.
      </p>,
      <p key="s10">
        Un amigo nos prestó un pequeño monoambiente en Las Golondrinas mientras
        intentábamos reorganizar una vida que parecía haberse desarmado por
        completo.
      </p>,
      <p key="s11">Creíamos que lo peor ya había pasado.</p>,
      <p key="s12">Nos equivocábamos.</p>,
      <InlineMedia key="mediaJan">
        <Photo src="/fire-approaching.webp" caption="Enero — el fuego llegando a casa" />
        <Photo src="/fire-aftermath.webp" caption="Enero — lo que quedó" />
      </InlineMedia>,
      <p key="s13">En esos meses, el perro de un vecino mató a Roger.</p>,
      <p key="s14">Todavía me cuesta escribir esa frase.</p>,
      <p key="s15">
        Ya veníamos intentando acomodar los pedazos de una vida rota y, de golpe,
        perdimos a uno de los integrantes de nuestra familia.
      </p>,
      <p key="s16">Fue entonces cuando Bosque Gracias volvió a abrazarnos.</p>,
      <p key="s17">
        Bosque Gracias nunca fue solamente un lugar. Siempre fue una forma de
        vivir, de crear y de sostenernos entre todos. Por eso, cuando ya no
        sabíamos hacia dónde ir, Rocío y su familia hicieron lugar para nosotros.
        Nos prestaron la casa que el gobierno les había construido, mientras ellos
        seguían viviendo en unos domos y reconstruyendo su hogar. Gracias a ellos
        pudimos volver al bosque con nuestros animales y sentir, por un momento,
        que la vida empezaba a acomodarse otra vez.
      </p>,
      <p key="s18">Volver fue un alivio.</p>,
      <p key="s19">
        Otra vez escuchábamos el viento entre los árboles. Otra vez desayunábamos
        mirando el bosque. Otra vez sentíamos que estábamos donde queríamos estar.
      </p>,
      <p key="s20">
        Éramos una familia con una ausencia enorme, la de Roger, pero estábamos
        sanando.
      </p>,
      <p key="s21">Esa tranquilidad duró apenas veinte días.</p>,
      <Divider key="d2" />,
      <p key="s22">
        Una mañana prendimos la estufa, como hacíamos siempre. Unos veinte minutos
        después sentimos olor a humo. Cuando vimos el fuego intentamos apagarlo.
        Entramos y salimos de la casa varias veces buscando controlar las llamas,
        hasta que llegó un momento en que ya era imposible volver a entrar. El
        fuego había tomado toda la estructura.
      </p>,
      <p key="s23">Salimos y no nos quedó otra que mirar.</p>,
      <p key="s24">
        Mientras la casa se consumía hacíamos cuentas con el tiempo. Todo había
        pasado demasiado rápido. Nos repetíamos que, quizás, Chopi y los gatos
        habían logrado salir sin que nosotros los viéramos. Era la única esperanza
        a la que podíamos aferrarnos.
      </p>,
      <p key="s25">
        Hilacha estaba afuera. Había pasado la noche en su cucha y esa casualidad
        le salvó la vida.
      </p>,
      <p key="s26">Esperamos durante horas que aparecieran los demás.</p>,
      <p key="s27">No aparecieron.</p>,
      <p key="s28">
        Cuando finalmente pudimos acercarnos a la casa, entendimos que Chopi,
        Boldo, Rudi y Totoro habían quedado atrapados adentro.
      </p>,
      <InlineMedia key="mediaJul">
        <Photo src="/fire2-burning.webp" caption="Julio — nuestra casa en llamas" />
        <VideoClip src="/fire2-video.mp4" caption="Julio — video del incendio" />
      </InlineMedia>,
      <p key="s29">Hay dolores para los que el lenguaje todavía no inventó palabras.</p>,
      <p key="s30">
        Con Maru compartimos más de diez años con ellos. Crecieron con nosotros.
        Nos acompañaron en cada mudanza, en cada proyecto, en los días buenos y en
        los malos. Eran parte de nuestra familia. Habían sobrevivido al incendio de
        enero. Nunca imaginamos que veinte días después de volver al bosque los
        íbamos a perder para siempre.
      </p>,
      <p key="s31">
        Los días siguientes fueron una mezcla de peritajes, funcionarios, vecinos,
        amigos y preguntas. Todos buscaban entender qué había pasado.
      </p>,
      <p key="s32">
        Las primeras conclusiones hablan de una sucesión de fallas. Una estufa mal
        construida, una instalación deficiente y materiales que posiblemente no
        eran los adecuados. Tal vez algún día sepamos exactamente cómo empezó el
        fuego.
      </p>,
      <p key="s33">Pero ninguna explicación cambia el resultado.</p>,
      <Divider key="d4" />,
      <p key="s34">Han pasado apenas dos días desde el segundo incendio.</p>,
      <p key="s35">Todavía siento olor a humo.</p>,
      <p key="s36">
        Todavía me despierto creyendo que voy a escuchar a Chopi caminando por la
        casa o a alguno de los gatos esperando el desayuno. Después recuerdo que la
        casa ya no está y que ellos tampoco.
      </p>,
      <p key="s37">En menos de un año perdimos dos veces nuestro hogar.</p>,
      <p key="s38">Y esta vez también perdimos a Chopi, Boldo, Rudi y Totoro.</p>,
      <p key="s39">
        No escribo estas líneas porque ya tenga una enseñanza o porque haya logrado
        encontrarle un sentido a todo esto. La verdad es que todavía no lo
        encuentro.
      </p>,
      <p key="s40">
        Escribo porque necesito dejar un registro de que ellos existieron. De que
        fueron parte de nuestra familia durante más de diez años. De que fueron
        amados. Y de que una casa puede volver a construirse, pero hay ausencias
        que no tienen reemplazo.
      </p>,
      <p key="s41">No sé qué va a pasar mañana.</p>,
      <p key="s42">
        Hoy, dos días después del incendio, simplemente estoy intentando atravesar
        el dolor.
      </p>,
    ],
    tlJanLabel: "Enero 2026",
    tlJan: (
      <>
        El incendio que comenzó cerca de Puerto Patriada avanzó muy rápido: quemó
        más de 20.000 hectáreas en pocas semanas y Chubut declaró el estado de
        catástrofe. Llegó hasta{" "}
        <span className="text-bone">Bosque Gracias</span>, donde vivíamos. Nuestra
        casa se quemó con casi todo lo que teníamos.
      </>
    ),
    tlJulLabel: "Julio 2026",
    tlJul: (
      <>
        Mientras reconstruíamos, una falla en la estufa incendió el lugar donde
        estábamos viviendo. Perdimos todo lo que habíamos recuperado — y a nuestras
        mascotas queridas.
      </>
    ),
    waysTitle: "Cómo ayudar",
    waysIntro: (
      <>
        Todo suma — un café, unas monedas, coleccionar una obra en{" "}
        <a
          href="https://objkt.com/@nikoalerce"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone hover:text-accent transition-colors link-underline"
        >
          objkt
        </a>
        , o simplemente compartir esta página.
      </>
    ),
    shareTitle: "Compartila — llega a más gente que cualquier donación sola",
    shareMsg:
      "Niko y Maru perdieron su hogar en un incendio por segunda vez en el año — y también a sus mascotas. Cualquier ayuda suma, aunque sea compartir:",
    shareWhatsApp: "WhatsApp",
    shareX: "X / Twitter",
    shareCopy: "Copiar link",
    shareCopied: "Link copiado ✓",
    readIn: "Read in English",
    mIntl: "Internacional — tarjeta y PayPal",
    kofiBtn: "☕ Ko-fi — invitanos un café ↗",
    paypalCopy: "PayPal (enviá a este email)",
    mAr: "Desde Argentina — transferencia / Mercado Pago",
    arIntro:
      "Si estás en Argentina, la forma más directa de ayudarnos es por alias, a cualquiera de nuestras dos cuentas:",
    aliasMaruLabel: `Alias de Maru — ${DONATE.aliasMaru.holder}`,
    aliasNikoLabel: `Alias de Niko — ${DONATE.aliasNiko.holder}`,
    mCrypto: "Cripto — cualquier monto",
    btcNote:
      "Enviá ÚNICAMENTE por la red Bitcoin — los fondos enviados por cualquier otra red se pierden.",
    copy: "Copiar",
    copied: "Copiado ✓",
    closing: (
      <>
        Lo que puedas dar — incluso solo compartir esta página — significa muchísimo
        para nosotros en este momento. Gracias de corazón. — Niko &amp; Maru
      </>
    ),
  },
};

function CopyRow({
  label,
  symbol,
  address,
  note,
  copyLabel,
  copiedLabel,
  qr,
}: {
  label: string;
  symbol?: string;
  address: string;
  note?: string;
  copyLabel: string;
  copiedLabel: string;
  /** Show a scannable QR of the address — useful for crypto wallets (bank aliases aren't scannable). */
  qr?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the address is visible to copy by hand */
    }
  };
  return (
    <div className="border border-white/10 bg-void/40 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="font-sans text-[11px] tracking-[0.3em] uppercase text-ash">{label}</span>
        {symbol && <span className="font-mono text-[11px] text-accent">{symbol}</span>}
      </div>
      <div className={qr ? "flex items-start gap-4 mb-3" : "mb-3"}>
        {qr && (
          <div className="shrink-0 bg-void p-1.5 border border-white/10">
            <QRCodeSVG value={address} size={72} bgColor="#000000" fgColor="#f5f4ef" level="M" />
          </div>
        )}
        <div className="font-mono text-[12px] text-bone/80 break-all leading-relaxed min-w-0">{address}</div>
      </div>
      {note && (
        <p className="font-sans text-[11px] text-accent/90 leading-relaxed mb-3">⚠ {note}</p>
      )}
      <button
        onClick={copy}
        className="w-full border border-white/15 text-bone hover:border-accent hover:text-accent transition-colors px-4 py-2.5 text-[11px] tracking-[0.25em] uppercase"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

/** One-tap share row — WhatsApp is the dominant channel for this kind of appeal in Argentina.
 *  The shared URL points at the language-appropriate route (/ayuda = ES, /support = EN). */
function ShareRow({
  message,
  path,
  waLabel,
  xLabel,
  copyLabel,
  copiedLabel,
}: {
  message: string;
  path: string;
  waLabel: string;
  xLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = () =>
    typeof window !== "undefined" ? `${window.location.origin}${path}` : `https://nikoalerce.art${path}`;
  const wa = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url()}`)}`, "_blank", "noopener");
  const x = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url())}`,
      "_blank",
      "noopener",
    );
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };
  const btn =
    "inline-flex items-center gap-2 border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-5 py-3 text-[11px] tracking-[0.2em] uppercase";
  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={wa} className={btn}>💬 {waLabel}</button>
      <button onClick={x} className={btn}>✕ {xLabel}</button>
      <button onClick={copyLink} className={btn}>🔗 {copied ? copiedLabel : copyLabel}</button>
    </div>
  );
}

function MethodLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash/70 mb-4 mt-10 first:mt-0">
      {children}
    </div>
  );
}

export default function Support({ forceLang }: { forceLang?: Lang }) {
  const { lang: ctxLang, setLang } = useLang();
  // Local language for THIS article, so the in-article toggle works on any route (even
  // /ayuda, which seeds Spanish). Kept in sync with the global switch when not forced.
  const [lang, setLocalLang] = useState<Lang>(forceLang ?? ctxLang);
  useEffect(() => { if (!forceLang) setLocalLang(ctxLang); }, [ctxLang, forceLang]);
  const switchLang = (l: Lang) => { setLocalLang(l); setLang(l); };
  const t = T[lang];

  return (
    <section
      id="support"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1100px] mx-auto border-t border-white/5"
    >
      {/* Kicker + in-article language toggle (so a shared link reads in either language) */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-10 h-px rule-accent shrink-0" />
          <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-accent">
            {t.kicker}
          </span>
        </div>
        <button
          onClick={() => switchLang(lang === "es" ? "en" : "es")}
          className="shrink-0 font-sans text-[10px] tracking-[0.15em] uppercase border border-white/20 rounded-full px-3 py-1.5 text-ash hover:text-bone hover:border-accent transition-colors"
        >
          {t.readIn}
        </button>
      </div>

      {/* ══════════ WAYS TO HELP — up top, before the headline ══════════ */}
      <div className="max-w-2xl">
        <h3 className="font-display text-bone text-2xl md:text-3xl mb-2">{t.waysTitle}</h3>
        <p className="font-sans text-[13px] text-ash leading-relaxed">{t.waysIntro}</p>

        {/* Share — the highest-leverage way to help */}
        <MethodLabel>{t.shareTitle}</MethodLabel>
        <ShareRow
          message={t.shareMsg}
          path={lang === "es" ? "/ayuda" : "/support"}
          waLabel={t.shareWhatsApp}
          xLabel={t.shareX}
          copyLabel={t.shareCopy}
          copiedLabel={t.shareCopied}
        />

        {/* International — card / PayPal */}
        <MethodLabel>{t.mIntl}</MethodLabel>
        <div className="flex flex-wrap gap-3">
          {DONATE.coffee && (
            <a
              href={DONATE.coffee}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
            >
              {t.kofiBtn}
            </a>
          )}
          {DONATE.paypal && (
            <a
              href={`https://www.paypal.com/donate/?business=${encodeURIComponent(DONATE.paypal)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
            >
              PayPal ↗
            </a>
          )}
        </div>
        {DONATE.paypal && (
          <div className="mt-3 max-w-md">
            <CopyRow
              label={t.paypalCopy}
              address={DONATE.paypal}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
          </div>
        )}

        {/* Argentina — aliases */}
        <MethodLabel>{t.mAr}</MethodLabel>
        <p className="font-sans text-[13px] text-ash leading-relaxed mb-4">{t.arIntro}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <CopyRow
            label={t.aliasMaruLabel}
            address={DONATE.aliasMaru.alias}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
          <CopyRow
            label={t.aliasNikoLabel}
            address={DONATE.aliasNiko.alias}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
        </div>

        {/* Crypto */}
        <MethodLabel>{t.mCrypto}</MethodLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          {DONATE.tezos && (
            <CopyRow qr label="Tezos" symbol="XTZ" address={DONATE.tezos} copyLabel={t.copy} copiedLabel={t.copied} />
          )}
          {DONATE.eth && (
            <CopyRow qr label="Ethereum" symbol="ETH / EVM" address={DONATE.eth} copyLabel={t.copy} copiedLabel={t.copied} />
          )}
          {DONATE.btc && (
            <CopyRow
              qr
              label="Bitcoin"
              symbol="BTC"
              address={DONATE.btc}
              note={t.btcNote}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
          )}
        </div>
      </div>

      {/* ══════════ THE ARTICLE ══════════ */}
      <h2 className="mt-16 font-graffiti text-bone leading-[1.05] text-[clamp(2rem,6vw,4.2rem)]">
        {t.titleA}
        <span className="text-accent">.</span>
      </h2>

      {/* ── The story — Niko's own words ── */}
      <div className="mt-6 space-y-4 font-sans text-[15px] md:text-base text-ash leading-relaxed max-w-2xl">
        {t.story}
      </div>

      {/* ── Timeline: two fires in one year ── */}
      <div className="mt-10 border-l-2 border-accent/50 pl-5 space-y-4 max-w-2xl">
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            {t.tlJanLabel}
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">{t.tlJan}</p>
        </div>
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            {t.tlJulLabel}
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">{t.tlJul}</p>
        </div>
      </div>

      {/* Close */}
      <p className="mt-12 font-sans text-[14px] text-bone/85 leading-relaxed max-w-xl">
        {t.closing}
      </p>
    </section>
  );
}
