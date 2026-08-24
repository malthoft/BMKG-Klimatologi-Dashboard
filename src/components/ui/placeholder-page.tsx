import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hammer } from "lucide-react";
import { AnimatedContainer } from "@/components/ui/animated-container";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center p-8 bg-surface min-h-[60vh]">
        <AnimatedContainer animation="scaleIn" className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hammer className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">{title}</h1>
          <p className="text-slate-500">
            Halaman ini masih dalam tahap pengembangan. Silakan kembali lagi nanti.
          </p>
        </AnimatedContainer>
      </main>
      <Footer />
    </>
  );
}
