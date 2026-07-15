/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev və production build eyni cache-ə yazanda webpack chunk-ları itə bilir.
  // `npm run dev` scripts/dev-safe.js vasitəsilə NEXT_DIST_DIR=.next-dev təyin edir.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
