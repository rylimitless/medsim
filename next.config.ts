import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["pg"],

  // Expose these server env vars to client-side code via process.env
  env: {
    GOOGLE_GENAI_MODEL: process.env.GOOGLE_GENAI_MODEL ?? "gemini-2.0-flash",
    OPENROUTER_TRANSCRIPTION_MODEL: process.env.OPENROUTER_TRANSCRIPTION_MODEL ?? "google/gemini-3-flash-preview",
  },

  // Use Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
