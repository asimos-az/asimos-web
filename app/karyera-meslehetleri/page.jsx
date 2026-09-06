import AppRoutePage from "../_home/AppRoutePage";

export const metadata = {
  title: "Karyera məsləhətləri",
  description: "CV, müsahibə, iş axtarışı və peşəkar inkişaf üçün praktik karyera məsləhətləri.",
  alternates: { canonical: "/karyera-meslehetleri" },
};

export default function Page() { return <AppRoutePage section="career" />; }
