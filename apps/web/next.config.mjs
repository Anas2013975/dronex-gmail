/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@dronex/shared"],
  serverExternalPackages: ["postgres"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "Cache-Control", value: "no-store" },
    ] }];
  },
};
