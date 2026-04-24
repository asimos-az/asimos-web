import HomePageClient from "./_home/HomePageClient";

export const metadata = {
  title: "Asimos | İş elanları və karyera platforması",
  description: "İş axtaranlar və işəgötürənlər üçün hazırlanmış Asimos platformasında vakansiyaları kəşf edin, elan yaradın və profilinizi idarə edin.",
  keywords: ["iş elanları", "vakansiya", "karyera", "iş axtaran", "işəgötürən", "Asimos"],
  openGraph: {
    title: "Asimos | İş elanları və karyera platforması",
    description: "Vakansiyaları kəşf edin, profil yaradın və karyera axınınızı Asimos ilə idarə edin.",
    type: "website",
    locale: "az_AZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asimos | İş elanları və karyera platforması",
    description: "Vakansiyaları kəşf edin, profil yaradın və karyera axınınızı Asimos ilə idarə edin.",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
