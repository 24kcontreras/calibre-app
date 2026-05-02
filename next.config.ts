import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // La PWA no se activa en local para que no moleste al programar
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // 🔥 ESTO SILENCIA EL ERROR DE NEXT.JS
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const, 
        hostname: '**.supabase.co' },
    ],
  },
};

export default withPWA(nextConfig);