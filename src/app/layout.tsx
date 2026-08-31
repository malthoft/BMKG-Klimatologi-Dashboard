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
  title: "Staklim Malang - Monitoring Cuaca & Iklim Jawa Timur",
  description: "Portal resmi monitoring data cuaca realtime dan analisis iklim Stasiun Klimatologi Jawa Timur - BMKG",
  referrer: "no-referrer-when-downgrade",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003366",
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
          // Remove splash screen when fonts ready
          document.fonts.ready.then(function() {
            var splash = document.getElementById('global-splash-screen');
            if (splash) {
              setTimeout(function() {
                splash.style.opacity = '0';
                splash.style.pointerEvents = 'none';
                setTimeout(function() { splash.style.display = 'none'; }, 500);
              }, 800);
            }
          });

          // Unregister any leftover service workers and clear cache storage
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var r of registrations) { r.unregister(); }
            });
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (var name of names) { caches.delete(name); }
              });
            }
          }
        ` }} />
      </head>
      <body className="min-h-screen flex flex-col">
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
