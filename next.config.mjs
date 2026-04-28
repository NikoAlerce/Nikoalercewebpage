/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
      },
    ];
  },
  /**
   * Beacon / WalletConnect / webpack dev chunks may use eval(); wasm needs
   * 'wasm-unsafe-eval'. Chrome also consults script-src-elem for some script loads.
   *
   * If eval is STILL blocked: another policy may be layered (browser extension,
   * reverse proxy, or Vercel → Project → Security / Firewall with a CSP — remove
   * or align it so script-src also includes 'unsafe-eval').
   */
  async headers() {
    const script =
      "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https: blob: data:";
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${script}`,
              // Explicit elem line avoids some Chromium code paths defaulting stricter
              `script-src-elem ${script}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              // blob: — GLTFLoader / FileLoader fetch embedded textures as blob: URLs
              "connect-src 'self' https: wss: ws: blob:",
              "media-src 'self' https: blob: data:",
              "frame-src https:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.objkt.media" },
      { protocol: "https", hostname: "**.objkt.com" },
      { protocol: "https", hostname: "assets.objkt.media" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "**.ipfs.nftstorage.link" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
    ],
  },
  transpilePackages: ["three"],
  webpack: (config, { isServer }) => {
    // Beacon SDK trae deps de Node que no existen en el browser.
    // Las marcamos como vacías para evitar el "Module not found".
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        "pino-pretty": false,
      };
    }
    config.externals = config.externals ?? [];
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "encoding");
    }
    return config;
  },
};

export default nextConfig;
