"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const SUPPORTED_LOCALES = ["az", "ru", "en"];

const messages = {
  az: {
    nav_jobs: "Vakansiyalar", nav_companies: "Şirkətlər", nav_career: "Karyera məsləhətləri", nav_about: "Haqqımızda",
    login: "Daxil ol", profile: "Profil", post_job: "Elan yerləşdir", favorites: "Seçimlər", open_menu: "Menyunu aç", close_menu: "Menyunu bağla",
    home: "Ana səhifə", company_profile: "Şirkət profili", verified_company: "Təsdiqlənmiş şirkət", active_vacancy: "aktiv vakansiya",
    opportunities: "İş imkanları", company_vacancies: "{company} vakansiyaları", company_jobs_help: "Şirkətə məxsus aktiv elanları axtarın və filtrləyin.",
    result: "{count} nəticə", search_job: "Vəzifə və ya açar söz", category: "Kateqoriya", all_categories: "Bütün kateqoriyalar",
    work_format: "İş formatı", all_formats: "Bütün formatlar", sort: "Sıralama", newest: "Ən yeni", oldest: "Ən köhnə",
    reset_filters: "Filtrləri sıfırla", permanent: "Daimi", temporary: "Müvəqqəti", daily: "Gündəlik", remote: "Uzaqdan",
    no_jobs: "Uyğun aktiv vakansiya tapılmadı", no_jobs_help: "Filtrləri dəyişin və ya daha sonra yenidən yoxlayın.",
    loading_company: "Şirkət profili yüklənir...", company_not_found: "Şirkət tapılmadı", back_companies: "Şirkətlərə qayıt",
    agreed_salary: "Razılaşma əsasında", job: "Elan", new: "Yeni", premium: "Premium", daily_job: "Gündəlik iş",
    companies_badge: "Şirkətlər", discover_company: "Doğru şirkəti kəşf et", companies_intro: "Azərbaycanda aktiv vakansiya paylaşan şirkətləri araşdırın və sizə uyğun iş imkanlarını görün.",
    search_company: "Şirkət adı və ya sahə üzrə axtar", view_jobs: "Vakansiyalara bax", real_employers: "Real işəgötürənlər", platform_companies: "Platformadakı şirkətlər",
    companies_count: "{count} şirkət", verified: "Təsdiqlənib", active_jobs_count: "{count} aktiv vakansiya", companies_loading: "Şirkətlər yüklənir", companies_load_error: "Şirkətləri yükləmək mümkün olmadı",
    no_company: "Şirkət tapılmadı", change_search: "Axtarış sözünü dəyişərək yenidən yoxlayın.", companies_appear: "İşəgötürənlər burada görünəcək.",
  },
  ru: {
    nav_jobs: "Вакансии", nav_companies: "Компании", nav_career: "Карьерные советы", nav_about: "О нас",
    login: "Войти", profile: "Профиль", post_job: "Разместить вакансию", favorites: "Избранное", open_menu: "Открыть меню", close_menu: "Закрыть меню",
    home: "Главная", company_profile: "Профиль компании", verified_company: "Проверенная компания", active_vacancy: "активных вакансий",
    opportunities: "Возможности работы", company_vacancies: "Вакансии {company}", company_jobs_help: "Ищите и фильтруйте активные вакансии этой компании.",
    result: "Результатов: {count}", search_job: "Должность или ключевое слово", category: "Категория", all_categories: "Все категории",
    work_format: "Формат работы", all_formats: "Все форматы", sort: "Сортировка", newest: "Сначала новые", oldest: "Сначала старые",
    reset_filters: "Сбросить фильтры", permanent: "Постоянная", temporary: "Временная", daily: "Поденная", remote: "Удалённая",
    no_jobs: "Подходящих активных вакансий нет", no_jobs_help: "Измените фильтры или проверьте позже.",
    loading_company: "Профиль компании загружается...", company_not_found: "Компания не найдена", back_companies: "Вернуться к компаниям",
    agreed_salary: "По договорённости", job: "Вакансия", new: "Новая", premium: "Премиум", daily_job: "Поденная работа",
    companies_badge: "Компании", discover_company: "Найдите подходящую компанию", companies_intro: "Изучайте компании с активными вакансиями в Азербайджане и находите подходящие возможности.",
    search_company: "Название компании или отрасль", view_jobs: "Смотреть вакансии", real_employers: "Реальные работодатели", platform_companies: "Компании на платформе",
    companies_count: "Компаний: {count}", verified: "Проверена", active_jobs_count: "Активных вакансий: {count}", companies_loading: "Компании загружаются", companies_load_error: "Не удалось загрузить компании",
    no_company: "Компания не найдена", change_search: "Измените поисковый запрос и попробуйте снова.", companies_appear: "Работодатели появятся здесь.",
  },
  en: {
    nav_jobs: "Jobs", nav_companies: "Companies", nav_career: "Career advice", nav_about: "About us",
    login: "Sign in", profile: "Profile", post_job: "Post a job", favorites: "Saved", open_menu: "Open menu", close_menu: "Close menu",
    home: "Home", company_profile: "Company profile", verified_company: "Verified company", active_vacancy: "active jobs",
    opportunities: "Job opportunities", company_vacancies: "Jobs at {company}", company_jobs_help: "Search and filter this company’s active vacancies.",
    result: "{count} results", search_job: "Job title or keyword", category: "Category", all_categories: "All categories",
    work_format: "Work format", all_formats: "All formats", sort: "Sort", newest: "Newest", oldest: "Oldest",
    reset_filters: "Reset filters", permanent: "Permanent", temporary: "Temporary", daily: "Daily", remote: "Remote",
    no_jobs: "No matching active jobs", no_jobs_help: "Change the filters or check again later.",
    loading_company: "Loading company profile...", company_not_found: "Company not found", back_companies: "Back to companies",
    agreed_salary: "By agreement", job: "Job", new: "New", premium: "Premium", daily_job: "Daily job",
    companies_badge: "Companies", discover_company: "Discover the right company", companies_intro: "Explore companies with active vacancies in Azerbaijan and find opportunities that fit you.",
    search_company: "Company name or industry", view_jobs: "View jobs", real_employers: "Real employers", platform_companies: "Companies on the platform",
    companies_count: "{count} companies", verified: "Verified", active_jobs_count: "{count} active jobs", companies_loading: "Loading companies", companies_load_error: "Could not load companies",
    no_company: "Company not found", change_search: "Change the search term and try again.", companies_appear: "Employers will appear here.",
  },
};

