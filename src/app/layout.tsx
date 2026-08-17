import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { Providers } from "@/components/providers";
import "./globals.css";

/**
 * Archivo, d'Omnibus-Type. Grotesque dessinée pour la signalétique et
 * l'édition : lisible sur un écran d'Android bon marché, et sérieuse par
 * construction. Son axe de largeur permet des titres larges façon affiche
 * et un texte d'interface étroit avec une seule famille.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Écoute les rappeurs sénégalais gratuitement. Soutiens-les directement par mobile money.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={archivo.variable}>
      <body className="grain antialiased">
        <div className="ambient" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
