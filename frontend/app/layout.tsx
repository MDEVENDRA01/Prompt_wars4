import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "StadiumIQ — FIFA World Cup 2026 AI Command Hub",
  description: "AI-guided operations, real-time crowd heatmaps, accessibility routing, and incident reporting for modern smart stadiums.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F7F9FB] text-[#0F2C4C]`}>
        {children}
      </body>
    </html>
  );
}
