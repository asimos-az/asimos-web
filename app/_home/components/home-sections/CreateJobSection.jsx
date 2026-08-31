"use client";

import { useMemo, useState } from "react";
import { ArrowBackRounded, ArrowForwardRounded, BusinessCenterRounded, CheckCircleOutlineRounded, EmailOutlined, LocationOnOutlined, PaymentsOutlined, PhoneOutlined, SaveOutlined, ScheduleRounded, VerifiedRounded, VisibilityOutlined, WorkOutlineRounded } from "@mui/icons-material";
import pageStyles from "./CreateJobSection.module.css";

const steps = ["Əsas məlumatlar", "İş şərtləri", "Ünvan", "Əlaqə", "Önizləmə"];

export default function CreateJobSection({ ctx }) {
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const { activeSection, canCreateJob, user, loading, editingJobId, title, setTitle, companyObject, setCompanyObject, category, setCategory, homeCategoryOptions, jobLevel, setJobLevel, activeJobLevelOptions, description, setDescription, wageMode, setWageMode, setWage, wageMin, setWageMin, wageMax, setWageMax, jobType, setJobType, workType, setWorkType, scheduleStart, setScheduleStart, scheduleEnd, setScheduleEnd, vacancyStartDate, setVacancyStartDate, vacancyEndDate, setVacancyEndDate, contactVisibility, setContactVisibility, primaryContact, setPrimaryContact, contactPhone, whatsapp, contactEmail, link, setLink, locationText, lat, lng, LocationPicker, handleLocationActivation, locationLoading, publishMode, setPublishMode, publishAt, setPublishAt, handleCreateJob, resetJobForm, setActiveSection } = ctx;

  const qualityChecks = useMemo(() => [
    [Boolean(title.trim()), "Vəzifənin adı aydındır"],
    [Boolean(category), "Kateqoriya seçilib"],
    [description.trim().length >= 80, "Təsvir kifayət qədər ətraflıdır"],
    [furthestStep >= 1 && (wageMode !== "range" || Boolean(wageMin && wageMax)), "Maaş məlumatı tamamlanıb"],
    [furthestStep >= 1 && Boolean(jobType && workType), "İş şərtləri seçilib"],
    [furthestStep >= 2 && Boolean(locationText && lat && lng), "İş ünvanı müəyyən edilib"],
    [furthestStep >= 3 && Boolean((contactVisibility.phone && (contactPhone || user?.phone)) || (contactVisibility.whatsapp && (whatsapp || user?.phone)) || (contactVisibility.email && (contactEmail || user?.email)) || link), "Əlaqə üsulu hazırdır"],
  ], [title, category, description, furthestStep, wageMode, wageMin, wageMax, jobType, workType, locationText, lat, lng, contactVisibility, contactPhone, whatsapp, contactEmail, link, user]);
  const quality = Math.round((qualityChecks.filter(([done]) => done).length / qualityChecks.length) * 100);

  if (activeSection !== "create" || !canCreateJob) return null;

  const changeWageMode = (mode) => {
    setWageMode(mode);
    if (mode === "agreement") setWage("Razılaşma əsasında");
    if (mode === "skill") setWage("Bacarığa uyğun");
  };
  const updateWage = (kind, rawValue) => {
    const value = rawValue.replace(/[^0-9]/g, "");
    const min = kind === "min" ? value : wageMin;
    const max = kind === "max" ? value : wageMax;
    kind === "min" ? setWageMin(value) : setWageMax(value);
    setWage(min && max ? `${min} - ${max} AZN` : min ? `${min} AZN` : max ? `${max} AZN` : "");
  };
  const goToStep = (nextStep) => {
    setStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep));
  };
  const next = () => goToStep(Math.min(steps.length - 1, step + 1));
  const previous = () => setStep((current) => Math.max(0, current - 1));
  const wageLabel = wageMode === "range" ? (wageMin || wageMax ? `${wageMin || "0"}–${wageMax || wageMin} AZN` : "Maaş qeyd edilməyib") : wageMode === "skill" ? "Bacarığa uyğun" : "Razılaşma əsasında";
  const workTypeLabel = { full_time: "Tam ştat", part_time: "Yarım ştat", remote: "Uzaqdan", hybrid: "Hibrid" }[workType] || "İş rejimi";
  const handleWizardSubmit = (event) => {
    if (step < steps.length - 1) {
      event.preventDefault();
      next();
      return;
    }
    if (!confirmed) {
      event.preventDefault();
      return;
    }
    handleCreateJob(event);
  };

  return <main className={pageStyles.page}>
    <header className={pageStyles.workspaceHeader}><div className={pageStyles.brand}><BusinessCenterRounded /><strong>{editingJobId ? "Vakansiyanı redaktə et" : "Yeni vakansiya yarat"}</strong></div><div className={pageStyles.topActions}><button type="button" onClick={(event) => handleCreateJob(event, true)} disabled={loading}><SaveOutlined /> Qaralama saxla</button><button type="button" onClick={() => goToStep(4)}><VisibilityOutlined /> Önizlə</button></div></header>

    <nav className={pageStyles.stepper} aria-label="Vakansiya yaratma addımları">{steps.map((label, index) => <button type="button" key={label} className={index === step ? pageStyles.currentStep : index < furthestStep ? pageStyles.doneStep : ""} onClick={() => goToStep(index)}><span>{index < furthestStep ? "✓" : index + 1}</span><small>{label}</small></button>)}</nav>

    <div className={pageStyles.layout}><form className={pageStyles.formCard} onSubmit={handleWizardSubmit}>
      <h1>{editingJobId ? "Vakansiya məlumatlarını yenilə" : "Yeni vakansiya yarat"}</h1>

      {step === 0 ? <div className={pageStyles.formGrid}>
        <Field label="Şirkət"><div className={pageStyles.companyField}><BusinessCenterRounded /><span>{user?.companyName || user?.company_name || companyObject || "Şirkət profili"}</span><small>Təsdiqlənmiş şirkət</small></div></Field>
        <Field label="Vəzifənin adı" required><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Məs: Müştəri xidməti üzrə mütəxəssis" required /></Field>
        <Field label="Filial / iş yeri"><input value={companyObject} onChange={(event) => setCompanyObject(event.target.value)} placeholder="Məs: Mərkəzi ofis" /></Field>
        <Field label="Kateqoriya" required><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Kateqoriya seçin</option>{homeCategoryOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Vəzifə dərəcəsi"><select value={jobLevel} onChange={(event) => setJobLevel(event.target.value)}><option value="">Dərəcə seçin</option>{activeJobLevelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="Vəzifə haqqında qısa məlumat" required wide><div className={pageStyles.editor}><div className={pageStyles.toolbar}><b>B</b><i>I</i><u>U</u><span>☷</span><span>↗</span></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={8} placeholder="Əsas məsuliyyətlər, tələblər və iş mühiti haqqında aydın məlumat yazın." required /><small>{description.length}/3000</small></div></Field>
      </div> : null}

      {step === 1 ? <div className={pageStyles.formGrid}>
        <Field label="Maaş forması" required wide><div className={pageStyles.choiceRow}>{[["agreement","Razılaşma"],["skill","Bacarığa əsasən"],["range","Maaş aralığı"]].map(([value,label]) => <button type="button" key={value} className={wageMode === value ? pageStyles.selectedChoice : ""} onClick={() => changeWageMode(value)}>{label}</button>)}</div></Field>
        {wageMode === "range" ? <><Field label="Minimum maaş"><input value={wageMin} inputMode="numeric" onChange={(event) => updateWage("min", event.target.value)} placeholder="800 AZN" /></Field><Field label="Maksimum maaş"><input value={wageMax} inputMode="numeric" onChange={(event) => updateWage("max", event.target.value)} placeholder="1200 AZN" /></Field></> : null}
        <Field label="Vakansiyanın növü" required><select value={jobType} onChange={(event) => setJobType(event.target.value)}><option value="permanent">Daimi iş</option><option value="temporary">Günəmuzd / müvəqqəti</option></select></Field>
        <Field label="İş rejimi"><select value={workType} onChange={(event) => setWorkType(event.target.value)}><option value="full_time">Tam ştat</option><option value="part_time">Yarım ştat</option><option value="remote">Uzaqdan</option><option value="hybrid">Hibrid</option></select></Field>
        <Field label="İşin başlama saatı"><input type="time" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} /></Field><Field label="İşin bitmə saatı"><input type="time" value={scheduleEnd} onChange={(event) => setScheduleEnd(event.target.value)} /></Field>
        {jobType === "temporary" ? <><Field label="Başlama tarixi"><input type="date" value={vacancyStartDate} onChange={(event) => setVacancyStartDate(event.target.value)} /></Field><Field label="Son tarix" required><input type="date" value={vacancyEndDate} onChange={(event) => setVacancyEndDate(event.target.value)} required /></Field></> : null}
      </div> : null}

      {step === 2 ? <div className={pageStyles.locationStep}><div><h2>İş ünvanını seçin</h2><p>Marker-i iş yerinin dəqiq mövqeyinə yerləşdirin.</p></div><button type="button" onClick={handleLocationActivation} disabled={locationLoading}><LocationOnOutlined />{locationLoading ? "Lokasiya müəyyən edilir..." : "Mövcud lokasiyamı seç"}</button><div className={pageStyles.locationSummary}><LocationOnOutlined /><span>{locationText || "Ünvan hələ seçilməyib"}</span></div><div className={pageStyles.map}><LocationPicker lat={lat} lng={lng} address={locationText} onChange={({ lat: nextLat, lng: nextLng, address }) => { ctx.setLat(nextLat); ctx.setLng(nextLng); ctx.setLocationText(address); }} /></div></div> : null}

      {step === 3 ? <div className={pageStyles.contactStep}><h2>Namizədlər necə müraciət etsin?</h2>{[["phone",PhoneOutlined,"Telefon",contactPhone || user?.phone],["whatsapp",PhoneOutlined,"WhatsApp",whatsapp || user?.phone],["email",EmailOutlined,"E-poçt",contactEmail || user?.email]].map(([key,Icon,label,value]) => <div className={pageStyles.contactRow} key={key}><button type="button" className={contactVisibility[key] ? pageStyles.toggleOn : pageStyles.toggle} onClick={() => setContactVisibility((current) => ({ ...current, [key]: !current[key] }))}><span /></button><Icon /><div><strong>{label}</strong><small>{value || "Qeyd edilməyib"}</small></div><button type="button" className={primaryContact === key ? pageStyles.primaryContact : ""} onClick={() => setPrimaryContact(key)}>{primaryContact === key ? "Əsas əlaqə" : "Əsas et"}</button></div>)}<Field label="Xarici ATS / müraciət linki"><input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://sirket.az/apply" /></Field></div> : null}

      {step === 4 ? <div className={pageStyles.previewStep}><div className={pageStyles.previewJob}><div className={pageStyles.previewCompany}><BusinessCenterRounded /><span>{user?.companyName || user?.company_name || companyObject || "Şirkət"}</span><VerifiedRounded /></div><span className={pageStyles.previewSalary}>{wageLabel}</span><h2>{title || "Vakansiyanın adı"}</h2><div className={pageStyles.previewTags}><span>{category || "Kateqoriya"}</span><span>{jobLevel || "Dərəcə"}</span><span>{jobType === "temporary" ? "Müvəqqəti" : "Daimi"}</span></div><p>{description || "Vakansiya təsviri burada görünəcək."}</p><div className={pageStyles.previewMeta}><span><LocationOnOutlined />{locationText || "Ünvan seçilməyib"}</span><span><WorkOutlineRounded />{workTypeLabel}</span><span><ScheduleRounded />{scheduleStart && scheduleEnd ? `${scheduleStart}–${scheduleEnd}` : "Qrafik qeyd edilməyib"}</span></div></div><div className={pageStyles.publishBox}><h2>Yayım seçimi</h2><label className={pageStyles.publishOption}><span>Elanı indi göndər<small>Təsdiqdən sonra dərhal yayımlansın</small></span><input type="radio" name="publish-mode" checked={publishMode === "instant"} onChange={() => setPublishMode("instant")} /></label><label className={pageStyles.publishOption}><span>Yayımı planlaşdır<small>Tarix və saatı əvvəlcədən seçin</small></span><input type="radio" name="publish-mode" checked={publishMode === "scheduled"} onChange={() => setPublishMode("scheduled")} /></label>{publishMode === "scheduled" ? <input type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} /> : null}<p>Bu mərhələyə keçmək elan yaratmır. Yalnız aşağıdakı təsdiqdən sonra göndəriləcək.</p><label className={pageStyles.confirmation}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>Məlumatları yoxladım və elanı göndərməyi təsdiq edirəm.</span></label></div></div> : null}

      <footer className={pageStyles.formFooter}><button type="button" className={pageStyles.cancel} onClick={step ? previous : () => setActiveSection("profile")}><ArrowBackRounded />{step ? "Geri" : "Ləğv et"}</button><div>{!editingJobId ? <button type="button" className={pageStyles.draft} onClick={(event) => handleCreateJob(event, true)} disabled={loading}><SaveOutlined /> Qaralama saxla</button> : <button type="button" className={pageStyles.draft} onClick={resetJobForm}>Redaktəni ləğv et</button>}{step < 4 ? <button type="button" className={pageStyles.next} onClick={next}>Növbəti: {steps[step + 1]} <ArrowForwardRounded /></button> : <button type="submit" className={pageStyles.next} disabled={loading || !confirmed}>{loading ? "Göndərilir..." : editingJobId ? "Dəyişiklikləri saxla" : "Elanı adminə göndər"}<ArrowForwardRounded /></button>}</div></footer>
    </form>

    <aside className={pageStyles.sidebar}><section><h2>Elan keyfiyyəti</h2><div className={pageStyles.quality}><div style={{ "--progress": `${quality * 3.6}deg` }}><span>{quality}%</span></div><p><strong>{quality >= 80 ? "Əla görünür!" : quality >= 40 ? "Yaxşı başlanğıcdır!" : "Məlumatları tamamlayın"}</strong><span>Faiz yalnız daxil etdiyiniz və yoxladığınız məlumatlara əsaslanır.</span></p></div><ul>{qualityChecks.map(([done,label]) => <li className={done ? pageStyles.checked : ""} key={label}><CheckCircleOutlineRounded />{label}</li>)}</ul></section><section><h2>Canlı önizləmə</h2><div className={pageStyles.miniPreview}><div className={pageStyles.miniCompany}><BusinessCenterRounded /><div><strong>{user?.companyName || user?.company_name || companyObject || "Şirkət"}</strong><small><VerifiedRounded /> Təsdiqlənmiş şirkət</small></div></div><h3>{title || "Vakansiyanın adı"}</h3><strong className={pageStyles.miniSalary}>{wageLabel}</strong><div className={pageStyles.miniTags}><span>{category || "Kateqoriya"}</span><span>{workTypeLabel}</span></div><p>{description.slice(0, 150) || "Qısa vakansiya məlumatı burada görünəcək."}</p><div className={pageStyles.miniMeta}><span><LocationOnOutlined />{locationText || "Ünvan seçilməyib"}</span><span><PaymentsOutlined />{wageLabel}</span></div></div></section></aside></div>
  </main>;
}

function Field({ label, required = false, wide = false, children }) {
  return <label className={wide ? pageStyles.wideField : pageStyles.field}><span>{label}{required ? <b> *</b> : null}</span>{children}</label>;
}
