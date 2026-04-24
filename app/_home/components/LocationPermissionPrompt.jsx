export default function LocationPermissionPrompt({ isOpen, user, locationLoading, onActivate, onDismiss }) {
  if (!isOpen || !user) return null;

  return (
    <div className="location-permission-overlay" role="dialog" aria-modal="true" aria-labelledby="location-permission-title">
      <div className="location-permission-card">
        <span className="location-permission-badge">Yeni addım</span>
        <h3 id="location-permission-title">Lokasiyanızı aktivləşdirin</h3>
        <p>
          Yaxınlıqdakı elanları, sizə uyğun məsafədə bildirişləri və xəritədə düzgün nəticələri görmək üçün
          lokasiya icazəsini aktiv edin.
        </p>
        <div className="location-permission-list">
          <div>
            <strong>Daha uyğun elanlar</strong>
            <span>Ətrafınızdakı vakansiyalar önə çıxarılacaq.</span>
          </div>
          <div>
            <strong>Dəqiq xəritə görünüşü</strong>
            <span>Elanların ünvanını və məsafəsini daha rahat görəcəksiniz.</span>
          </div>
        </div>
        <div className="location-permission-actions">
          <button type="button" className="btn-primary" onClick={onActivate} disabled={locationLoading}>
            {locationLoading ? "Aktivləşdirilir..." : "Lokasiyanı aktivləşdir"}
          </button>
          <button type="button" className="btn-secondary" onClick={onDismiss} disabled={locationLoading}>
            İndi yox
          </button>
        </div>
      </div>
    </div>
  );
}
