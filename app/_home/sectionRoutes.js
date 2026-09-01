export const SECTION_ROUTES = Object.freeze({
  home: "/",
  jobs: "/vakansiyalar",
  daily: "/gundelik-isler",
  about: "/haqqimizda",
  auth: "/daxil-ol",
  create: "/elan-yerlesdir",
  profile: "/profil",
  notifications: "/bildirisler",
  alerts: "/elan-bildirisleri",
  support: "/destek",
  terms: "/istifade-sertleri",
});

export const ROUTE_SECTIONS = Object.freeze(
  Object.fromEntries(Object.entries(SECTION_ROUTES).map(([section, route]) => [route, section]))
);

export function getSectionForPath(pathname, fallback = "home") {
  return ROUTE_SECTIONS[pathname] || fallback;
}

export function getRouteForSection(section) {
  return SECTION_ROUTES[section] || SECTION_ROUTES.home;
}
