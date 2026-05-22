import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NeuroLearn — AI Adaptive Tutor",
  description: "The world's first AI tutor that sees how you learn, adapts in real-time, and takes you from zero to career-ready with verified credentials.",
  keywords: ["AI tutor", "adaptive learning", "skill development", "career ready", "NeuroLearn"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#F8F9FA] text-slate-900 min-h-screen`}>
        <Providers>
          <div className="neural-bg gradient-mesh min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
