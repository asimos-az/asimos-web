export const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

const publicNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Vakansiyalar" },
  { key: "companies", label: "Şirkətlər" },
  { key: "career", label: "Karyera məsləhətləri" },
  { key: "about", label: "Haqqımızda" },
];

export const guestNav = publicNav;
export const seekerNav = publicNav;
export const employerNav = publicNav;

export const employerSupportCategories = ["Elan yükləyə bilmirəm", "Namizədlərlə əlaqə problemi", "Ödəniş problemi", "Hesab ilə bağlı problem", "Təklif və İradlar", "Digər"];
export const seekerSupportCategories = ["İşə müraciət edə bilmirəm", "Profilimi tamamlaya bilmirəm", "Hesab ilə bağlı problem", "Təklif və İradlar", "Digər"];

export const cityOptions = ["Bakı", "Sumqayıt", "Gəncə", "Mingəçevir", "Şəki", "Lənkəran", "Şirvan", "Naxçıvan", "Quba", "Xaçmaz", "Masallı", "Salyan"];
export const cityCoordinates = {
  "Bakı": { lat: 40.4093, lng: 49.8671 }, "Sumqayıt": { lat: 40.5897, lng: 49.6686 }, "Gəncə": { lat: 40.6828, lng: 46.3606 },
  "Mingəçevir": { lat: 40.7703, lng: 47.0496 }, "Şəki": { lat: 41.1919, lng: 47.1706 }, "Lənkəran": { lat: 38.7543, lng: 48.8506 },
  "Şirvan": { lat: 39.9316, lng: 48.9202 }, "Naxçıvan": { lat: 39.2089, lng: 45.4122 }, "Quba": { lat: 41.3611, lng: 48.5134 },
  "Xaçmaz": { lat: 41.4643, lng: 48.8057 }, "Masallı": { lat: 39.0341, lng: 48.6654 }, "Salyan": { lat: 39.5962, lng: 48.9848 },
};

export const vacancyTypeOptions = [
  { label: "Növbə əsasında", value: "shift" },
  { label: "Tam ştat", value: "full_time" },
  { label: "Daimi", value: "permanent" },
  { label: "Frilans", value: "freelance" },
  { label: "Komisyon haqqı", value: "commission" },
  { label: "Könüllü", value: "volunteer" },
  { label: "Mövsümi", value: "seasonal" },
  { label: "Müvəqqəti", value: "temporary" },
  { label: "Təcrübə", value: "internship" },
  { label: "Təqaüd proqramı", value: "scholarship" },
  { label: "Yarım ştat", value: "part_time" },
];

export const jobLevelOptions = [
  { label: "Təcrübəsiz", value: "entry" }, { label: "Junior", value: "junior" },
  { label: "Middle", value: "middle" }, { label: "Senior", value: "senior" },
  { label: "Menecer", value: "manager" }, { label: "Rəhbər", value: "lead" },
];

export const salaryRangeOptions = [
  { label: "0 - 500 AZN", min: "0", max: "500" },
  { label: "500 - 1000 AZN", min: "500", max: "1000" },
  { label: "1000 - 1500 AZN", min: "1000", max: "1500" },
  { label: "1500 - 2500 AZN", min: "1500", max: "2500" },
  { label: "2500+ AZN", min: "2500", max: "" },
];