const systemValues = {
  ru: {
    "Digər": "Другое", "Müxtəlif sahələr": "Разные отрасли", "Satış": "Продажи", "Müştəri xidməti": "Обслуживание клиентов",
    "Satış və Müştəri Xidmətləri": "Продажи и обслуживание клиентов", "İT və Proqramlaşdırma": "ИТ и программирование",
    "Maliyyə": "Финансы", "Marketinq": "Маркетинг", "Logistika": "Логистика", "Təchizat / Loqistika": "Снабжение / Логистика",
    "İnzibati İdarəetmə": "Административное управление", "Aktiv": "Активная", "Gözləyir": "Ожидает", "Bağlı": "Закрыта",
    "Rədd edilmiş": "Отклонена", "Tam ştat": "Полная занятость", "Yarım ştat": "Частичная занятость", "Növbə əsasında": "Посменная работа",
    "Daimi": "Постоянная", "Müvəqqəti": "Временная", "Gündəlik iş": "Поденная работа", "Razılaşma əsasında": "По договорённости", "Elan": "Вакансия",
  },
  en: {
    "Digər": "Other", "Müxtəlif sahələr": "Various industries", "Satış": "Sales", "Müştəri xidməti": "Customer service",
    "Satış və Müştəri Xidmətləri": "Sales and Customer Service", "İT və Proqramlaşdırma": "IT and Programming",
    "Maliyyə": "Finance", "Marketinq": "Marketing", "Logistika": "Logistics", "Təchizat / Loqistika": "Supply / Logistics",
    "İnzibati İdarəetmə": "Administration", "Aktiv": "Active", "Gözləyir": "Pending", "Bağlı": "Closed",
    "Rədd edilmiş": "Rejected", "Tam ştat": "Full-time", "Yarım ştat": "Part-time", "Növbə əsasında": "Shift work",
    "Daimi": "Permanent", "Müvəqqəti": "Temporary", "Gündəlik iş": "Daily job", "Razılaşma əsasında": "By agreement", "Elan": "Job",
  },
};

const I18nContext = createContext(null);

