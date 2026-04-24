import PolicyPageClient from "./PolicyPageClient";

export const metadata = {
  title: "Məxfilik siyasəti və xidmət şərtləri",
  description: "Asimos platformasının məxfilik siyasəti, xidmət şərtləri və istifadəçi hüquqları haqqında tam məlumat.",
  alternates: {
    canonical: "/policy",
  },
  openGraph: {
    title: "Asimos məxfilik siyasəti və xidmət şərtləri",
    description: "Platformadan istifadə qaydaları, məxfilik prinsipləri və hüquqi müddəalar ilə tanış olun.",
    type: "article",
    locale: "az_AZ",
  },
};

export default function PrivacyPolicyPage() {
  return <PolicyPageClient />;
}