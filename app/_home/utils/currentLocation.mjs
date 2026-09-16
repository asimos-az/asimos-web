// Never reuse a cached position after the user has travelled.
export async function getCurrentLocation(geolocation) {
  if (!geolocation) throw new Error("Bu brauzerdə lokasiya xidməti dəstəklənmir.");
  const read = (enableHighAccuracy) => new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy, maximumAge: 0, timeout: 20000,
    });
  });
  try {
    return await read(true);
  } catch (error) {
    if (error.code === 1) throw error;
    // Desktop devices can obtain a network position even when high accuracy fails.
    return read(false);
  }
}

export function locationErrorMessage(error) {
  if (error.code === 1) return "Lokasiya icazəsi bloklanıb. Brauzerdə ünvan sətrinin yanındakı sayt ayarlarından Location / Məkan üçün Allow / İcazə ver seçin. Mac-da System Settings → Privacy & Security → Location Services bölməsində brauzer üçün icazəni də yoxlayın. Sonra yenidən cəhd edin.";
  if (error.code === 2) return "Cihaz cari mövqeyini müəyyən edə bilmir. Məkan xidmətini və Wi-Fi-ni aktivləşdirib yenidən cəhd edin.";
  if (error.code === 3) return "Lokasiyanın müəyyən edilməsi üçün vaxt bitdi. Məkan xidmətini və internet bağlantısını yoxlayıb yenidən cəhd edin.";
  return error.message || "Cari lokasiya alınmadı. Yenidən cəhd edin.";
}
