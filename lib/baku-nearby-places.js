// Baku Metro station coordinates are based on the station-exit coordinate
// dataset published by the Baku Metro on Azerbaijan's open data portal.
// University points represent campus locations (not institution mailing offices).
export const BAKU_NEARBY_PLACES = [
  { name: "Avtovağzal metrosu", type: "metro", lat: 40.421508, lng: 49.795215 },
  { name: "Azadlıq prospekti metrosu", type: "metro", lat: 40.425962, lng: 49.842926 },
  { name: "Dərnəgül metrosu", type: "metro", lat: 40.425402, lng: 49.861788 },
  { name: "Nəsimi metrosu", type: "metro", lat: 40.424645, lng: 49.826280 },
  { name: "Xocəsən metrosu", type: "metro", lat: 40.423082, lng: 49.779611 },
  { name: "Bakmil metrosu", type: "metro", lat: 40.414140, lng: 49.878796 },
  { name: "Gənclik metrosu", type: "metro", lat: 40.399879, lng: 49.850956 },
  { name: "Nəriman Nərimanov metrosu", type: "metro", lat: 40.402822, lng: 49.870638 },
  { name: "Ulduz metrosu", type: "metro", lat: 40.414963, lng: 49.891435 },
  { name: "28 May metrosu", type: "metro", lat: 40.379862, lng: 49.848636 },
  { name: "8 Noyabr metrosu", type: "metro", lat: 40.401867, lng: 49.820509 },
  { name: "Cəfər Cabbarlı metrosu", type: "metro", lat: 40.379652, lng: 49.848950 },
  { name: "Memar Əcəmi metrosu", type: "metro", lat: 40.410581, lng: 49.813195 },
  { name: "Koroğlu metrosu", type: "metro", lat: 40.420864, lng: 49.918094 },
  { name: "Neftçilər metrosu", type: "metro", lat: 40.411155, lng: 49.942568 },
  { name: "Qara Qarayev metrosu", type: "metro", lat: 40.417612, lng: 49.933959 },
  { name: "Xalqlar Dostluğu metrosu", type: "metro", lat: 40.396885, lng: 49.952986 },
  { name: "Əhmədli metrosu", type: "metro", lat: 40.385558, lng: 49.953945 },
  { name: "Həzi Aslanov metrosu", type: "metro", lat: 40.373038, lng: 49.953574 },
  { name: "İçərişəhər metrosu", type: "metro", lat: 40.365959, lng: 49.831647 },
  { name: "Sahil metrosu", type: "metro", lat: 40.371726, lng: 49.844572 },
  { name: "Şah İsmayıl Xətai metrosu", type: "metro", lat: 40.383251, lng: 49.872145 },
  { name: "20 Yanvar metrosu", type: "metro", lat: 40.404139, lng: 49.807702 },
  { name: "Elmlər Akademiyası metrosu", type: "metro", lat: 40.375152, lng: 49.815484 },
  { name: "İnşaatçılar metrosu", type: "metro", lat: 40.389094, lng: 49.802357 },
  { name: "Nizami metrosu", type: "metro", lat: 40.379319, lng: 49.830019 },
  { name: "Bakı Dövlət Universiteti", type: "university", lat: 40.373073, lng: 49.811615 },
  { name: "Azərbaycan Tibb Universiteti", type: "university", lat: 40.395740, lng: 49.832860 },
  { name: "UNEC · İstiqlaliyyət kampusu", type: "university", lat: 40.366200, lng: 49.832100 },
  { name: "UNEC · II tədris binası", type: "university", lat: 40.405163, lng: 49.860271 },
  { name: "Azərbaycan Dövlət Neft və Sənaye Universiteti", type: "university", lat: 40.378660, lng: 49.849110 },
  { name: "Azərbaycan Dillər Universiteti", type: "university", lat: 40.383590, lng: 49.842990 },
  { name: "Azərbaycan Texniki Universiteti", type: "university", lat: 40.370090, lng: 49.815430 },
  { name: "Azərbaycan Memarlıq və İnşaat Universiteti", type: "university", lat: 40.369780, lng: 49.812580 },
  { name: "Azərbaycan Dövlət Pedaqoji Universiteti", type: "university", lat: 40.372900, lng: 49.848300 },
  { name: "Bakı Slavyan Universiteti", type: "university", lat: 40.383720, lng: 49.843530 },
  { name: "ADA Universiteti", type: "university", lat: 40.396520, lng: 49.850050 },
  { name: "Bakı Musiqi Akademiyası", type: "university", lat: 40.377780, lng: 49.844440 },
  { name: "Azərbaycan Dövlət Bədən Tərbiyəsi və İdman Akademiyası", type: "university", lat: 40.400640, lng: 49.856660 },
  { name: "Bakı Mühəndislik Universiteti", type: "university", lat: 40.474300, lng: 49.727440 },
  { name: "Bakı Ali Neft Məktəbi", type: "university", lat: 40.382280, lng: 49.872100 },
];

export function distanceBetweenMeters(latA, lngA, latB, lngB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(latB - latA);
  const lngDelta = toRadians(lngB - lngA);
  const arc = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(lngDelta / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function getNearestBakuPlace(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);
  // Ignore missing, malformed, and non-Azerbaijan coordinates; coercing an
  // empty string to zero would otherwise create a false distance near Africa.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 38 || lat > 42 || lng < 44 || lng > 51.5) return null;

  let nearest = null;
  for (const place of BAKU_NEARBY_PLACES) {
    const distanceM = distanceBetweenMeters(lat, lng, place.lat, place.lng);
    if (!nearest || distanceM < nearest.distanceM) nearest = { ...place, distanceM };
  }
  return nearest;
}
