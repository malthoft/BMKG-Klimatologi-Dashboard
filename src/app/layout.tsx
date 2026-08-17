import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WhatsappFab } from "@/components/ui/whatsapp-fab";
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Staklim Malang - Monitoring Cuaca",
  description: "Portal monitoring data cuaca realtime Stasiun Klimatologi Malang",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} font-sans antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-clip">
        <ToastProvider>
          {children}
          <WhatsappFab />
        </ToastProvider>
      </body>
    </html>
  );
}
