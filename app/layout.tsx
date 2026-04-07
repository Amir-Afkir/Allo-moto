import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import Footer from "@/app/_shared/components/Footer";
import Header from "@/app/_shared/components/Header";

const display = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Allo Moto",
    template: "%s | Allo Moto",
  },
  description:
    "Location de moto premium avec catalogue clair, réservation fluide et expérience mobile-first.",
  icons: {
    icon: "/logo-allo-moto.png",
    shortcut: "/logo-allo-moto.png",
    apple: "/logo-allo-moto.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-background text-foreground`}
      >
        <Header />
        <div className="app-shell-root">{children}</div>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
