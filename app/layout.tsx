import type { Metadata, Viewport } from "next";
import InstallPrompt from "@/components/InstallPrompt";
import GlobalHaptics from "@/utils/GlobalHaptics";
import "./globals.css"; 

// 1. Configuración de pantalla para la PWA
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. Metadatos de la aplicación
export const metadata: Metadata = {
  title: "CALIBRE",
  description: "Sistema inteligente para talleres mecánicos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CALIBRE",
  },
  formatDetection: {
    telephone: false,
  },
};

// 3. 🔥 ESTE ES EL COMPONENTE QUE NEXT.JS NO ENCONTRABA (El esqueleto)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        
        {/* 🔥 AQUÍ RENDERIZAMOS EL BANNER DE INSTALACIÓN */}
        <InstallPrompt />
        
      </body>
    </html>
  );
}