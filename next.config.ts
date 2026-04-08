import type { NextConfig } from "next";

const ossCustomDomain = process.env.ALIYUN_OSS_CUSTOM_DOMAIN;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.aliyuncs.com",
      },
      ...(ossCustomDomain
        ? [{ protocol: "https" as const, hostname: ossCustomDomain }]
        : []),
    ],
  },
};

export default nextConfig;
