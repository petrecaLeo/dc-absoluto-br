import type { NextConfig } from "next"

import { OPTIMIZED_IMAGE_HOSTNAMES } from "./src/lib/remote-images"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dc-absoluto/shared-types", "@dc-absoluto/shared-schemas"],
  images: {
    remotePatterns: OPTIMIZED_IMAGE_HOSTNAMES.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