const legacyText = {
  "Ana səhifə": ["Главная", "Home"], "Vakansiyalar": ["Вакансии", "Jobs"], "Şirkətlər": ["Компании", "Companies"],
  "Karyera məsləhətləri": ["Карьерные советы", "Career advice"], "Haqqımızda": ["О нас", "About us"], "Daxil ol": ["Войти", "Sign in"],
  "Elan yerləşdir": ["Разместить вакансию", "Post a job"], "Elan yarat": ["Создать вакансию", "Create job"], "Profil": ["Профиль", "Profile"],
  "Çıxış": ["Выйти", "Sign out"], "Seçimlər": ["Избранное", "Saved"], "İş bildirişləri": ["Уведомления о вакансиях", "Job notifications"],
  "Əlaqə": ["Контакты", "Contact"], "Dəstək": ["Поддержка", "Support"], "Menyu": ["Меню", "Menu"],
  "Yaxınlığındakı işi tap": ["Найдите работу рядом", "Find a job near you"],
  "Lokasiyanı paylaş, sənə ən yaxın vakansiyaları məsafəyə görə kəşf et.": ["Поделитесь местоположением и находите ближайшие вакансии по расстоянию.", "Share your location and discover the nearest jobs by distance."],
  "Lokasiya alınır...": ["Определяем местоположение...", "Getting location..."], "Yaxınlıqdakı işləri göstər": ["Показать вакансии рядом", "Show nearby jobs"],
  "Şəhəri özüm seçim": ["Выбрать город самостоятельно", "Choose city myself"], "Dəqiq ünvanınız işəgötürənlərlə paylaşılmır.": ["Ваш точный адрес не передаётся работодателям.", "Your exact address is not shared with employers."],
  "Vakansiya axtar": ["Поиск вакансий", "Search jobs"], "Vəzifə, şirkət və ya açar söz": ["Должность, компания или ключевое слово", "Job title, company or keyword"],
  "Şəhər, rayon və ya metro": ["Город, район или метро", "City, district or metro"], "Kateqoriya seç": ["Выберите категорию", "Select category"],
  "Axtar": ["Найти", "Search"], "Axtarılır": ["Поиск...", "Searching..."], "Populyar kateqoriyalar": ["Популярные категории", "Popular categories"],
  "Hamısı": ["Все", "All"], "Hamısına bax": ["Смотреть все", "View all"], "Elanlara bax": ["Смотреть вакансии", "View jobs"],
  "Xəritədə göstər": ["Показать на карте", "Show on map"], "Cari lokasiyanız": ["Ваше местоположение", "Your current location"], "Radius": ["Радиус", "Radius"],
  "Sizə ən yaxın vakansiyalar": ["Ближайшие к вам вакансии", "Jobs nearest to you"], "Vakansiyalar yüklənir": ["Вакансии загружаются", "Loading jobs"],
  "Yeni elanlar bir azdan burada görünəcək.": ["Новые вакансии скоро появятся здесь.", "New jobs will appear here shortly."],
  "Bu gün əlavə olunanlar": ["Добавленные сегодня", "Added today"], "Bu gün yeni vakansiya yerləşdirilməyib.": ["Сегодня новых вакансий нет.", "No new jobs were posted today."],
  "Təcrübə tələb etməyən işlər": ["Работа без опыта", "Jobs with no experience required"], "Hazırda təcrübəsiz namizədlər üçün elan yoxdur.": ["Сейчас нет вакансий для кандидатов без опыта.", "There are currently no jobs for candidates without experience."],
  "Hələ uyğun elan yoxdur": ["Подходящих вакансий пока нет", "No matching jobs yet"], "Bütün vakansiyalara bax": ["Смотреть все вакансии", "View all jobs"],
  "Part-time və növbəli işlər": ["Частичная и посменная работа", "Part-time and shift jobs"], "Uzaqdan işlər": ["Удалённая работа", "Remote jobs"],
  "Metroya yaxın işlər": ["Работа рядом с метро", "Jobs near metro"], "Stansiyaya görə sürətli seçim": ["Быстрый выбор по станции", "Quick selection by station"],
  "Asimos necə işləyir?": ["Как работает Asimos?", "How does Asimos work?"], "Lokasiyanı seç": ["Выберите местоположение", "Choose a location"],
  "Radiusu müəyyən et": ["Укажите радиус", "Set the radius"], "Yaxın vakansiyaları gör": ["Смотрите вакансии рядом", "See nearby jobs"], "1 kliklə müraciət et": ["Откликнуться в один клик", "Apply in one click"],
  "Təhlükəsiz iş axtarışı": ["Безопасный поиск работы", "Safe job search"], "Təsdiqlənmiş şirkətlər": ["Проверенные компании", "Verified companies"],
  "Məlumatların gizliliyi": ["Конфиденциальность данных", "Data privacy"], "Şübhəli elanı şikayət et": ["Пожаловаться на подозрительную вакансию", "Report a suspicious job"],
  "Dəstək mərkəzi": ["Центр поддержки", "Support center"], "İş üçün ödəniş tələb edən elanları bizə bildirin.": ["Сообщайте нам о вакансиях, требующих оплату.", "Report jobs that request payment."],
  "Doğru namizədlərə daha yaxın olun": ["Станьте ближе к подходящим кандидатам", "Get closer to the right candidates"], "Vakansiyanı dərc et": ["Опубликовать вакансию", "Publish a job"],
  "Şirkət profili yarat": ["Создать профиль компании", "Create company profile"], "aktiv vakansiya": ["активных вакансий", "active jobs"], "təsdiqlənmiş şirkət": ["проверенных компаний", "verified companies"],
  "şəhər və rayon": ["городов и районов", "cities and districts"], "uğurlu müraciət": ["успешных откликов", "successful applications"],
  "Platforma": ["Платформа", "Platform"], "Şirkət": ["Компания", "Company"], "Qaydalar": ["Правила", "Rules"], "Yardım mərkəzi": ["Центр помощи", "Help center"],
  "Təhlükəsizlik": ["Безопасность", "Security"], "Şikayət et": ["Пожаловаться", "Report"], "İstifadə şərtləri": ["Условия использования", "Terms of use"],
  "Yeniliklərdən xəbərdar olun": ["Будьте в курсе новостей", "Stay up to date"], "Email ünvanınız": ["Ваш email", "Your email"], "Abunə ol": ["Подписаться", "Subscribe"],
  "Bütün hüquqlar qorunur.": ["Все права защищены.", "All rights reserved."], "Razılaşma əsasında": ["По договорённости", "By agreement"],
};

