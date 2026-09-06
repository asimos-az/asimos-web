import AppRoutePage from "../_home/AppRoutePage";

export const metadata = {
  title: "Şirkətlər",
  description: "Asimos-da aktiv vakansiya paylaşan şirkətləri və iş imkanlarını kəşf edin.",
  alternates: { canonical: "/sirketler" },
};

export default function Page() { return <AppRoutePage section="companies" />; }
