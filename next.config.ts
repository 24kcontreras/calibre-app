import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Solo activa en producción
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tus otras configuraciones de Calibre (images, etc) aquí
};

export default withPWA(nextConfig);