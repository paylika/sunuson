import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Écoute les rappeurs sénégalais gratuitement. Soutiens-les directement par mobile money.",
};

export const viewport: Viewport = {
  themeColor: "#f7f4fb",
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
    <html lang="fr">
      <body className="grain antialiased">
        <div className="ambient" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
