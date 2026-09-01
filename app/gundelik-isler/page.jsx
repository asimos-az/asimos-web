import AppRoutePage from "../_home/AppRoutePage";

export const metadata = { title: "Gündəlik işlər", description: "Gündəlik və müvəqqəti iş elanlarını kəşf edin.", alternates: { canonical: "/gundelik-isler" } };
export default function Page() { return <AppRoutePage section="daily" />; }
