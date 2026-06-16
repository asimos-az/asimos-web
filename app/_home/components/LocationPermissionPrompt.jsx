export default function LocationPermissionPrompt({ isOpen, user, locationLoading, onActivate, onDismiss }) {
  if (!isOpen) return null;

  return (
    <div className="location-permission-overlay" role="dialog" aria-modal="true" aria-labelledby="location-permission-title">
      <div className="location-permission-card">
        <div className="location-permission-icon" aria-hidden="true">📍</div>
        <h3 id="location-permission-title">Lokasiyaya icazə verin</h3>
        <p className="location-permission-copy">
          <strong>Sizə ən yaxın vakansiyaları</strong> göstərmək üçün yerinizi bilmək istəyirik.
          Məlumatınız yalnız axtarış nəticələrini fərdiləşdirmək üçün istifadə olunur.
        </p>
        <div className="location-permission-actions">
          <button type="button" className="btn-primary" onClick={onActivate} disabled={locationLoading}>
            {locationLoading ? "Paylaşılır..." : "Lokasiyamı paylaş"}
          </button>
          <button type="button" className="btn-secondary" onClick={onDismiss} disabled={locationLoading}>
            İndi yox, davam et
          </button>
        </div>
      </div>
    </div>
  );
}
