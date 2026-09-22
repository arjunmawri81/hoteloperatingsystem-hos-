import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Read backend/.env using native Node.js fs
const envFilePath = path.resolve(__dirname, "../backend/.env");
const envVars: Record<string, string> = {};

if (fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      envVars[key] = value;
    }
  }
}

const targetBackendUrl =
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") : "") ||
  envVars.APP_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "10.18.242.58",
    "10.18.242.58:3000",
    "0.0.0.0",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || envVars.FIREBASE_API_KEY || "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || envVars.FIREBASE_AUTH_DOMAIN || "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || envVars.FIREBASE_PROJECT_ID || "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || envVars.FIREBASE_STORAGE_BUCKET || "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || envVars.FIREBASE_MESSAGING_SENDER_ID || "",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || envVars.FIREBASE_APP_ID || "",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || envVars.FIREBASE_MEASUREMENT_ID || "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (envVars.APP_URL ? `${envVars.APP_URL}/api` : ""),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${targetBackendUrl.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;


