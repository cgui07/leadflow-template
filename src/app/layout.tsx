import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadFlow",
  description: "Plataforma de gestão de leads e pipeline de vendas",
  icons: {
    icon: [
      { url: "/favicon.ico?v=lead-logo-1" },
      { url: "/icon.png?v=lead-logo-1", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=lead-logo-1",
    apple: "/apple-icon.png?v=lead-logo-1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
