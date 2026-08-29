import type { Metadata } from "next";
import { Inter } from "next/font/google";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { LayoutModeProvider } from "@/lib/layout-mode";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BT Photography | Artistic Portfolio",
  description: "Artistic photography portfolio featuring comedy, portrait, and music photography by BT",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LayoutModeProvider>
          <HeroSection />
          <main className="flex-1">{children}</main>
          <Footer />
        </LayoutModeProvider>
      </body>
    </html>
  );
}
