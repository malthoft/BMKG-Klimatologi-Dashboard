"use client";

import { H1, H2, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Profile() {
  return (
    <>
      <Header activeRoute="/profile" />

      <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-[32px] py-[64px] grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center">
          <div className="space-y-[16px]">
            <AnimatedContainer animation="slideInLeft" once={false}>
              <H1 className="leading-[1.1] text-text-primary">
                Stasiun Klimatologi Jawa Timur
              </H1>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.1} once={false}>
              <Body className="text-text-secondary mt-[8px]">
                Sebagai Unit Pelaksana Teknis (UPT) di lingkungan Badan Meteorologi, Klimatologi, dan Geofisika, Stasiun Klimatologi Jawa Timur di Karangploso, Malang, memiliki peran krusial dalam melaksanakan pengamatan, pengelolaan data, pelayanan informasi, serta pemeliharaan alat-alat meteorologi dan klimatologi. Kami berdedikasi untuk menyediakan informasi cuaca dan iklim yang akurat dan terpercaya demi keselamatan dan kesejahteraan masyarakat.
              </Body>
            </AnimatedContainer>
            <AnimatedContainer animation="slideInLeft" delay={0.2} once={false}>
              <button className="inline-flex items-center gap-[8px] bg-primary text-background px-[24px] py-[12px] rounded-lg font-medium hover:bg-secondary transition-colors mt-[16px]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                Visi &amp; Misi
              </button>
            </AnimatedContainer>
          </div>
          
          <AnimatedContainer animation="scaleIn" delay={0.3} once={false} className="h-full">
            <div className="rounded-[12px] overflow-hidden shadow-sm border border-border h-full">
              <img 
                alt="Gedung BMKG" 
                className="w-full h-full object-cover aspect-video md:aspect-[4/3] transition-transform duration-700 hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmNNqICqvZN5EMHssitI9CsLYan9BTnAYCHnRx5BNcD165-05kyJ_jbal5NA2zGghP3OVOeXuI7y0fptXdFEzV99vyPyAEdakbUELCw5bCrHGkXMGSu5U44xzuaJBD6J2oweEJLuPM137eOdNV9vY2ZYwz6YI3NTS0gbmsV--PwmrWqZeIMjoiNeRz8oPsE88fuXqVC9NLgtFepykLvU4vv9hpFIhHtmA85Et4Yn1rhoiHyofJRo3ozIzHAasOIf0C7DeY84GeOdE"
              />
            </div>
          </AnimatedContainer>
        </section>

        {/* Facilities Grid */}
        <section className="max-w-7xl mx-auto px-[32px] py-[64px]">
          <AnimatedContainer animation="fadeInDown" once={false}>
            <H2 className="mb-[32px] text-center md:text-left">Tim &amp; Fasilitas</H2>
          </AnimatedContainer>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] auto-rows-fr">
            {/* Card 1 (Large, spans 2 cols on md) */}
            <div className="md:col-span-2">
              <AnimatedContainer animation="fadeInUp" delay={0.1} once={false} className="h-full">
                <article className="rounded-[12px] overflow-hidden relative group min-h-[300px] h-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDRiEhbee-9BQaY2cwM4B0jdKiuDK0zqGKvY1s74Sq7Ygwb-kgruAjWdZZDw7VCwIvIKGc3Msz-Z8ifm1d6VNaFUAcMocKbvSCzshNe7puFPVHYui-fCY5CGpDo_WNw0_XNxCH40NAM1hhvNz1Y_DtKIk_gK26FvmWO-NwHk_0aK16zOO-RDXuySIoeVsYXrlKTuAjSwYxxHF243oj9YKZQ3Inxxg6xOu3D-7BHCVAm-tBoQH5DVnVL3CjeWWL_GAM6HJcvS_5PJ4')" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-[24px] w-full">
                    <H2 className="text-white mb-[8px]">Pusat Data Iklim</H2>
                    <p className="text-white/90 text-[1rem] leading-[1.6] line-clamp-2">
                      Infrastruktur komputasi canggih untuk mengolah dan menyimpan jutaan titik data observasi iklim dari seluruh wilayah Jawa Timur, memastikan ketersediaan informasi historis yang komprehensif.
                    </p>
                  </div>
                </article>
              </AnimatedContainer>
            </div>

            {/* Card 2 */}
            <AnimatedContainer animation="fadeInUp" delay={0.2} once={false} className="h-full">
              <Card className="h-full flex flex-col justify-center items-start gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="bg-primary/10 text-primary p-3 rounded-full inline-flex transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
                </div>
                <div>
                  <H2 className="text-text-primary">Tim Ahli</H2>
                  <p className="text-[1rem] text-text-secondary mt-[8px]">
                    Dukungan penuh dari forecaster, observer, dan teknisi berpengalaman yang berdedikasi menganalisis dinamika atmosfer secara realtime.
                  </p>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Card 3 */}
            <AnimatedContainer animation="fadeInUp" delay={0.3} once={false} className="h-full">
              <Card className="h-full flex flex-col justify-center items-start gap-[16px] hover:bg-surface-container-low transition-colors group cursor-default">
                <div className="bg-secondary/10 text-secondary p-3 rounded-full inline-flex transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
                </div>
                <div>
                  <H2 className="text-text-primary">Taman Alat</H2>
                  <p className="text-[1rem] text-text-secondary mt-[8px]">
                    Area observasi lapang yang dilengkapi instrumen meteorologi standar WMO untuk pengukuran suhu, kelembaban, angin, dan curah hujan harian.
                  </p>
                </div>
              </Card>
            </AnimatedContainer>

            {/* Card 4 (Spans 2 cols on md) */}
            <div className="md:col-span-2">
              <AnimatedContainer animation="fadeInUp" delay={0.4} once={false} className="h-full">
                <article className="rounded-[12px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border bg-surface flex flex-col md:flex-row group h-full">
                  <div className="md:w-1/2 min-h-[250px] relative overflow-hidden">
                    <img 
                      alt="Laboratorium Udara" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7H62xYLaENWXLbOgws82--iCMhsPh82eMn-yshyHd94MlWeFdw3JDj_Rz6g9LY53zvyEzjdbG0y7TcwN09b6MVmjkKpQZLV6CURnd17WBrY52VWtW7AYmpEur_JT8-P3PoTrBXgNg9aXuIjrC6y_bI69inYEDOuExC5NkkP2zo0ihGjL7bkJwu4nRy-v-tuo0EnZqVPeWSS_F9jT0DFRG572bTHFdzOuE9vRmrNC9ZQ_MCTnd717m2FAmBKYLUrd9Z3tiZYlSAUY"
                    />
                  </div>
                  <div className="p-[24px] md:w-1/2 flex flex-col justify-center">
                    <H2 className="text-text-primary">Laboratorium Kualitas Udara</H2>
                    <p className="text-[1rem] text-text-secondary mt-[16px]">
                      Fasilitas pengujian terakreditasi yang bertugas memantau komposisi kimiawi atmosfer, tingkat polusi, dan gas rumah kaca untuk mendukung kajian perubahan iklim dan peringatan dini kesehatan lingkungan.
                    </p>
                  </div>
                </article>
              </AnimatedContainer>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-surface-container-low py-[64px] border-t border-border">
          <div className="max-w-7xl mx-auto px-[32px] grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center">
            <div className="space-y-[24px]">
              <AnimatedContainer animation="slideInLeft" once={false}>
                <H1 className="leading-[1.1] text-text-primary">Hubungi Kami</H1>
                <Body className="text-text-secondary mt-[8px]">
                  Kami siap membantu menyediakan layanan informasi dan data iklim yang Anda butuhkan.
                </Body>
              </AnimatedContainer>
              
              <address className="not-italic space-y-[16px] text-text-primary">
                <AnimatedContainer animation="fadeInUp" delay={0.1} once={false}>
                  <div className="flex items-start gap-[16px] p-[16px] bg-surface rounded-lg shadow-sm border border-border group hover:border-primary transition-colors cursor-default">
                    <span className="material-symbols-outlined text-primary mt-1 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <div>
                      <strong className="block text-primary mb-[4px]">Alamat Kantor</strong>
                      Jl. Raya Ngijo Karangploso Km.4,<br/>
                      Kec. Karangploso, Kab. Malang,<br/>
                      Jawa Timur 65152
                    </div>
                  </div>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeInUp" delay={0.2} once={false}>
                  <div className="flex items-center gap-[16px] p-[16px] bg-surface rounded-lg shadow-sm border border-border group hover:border-primary transition-colors cursor-default">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>phone</span>
                    <div>
                      <strong className="block text-primary mb-[4px]">Telepon &amp; Fax</strong>
                      (0341) 462711 / 462714
                    </div>
                  </div>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeInUp" delay={0.3} once={false}>
                  <div className="flex items-center gap-[16px] p-[16px] bg-surface rounded-lg shadow-sm border border-border group hover:border-primary transition-colors cursor-default">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                    <div>
                      <strong className="block text-primary mb-[4px]">Email</strong>
                      staklim.malang@bmkg.go.id
                    </div>
                  </div>
                </AnimatedContainer>
              </address>
            </div>
            
            <AnimatedContainer animation="scaleIn" delay={0.4} once={false} className="h-full min-h-[300px] md:min-h-[400px]">
              <div className="w-full h-full rounded-[12px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border bg-border flex items-center justify-center relative">
                <img 
                  alt="Peta Lokasi BMKG Malang" 
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-1000 cursor-crosshair" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXZfrLp_GV82WTDo1FUx85rj__UkjCdgTf9TXxspD7VdllOrnMSYu_VIMWmqmOdMSLhfQeVgoJGiEUKv3hQfWxuFMwrgu4KudVAjrnu6VoHh1jY6SJV6gWTPiUmQ3_7w8TzFx1ySBeN2QbqWv2LQ5i8dy8P7Fxfsvus21VEhOlxoCloLtiFr4fleZUjYMagkvFy0ITBFMHt6sYc3nqDGNuPgmvkc1v3kRKOk_yuEGx-jSbk9HVS4NncbWmW5y-x6EBJ40vRZGmvyQ"
                />
              </div>
            </AnimatedContainer>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