const originalNodes = new WeakMap();
const originalAttributes = new WeakMap();

function legacyTranslate(value, locale) {
  if (locale === "az" || !value) return value;
  const index = locale === "ru" ? 0 : 1;
  const exact = legacyText[value];
  if (exact) return exact[index];
  const vacancyCount = value.match(/^(\d+) vakansiya$/);
  if (vacancyCount) return locale === "ru" ? `${vacancyCount[1]} вакансий` : `${vacancyCount[1]} jobs`;
  const resultCount = value.match(/^(\d+) nəticə$/);
  if (resultCount) return locale === "ru" ? `Результатов: ${resultCount[1]}` : `${resultCount[1]} results`;
  const remaining = value.match(/^(\d+) gün qaldı$/);
  if (remaining) return locale === "ru" ? `Осталось ${remaining[1]} дн.` : `${remaining[1]} days left`;
  return value;
}

function translateDom(root, locale) {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,textarea,[contenteditable=true],[data-no-translate]")) return;
    if (!originalNodes.has(node)) originalNodes.set(node, node.nodeValue || "");
    const original = originalNodes.get(node);
    const trimmed = original.trim();
    if (!trimmed) return;
    const translated = legacyTranslate(trimmed, locale);
    const next = original.replace(trimmed, translated);
    if (node.nodeValue !== next) node.nodeValue = next;
  });
  root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach((element) => {
    if (!originalAttributes.has(element)) originalAttributes.set(element, {});
    const originals = originalAttributes.get(element);
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
      const next = legacyTranslate(originals[attribute], locale);
      if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
    });
  });
}

export function getStoredLocale() {
  if (typeof window === "undefined") return "az";
  const saved = window.localStorage.getItem("asimos_locale");
  if (SUPPORTED_LOCALES.includes(saved)) return saved;
  const browserLocale = String(window.navigator.language || "").slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.includes(browserLocale) ? browserLocale : "az";
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState("az");
  useEffect(() => setLocaleState(getStoredLocale()), []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    translateDom(document.body, locale);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => {
      if (mutation.type === "characterData") translateDom(mutation.target.parentElement || document.body, locale);
      mutation.addedNodes.forEach((node) => { if (node.nodeType === Node.ELEMENT_NODE) translateDom(node, locale); });
    }));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);
  const setLocale = useCallback((next) => {
    const safe = SUPPORTED_LOCALES.includes(next) ? next : "az";
    window.localStorage.setItem("asimos_locale", safe);
    setLocaleState(safe);
  }, []);
  const t = useCallback((key, params = {}) => {
    let value = messages[locale]?.[key] || messages.az[key] || key;
    Object.entries(params).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, String(replacement)); });
    return value;
  }, [locale]);
  const tv = useCallback((value) => systemValues[locale]?.[value] || value, [locale]);
  const context = useMemo(() => ({ locale, setLocale, t, tv }), [locale, setLocale, t, tv]);
  return <I18nContext.Provider value={context}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext) || { locale: "az", setLocale: (_next) => {}, t: (key) => messages.az[key] || key, tv: (value) => value };
}
