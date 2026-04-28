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
   * Beacon / WalletConnect use patterns that hit `eval` unless script-src allows it.
   * If the browser still reports CSP blocks, check Vercel → Project → Security
   * for a second CSP header (multiple policies are combined; all must allow eval).
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https: blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss: ws:",
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
