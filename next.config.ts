import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack re-embalaje Prisma y pierda delegados de modelos en Server Components.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb"],
};

export default nextConfig;
