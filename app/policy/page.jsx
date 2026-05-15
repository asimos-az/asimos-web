import PolicyPageClient from './PolicyPageClient';

export const metadata = {
  title: 'Məxfilik siyasəti və xidmət şərtləri',
  description: 'Asimos platformasının məxfilik siyasəti, xidmət şərtləri, istifadəçi hüquqları və məlumat təhlükəsizliyi prinsipləri.',
  keywords: ['Asimos məxfilik siyasəti', 'xidmət şərtləri', 'istifadə qaydaları', 'məlumat təhlükəsizliyi'],
  alternates: {
    canonical: '/policy',
  },
  openGraph: {
    title: 'Asimos məxfilik siyasəti və xidmət şərtləri',
    description: 'Platformadan istifadə qaydaları, məxfilik prinsipləri və hüquqi müddəalar ilə tanış olun.',
    type: 'article',
    locale: 'az_AZ',
    url: '/policy',
  },
};

export default function PrivacyPolicyPage() {
  return <PolicyPageClient />;
}
