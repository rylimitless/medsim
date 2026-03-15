import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["pg"],
 
  /* config options here */
};

export default nextConfig;
