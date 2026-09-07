import { SurveyPageClient } from "@/components/publikasi/SurveyPageClient";

export const metadata = {
  title: "Hasil Survei Kepuasan Masyarakat (HSKM) | BMKG",
  description: "Daftar Hasil Survei Kepuasan Masyarakat (HSKM) per tahun.",
};

export default function Page() {
  return (
    <SurveyPageClient 
      title="Hasil Survei Kepuasan Masyarakat (HSKM)" 
      surveyType="hskm"
      description="Laporan hasil evaluasi dan survei kepuasan masyarakat terhadap layanan BMKG sebagai wujud transparansi dan peningkatan kualitas pelayanan publik."
    />
  );
}
