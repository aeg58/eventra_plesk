import type { Metadata } from "next";
import "./styles/globals.css";
import LayoutClient from "./components/LayoutClient";

export const metadata: Metadata = {
  title: "Eventra - Düğün ve Etkinlik Takip Sistemi",
  description: "Modern düğün salonu ve etkinlik yönetim sistemi",
  robots: "noindex, nofollow",
  icons: {
    icon: '/eventra/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}

