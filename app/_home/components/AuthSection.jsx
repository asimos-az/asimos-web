function PasswordVisibilityIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.584 10.587A2 2 0 0012 14a1.99 1.99 0 001.414-.586M9.88 4.24A9.77 9.77 0 0112 4c5.523 0 10 8 10 8a18.802 18.802 0 01-5.112 5.774M6.228 6.228C3.59 8.04 2 12 2 12s4.477 8 10 8a9.76 9.76 0 004.24-.94"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AuthSection({
  mode,
  setMode,
  loading,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  phone,
  setPhone,
  role,
  setRole,
  registerCategory,
  setRegisterCategory,
  categories,
  otp,
  setOtp,
  forgotEmail,
  setForgotEmail,
  resetCode,
  setResetCode,
  resetPassword,
  setResetPassword,
  showResetPassword,
  setShowResetPassword,
  handleLogin,
  handleRegister,
  handleVerifyOtp,
  handleForgotPassword,
  handleResetPassword,
}) {
  return (
    <section className="container page-section">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-form-shell">
            <div className="auth-header">
              <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
                Daxil ol
              </button>
              <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
                Qeydiyyat
              </button>
            </div>
            <div className="auth-intro">
              <span className="auth-eyebrow">Asimos hesabı</span>
              <h2>Karyeranızı daha ağıllı idarə edin</h2>
              <p>
                Bir neçə saniyəyə daxil olun, uyğun vakansiyaları kəşf edin və hesabınızı lokasiya ilə daha dəqiq fərdiləşdirin.
              </p>
            </div>

            {mode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <h3>Yenidən xoş gördük</h3>
                <p>Hesabınıza daxil olun və sizə uyğun elanları görün.</p>
                <div className="input-group">
                  <input type="email" placeholder="E-poçt ünvanı" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div className="input-group input-group-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrə"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    <PasswordVisibilityIcon visible={showPassword} />
                  </button>
                </div>
                <div className="auth-actions">
                  <button type="button" className="auth-link-button" onClick={() => setMode("forgotPassword")}>
                    Şifrənizi unutmusunuz?
                  </button>
                  <span className="auth-inline-note">Daxil olduqdan sonra lokasiya aktivləşdirməsi təklif ediləcək.</span>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Daxil olunur..." : "Daxil ol"}
                </button>
              </form>
            ) : null}

            {mode === "register" ? (
              <form className="auth-form" onSubmit={handleRegister}>
                <h3>Yeni hesab yaradın</h3>
                <p>Bir profil yaradın və elan dünyasına daha sürətli qoşulun.</p>
                <div className="input-group">
                  <input placeholder="Ad və soyad" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </div>
                <div className="input-group">
                  <input type="email" placeholder="E-poçt ünvanı" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div className="input-group input-group-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrə"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    <PasswordVisibilityIcon visible={showPassword} />
                  </button>
                </div>
                <div className="input-group input-group-password">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Şifrəni təsdiqləyin"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? "Təsdiq şifrəsini gizlət" : "Təsdiq şifrəsini göstər"}
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  >
                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                  </button>
                </div>
                <div className="input-group">
                  <input placeholder="Telefon nömrəsi" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </div>
                <div className="input-group">
                  <select value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="seeker">İş axtaran</option>
                    <option value="employer">İşəgötürən</option>
                  </select>
                </div>
                {role === "employer" ? (
                  <>
                    <div className="input-group">
                      <input placeholder="Şirkət adı" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
                    </div>
                    <div className="input-group">
                      <select value={registerCategory} onChange={(event) => setRegisterCategory(event.target.value)}>
                        <option value="">Kateqoriya seçin</option>
                        {categories.map((categoryName) => (
                          <option key={categoryName} value={categoryName}>
                            {categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Qeydiyyat aparılır..." : "Qeydiyyatdan keçin"}
                </button>
              </form>
            ) : null}

            {mode === "verifyOtp" ? (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <h3>OTP təsdiqi</h3>
                <p>E-poçt ünvanınıza göndərilən kodu daxil edin.</p>
                <div className="input-group">
                  <input placeholder="OTP kodu" value={otp} onChange={(event) => setOtp(event.target.value)} required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Təsdiqlənir..." : "Təsdiqlə"}
                </button>
              </form>
            ) : null}

            {mode === "forgotPassword" ? (
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <h3>Şifrəni unutmusunuz?</h3>
                <p>Şifrənizi yeniləmək üçün e-poçt ünvanınızı daxil edin.</p>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="E-poçt ünvanı"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Göndərilir..." : "Kodu göndər"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setMode("login")}>
                  Geri qayıt
                </button>
              </form>
            ) : null}

            {mode === "resetPassword" ? (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <h3>Şifrəni yeniləyin</h3>
                <p>Bərpa kodunu və yeni şifrənizi daxil edin.</p>
                <div className="input-group">
                  <input placeholder="Bərpa kodu" value={resetCode} onChange={(event) => setResetCode(event.target.value)} required />
                </div>
                <div className="input-group input-group-password">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Yeni şifrə"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showResetPassword ? "Yeni şifrəni gizlət" : "Yeni şifrəni göstər"}
                    onClick={() => setShowResetPassword((currentValue) => !currentValue)}
                  >
                    <PasswordVisibilityIcon visible={showResetPassword} />
                  </button>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Yenilənir..." : "Şifrəni yenilə"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <div className="auth-branding">
          <div className="auth-branding-glow auth-branding-glow-top" />
          <div className="auth-branding-glow auth-branding-glow-bottom" />
          <div className="auth-branding-content">
            <span className="auth-brand-chip">Ağıllı iş axını</span>
            <h2>asimos</h2>
            <p>Karyeranızda növbəti addımı daha sürətli, daha dəqiq və daha peşəkar formada atın.</p>
            <div className="auth-brand-points">
              <div className="auth-brand-point">
                <strong>Sürətli giriş</strong>
                <span>Bir neçə saniyədə hesabınıza daxil olun və elanlara baxın.</span>
              </div>
              <div className="auth-brand-point">
                <strong>Lokasiya əsaslı uyğunluq</strong>
                <span>Yaxınlıqdakı vakansiyalar və bildirişlər sizə daha düzgün təqdim olunur.</span>
              </div>
              <div className="auth-brand-point">
                <strong>Təmiz idarə paneli</strong>
                <span>Profil, bildiriş və elan axınını bir yerdən idarə edin.</span>
              </div>
            </div>
            <div className="auth-brand-stats">
              <div>
                <strong>24/7</strong>
                <span>Aktiv platforma</span>
              </div>
              <div>
                <strong>1 profil</strong>
                <span>Bütün iş axını</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
