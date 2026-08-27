import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WhatsappFab } from "@/components/ui/whatsapp-fab";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ConfirmProvider } from "@/components/ui/confirm-provider";

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
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v194/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1n-q_4MrImHCIJIZrDCvHOejbd5zrDAt.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          document.fonts.ready.then(function() {
            var splash = document.getElementById('global-splash-screen');
            if (splash) {
              setTimeout(function() {
                splash.style.opacity = '0';
                splash.style.pointerEvents = 'none';
                setTimeout(function() { splash.style.display = 'none'; }, 500);
              }, 800); // Wait extra 800ms for browser to finish painting fonts
            }
          });
        ` }} />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-clip">
        <div id="global-splash-screen" suppressHydrationWarning className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Memuat aplikasi...</p>
        </div>
        <ConfirmProvider>
          <ToastProvider>
            {children}
            <WhatsappFab />
          </ToastProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
