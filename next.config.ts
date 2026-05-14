import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack re-embalaje Prisma y pierda delegados de modelos en Server Components.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb"],
  // Marketing landing pages still use the AI-design placeholder URLs.
  // Whitelist them so <Image /> works without changing every src to a local copy.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
};

export default nextConfig;
