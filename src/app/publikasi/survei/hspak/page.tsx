import { SurveyPageClient } from "@/components/publikasi/SurveyPageClient";

export const metadata = {
  title: "Hasil Survei Persepsi Anti Korupsi (HSPAK) | BMKG",
  description: "Daftar Hasil Survei Persepsi Anti Korupsi (HSPAK) per tahun.",
};

export default function Page() {
  return (
    <SurveyPageClient 
      title="Hasil Survei Persepsi Anti Korupsi (HSPAK)" 
      surveyType="hspak"
      description="Laporan hasil survei persepsi masyarakat terhadap upaya pencegahan dan pemberantasan korupsi di lingkungan BMKG guna mewujudkan Zona Integritas."
    />
  );
}
