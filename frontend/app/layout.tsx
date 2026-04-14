import type { Metadata } from "next";
import { Orbitron, DM_Mono, DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const f1Regular = localFont({
  src: "../public/fonts/Formula1-Regular.otf",
  variable: "--font-f1-regular",
  weight: "400",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "DreamF1",
  description: "Telemetry and Friend circle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${f1Regular.variable} ${orbitron.variable} ${dmMono.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-[#0a0a0a] text-[#f3f3f3] antialiased">
        {children}
      </body>
    </html>
  );
}
