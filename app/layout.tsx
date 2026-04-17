import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
//usaremos githubbb



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'CALIBRE | Neural Garage OS',
  description: 'Gestión inteligente para talleres mecánicos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CALIBRE'
  },
}

export const viewport: Viewport = {
  themeColor: '#020617', // Pinta la barra de arriba del mismo color slate-950
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Esto bloquea el zoom automático al escribir
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}