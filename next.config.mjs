/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
