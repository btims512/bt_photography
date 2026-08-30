import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL("https://thebtphotography.com"),
  title: "BT Photography | Artistic Portfolio",
  description: "Artistic photography portfolio featuring comedy, portrait, and music photography by BT",
  openGraph: {
    title: "BT Photography",
    description: "Artistic photography portfolio featuring comedy, portrait, and music photography by BT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BT Photography",
    description: "Artistic photography portfolio featuring comedy, portrait, and music photography by BT",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Refreshing mid-scroll - especially inside the tall breakout/rail
            pin zones - was landing back wherever the browser's own
            scroll-restoration put you, not the top: Safari and Chrome both
            try to preserve scroll position across a reload by default.
            beforeInteractive runs this before hydration (and before the
            browser would otherwise restore scroll for this load), which a
            useEffect-based fix couldn't guarantee - by the time an effect
            runs, the browser may have already jumped to the old position. */}
        <Script id="disable-scroll-restoration" strategy="beforeInteractive">
          {"try { if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; } } catch (e) {}"}
        </Script>
        <LayoutModeProvider>
          <HeroSection />
          <main className="flex-1">{children}</main>
          <Footer />
        </LayoutModeProvider>
      </body>
    </html>
  );
}
