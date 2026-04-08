import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gallery | Photography Portfolio",
  description:
    "A curated collection of photography — landscapes, portraits, and street scenes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-sans">
        <Header />
        <main className="flex-1 pt-[73px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
