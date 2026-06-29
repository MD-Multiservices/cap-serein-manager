import type {
  Metadata,
  Viewport,
} from "next";

import AppShell from "@/components/layout/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cap Serein Manager",
  description:
    "Logiciel de gestion pour conciergerie et locations saisonnières.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}