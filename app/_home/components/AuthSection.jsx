import { useEffect, useState } from "react";

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
  registerWhatsapp, setRegisterWhatsapp, otpResendAt, handleResendOtp, otpEmail,
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
  registerLogoPreview,
  setRegisterLogoPreview,
  onRegisterLogoFileChange,
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
  onBack,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (mode !== "verifyOtp") return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [mode, otpResendAt]);
  const remaining = Math.max(0, Math.ceil((otpResendAt - now) / 1000));
  return (
    <section className="container page-section auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-form-shell">
            <button type="button" className="auth-back-button" onClick={onBack} aria-label="Ana səhifəyə qayıt">
              <span aria-hidden="true">←</span>
            </button>
            <div className="auth-brand"><span>ASIMOS</span><p>İş həyatında növbəti addımınız.</p></div>
            <div className="auth-header">
              <button disabled={loading} type="button" className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
                Daxil ol
              </button>
              <button disabled={loading} type="button" className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
                Qeydiyyat
              </button>
            </div>
            {mode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <h3>Yenidən xoş gəlmisiniz</h3><p className="auth-description">Hesabınıza daxil olun, fürsətləri izləməyə davam edin.</p>
                <div className="input-group">
                  <label htmlFor="auth-email">E-poçt ünvanı</label>
                  <input id="auth-email" type="email" autoComplete="email" aria-label="E-poçt ünvanı" placeholder="E-poçt ünvanı" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <label className="auth-field-label" htmlFor="auth-password">Şifrə{mode === "register" ? " (ən azı 8 simvol)" : ""}</label>
                <div className="input-group input-group-password">
                  <input id="auth-password"
                    type={showPassword ? "text" : "password"}
                    aria-label="Şifrə" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} placeholder="Şifrə"
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
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Daxil olunur..." : "Daxil ol"}
                </button>
              </form>
            ) : null}

            {mode === "register" ? (
              <form className="auth-form" onSubmit={handleRegister}>
                <h3>Hesabınızı yaradın</h3><p className="auth-description">İş axtarın və ya komandanız üçün uyğun insanı tapın.</p>
                <div className="input-group">
                  <label htmlFor="register-name">Ad və soyad</label>
                  <input id="register-name" minLength={2} autoComplete="name" aria-label="Ad və soyad" placeholder="Ad və soyad" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </div>
                <div className="input-group">
                  <label htmlFor="auth-email">E-poçt ünvanı</label>
                  <input id="auth-email" type="email" autoComplete="email" aria-label="E-poçt ünvanı" placeholder="E-poçt ünvanı" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <label className="auth-field-label" htmlFor="auth-password">Şifrə{mode === "register" ? " (ən azı 8 simvol)" : ""}</label>
                <div className="input-group input-group-password">
                  <input id="auth-password"
                    type={showPassword ? "text" : "password"}
                    aria-label="Şifrə" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} placeholder="Şifrə"
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
                <label className="auth-field-label" htmlFor="auth-confirm-password">Şifrəni təkrar daxil edin</label>
                <div className="input-group input-group-password">
                  <input id="auth-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    aria-label="Şifrəni təsdiqləyin" autoComplete="new-password" minLength={8} placeholder="Şifrəni təsdiqləyin"
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
                  <label htmlFor="register-phone">Əlaqə nömrəsi <span>*</span></label>
                  <input id="register-phone" type="tel" autoComplete="tel" placeholder="+994 50 123 45 67" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </div>
                <div className="input-group">
                  <label htmlFor="register-whatsapp">WhatsApp nömrəsi <small>(istəyə bağlı)</small></label>
                  <input id="register-whatsapp" type="tel" placeholder="+994 50 123 45 67" value={registerWhatsapp} onChange={(event) => setRegisterWhatsapp(event.target.value)} />
                </div>
                <div className="input-group">
                  <label htmlFor="register-role">Hesab növü</label>
                  <select id="register-role" aria-label="Hesab növü" value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="seeker">İş axtaran</option>
                    <option value="employer">İşəgötürən</option>
                  </select>
                </div>
                {role === "employer" ? (
                  <>
                    <div className="input-group">
                      <input placeholder="Şirkət adı" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
                    </div>
                    <div className="input-group auth-logo-upload">
                      <div className="auth-logo-upload__row">
                        <label htmlFor="register-logo-upload" className="auth-logo-upload__button">Loqo seç</label>
                        <span>{registerLogoPreview ? "Loqo seçildi" : "Loqo əlavə etmək məcburi deyil"}</span>
                      </div>
                      <input
                        id="register-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={onRegisterLogoFileChange}
                      />
                      {registerLogoPreview ? (
                        <div className="auth-logo-upload__preview">
                          <img src={registerLogoPreview} alt="Şirkət loqosu" />
                          <button type="button" onClick={() => setRegisterLogoPreview("")}>Sil</button>
                        </div>
                      ) : null}
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
                <h3>E-poçtunuzu təsdiqləyin</h3><p className="auth-description"><strong>{otpEmail}</strong> ünvanına göndərilən kodu daxil edin. Məktub görünmürsə, spam qovluğunu yoxlayın.</p>
                <div className="input-group">
                  <label htmlFor="register-otp">Təsdiq kodu</label><input id="register-otp" className="auth-otp-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} placeholder="000000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Təsdiqlənir..." : "Təsdiqlə"}
                </button>
                <button type="button" className="btn-secondary" disabled={loading || remaining > 0} onClick={handleResendOtp}>{remaining > 0 ? `Yenidən göndər (${remaining} san.)` : "Kodu yenidən göndər"}</button>
                <button type="button" className="auth-link-button auth-edit-email" disabled={loading} onClick={() => setMode("register")}>E-poçt ünvanını dəyiş</button>
              </form>
            ) : null}

            {mode === "forgotPassword" ? (
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <h3>Şifrəni unutmusunuz?</h3>
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
      </div>
    </section>
  );
}
