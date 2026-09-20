"use client";

import { useMemo, useState, type ComponentType, type FormEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { CareerPreview } from "../../../_career/CareerArticles";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ApartmentRounded,
  ArrowForwardRounded,
  BookmarkBorderRounded,
  BusinessCenterRounded,
  CampaignRounded,
  CloseRounded,
  CodeRounded,
  HeadsetMicRounded,
  LanguageRounded,
  LaptopMacRounded,
  LocationOnRounded,
  LockRounded,
  MenuRounded,
  MyLocationRounded,
  NearMeRounded,
  PaymentsRounded,
  PlaceOutlined,
  QueryBuilderRounded,
  SearchRounded,
  SecurityRounded,
  StorefrontRounded,
  SupportAgentRounded,
  TuneRounded,
  VerifiedUserRounded,
  WarehouseRounded,
} from "@mui/icons-material";
import styles from "./HomepageRedesign.module.css";
import { useI18n } from "../../../../lib/i18n";
import { getNearestBakuPlace } from "../../../../lib/baku-nearby-places";
import SharedJobCard from "../../../components/JobCard";

type JobLocation = { address?: string; lat?: number | string; lng?: number | string };
type SeekerMapCandidate = { id: string; lat: number; lng: number; profession: string; category: string; district: string; experience: string };
type Job = {
  id: string | number;
  title?: string;
  companyName?: string;
  company_name?: string;
  companyLogo?: string;
  company_logo?: string;
  category?: string;
  wage?: string | number;
  salary?: string | number;
  address?: string;
  city?: string;
  workplace?: string;
  workplace_name?: string;
  location_address?: string;
  location?: JobLocation;
  jobType?: string;
  job_type?: string;
  workType?: string;
  createdAt?: string;
  created_at?: string;
  distanceM?: number;
  distance_m?: number;
  isSponsored?: boolean;
  sponsored?: boolean;
  experience?: string | number;
  experienceRequired?: boolean;
  experience_required?: boolean;
};

type SiteStats = {
  activeJobs?: number;
  active_jobs?: number;
  employers?: number;
  companies?: number;
  verifiedCompanies?: number;
  verified_companies?: number;
  users?: number;
  totalUsers?: number;
  total_users?: number;
  seekers?: number;
  cities?: number;
};

type HomeContext = {
  activeSection: string;
  search: string;
  setSearch: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  cityOptions: string[];
  handleCitySelection: (value: string) => void | Promise<void>;
  category: string;
  setCategory: (value: string | ((current: string) => string)) => void;
  homeCategoryOptions: string[];
  loading: boolean;
  handleHeroSearchSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  homeJobs: Job[];
  allJobs: Job[];
  hasHomeJobs: boolean;
  favoriteJobIds: Set<string>;
  handleToggleFavorite: (job: Job, event: MouseEvent<HTMLButtonElement>) => void;
  openJobDetail: (id: string | number) => void;
  prefetchJobDetail: (id: string | number) => void;
  setActiveSection: (section: string) => void;
  setJobsMode: (mode: string) => void;
  setFocusedMapJobId: (id: string | number | null) => void;
  siteStats: SiteStats | null;
  effectiveLocation?: JobLocation | null;
  homeMapJobs: Job[];
  seekersOnMap: SeekerMapCandidate[];
  focusedMapJobId: string | number | null;
  JobsMap: ComponentType<{ jobs: Job[]; focusedJobId: string | number | null; userLocation?: JobLocation | null; radiusM?: number; seekers?: SeekerMapCandidate[]; showSeekers?: boolean }>;
  homeRadiusM: string;
  handleHomeRadiusChange: (radius: string) => void | Promise<void>;
  locationLoading: boolean;
  handleLocationActivation: () => void;
  user?: { fullName?: string; full_name?: string; role?: string } | null;
  canCreateJob: boolean;
  roleName?: string;
  unread?: number;
  error?: string;
  ok?: string;
};

const categoryIcons = [StorefrontRounded, SupportAgentRounded, CodeRounded, PaymentsRounded, CampaignRounded, WarehouseRounded];
const fallbackCategories = ["Satış", "Müştəri xidməti", "İT və Proqramlaşdırma", "Maliyyə", "Marketinq", "Logistika"];

function compactNumber(value: number): string {
  return new Intl.NumberFormat("az-AZ").format(Math.max(0, Math.round(value)));
}

function salary(job: Job): string {
  const value = job.wage ?? job.salary;
  if (value === null || value === undefined || value === "") return "Maaş razılaşma ilə";
  return `${String(value).replace(/\s*AZN$/i, "")} AZN`;
}

function address(job: Job): string {
  return job.location?.address || job.address || job.city || "Bakı";
}

function company(job: Job): string {
  return job.companyName || job.company_name || "Təsdiqlənmiş şirkət";
}

function SectionTitle({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
      <Typography component="h2" variant="h5" sx={{ fontSize: { xs: 20, md: 24 } }}>{children}</Typography>
      {action ? <Button onClick={onAction} endIcon={<ArrowForwardRounded />} size="small">{action}</Button> : null}
    </Stack>
  );
}

export function AppHeader({ ctx }: { ctx: HomeContext }) {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const go = (section: string) => { ctx.setActiveSection(section); setOpen(false); };
  const navigation = [
    ["jobs", t("nav_jobs")], ["map", "Xəritə"], ["companies", t("nav_companies")], ["career", t("nav_career")], ["about", t("nav_about")],
  ];
  return (
    <Box component="header" className={styles.header}>
      <Container maxWidth="xl" className={styles.headerInner}>
        <Link href="/" className={styles.logoLink} aria-label={`Asimos ${t("home")}`}>
          <Image src="/logo.svg" width={124} height={38} alt="Asimos" priority />
        </Link>
        <Stack component="nav" direction="row" className={styles.desktopNav} aria-label="Navigation">
          {navigation.map(([key, label], index) => <Button key={`${key}-${index}`} color="inherit" onClick={() => go(key)}>{label}</Button>)}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1} className={styles.desktopActions}>
          <Select value={locale} onChange={(event) => setLocale(String(event.target.value))} size="small" IconComponent={LanguageRounded} sx={{ minWidth: 76, height: 36, borderRadius: 2, fontWeight: 800 }} aria-label="Language"><MenuItem value="az">AZ</MenuItem><MenuItem value="ru">RU</MenuItem><MenuItem value="en">EN</MenuItem></Select>
          <IconButton aria-label={t("favorites")} onClick={() => go("profile")}><BookmarkBorderRounded /></IconButton>
          {ctx.user ? (
            <Button variant="outlined" onClick={() => go("profile")}>{ctx.user.fullName || ctx.user.full_name || t("profile")}</Button>
          ) : <Button variant="outlined" onClick={() => go("auth")}>{t("login")}</Button>}
          <Button variant="contained" onClick={() => go(ctx.canCreateJob ? "create" : "auth")} startIcon={<BusinessCenterRounded />}>
            {t("post_job")}
          </Button>
        </Stack>
        <IconButton className={styles.mobileMenu} onClick={() => setOpen(true)} aria-label={t("open_menu")}><MenuRounded /></IconButton>
      </Container>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: "min(86vw, 340px)", p: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Image src="/logo.svg" width={110} height={34} alt="Asimos" />
          <IconButton onClick={() => setOpen(false)} aria-label={t("close_menu")}><CloseRounded /></IconButton>
        </Stack>
        {navigation.map(([key, label], index) => <Button key={`${key}-${index}`} onClick={() => go(key)} fullWidth sx={{ justifyContent: "flex-start", mb: 1 }}>{label}</Button>)}
        <Divider sx={{ my: 2 }} />
        <Select value={locale} onChange={(event) => setLocale(String(event.target.value))} fullWidth size="small" sx={{ mb: 2 }}><MenuItem value="az">Azərbaycan dili</MenuItem><MenuItem value="ru">Русский</MenuItem><MenuItem value="en">English</MenuItem></Select>
        <Button variant="outlined" fullWidth onClick={() => go(ctx.user ? "profile" : "auth")} sx={{ mb: 1 }}>{t("login")}</Button>
        <Button variant="contained" fullWidth onClick={() => go(ctx.canCreateJob ? "create" : "auth")}>{t("post_job")}</Button>
      </Drawer>
    </Box>
  );
}

function Hero({ ctx }: { ctx: HomeContext }) {
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const filteredCities = ctx.cityOptions.filter((city) => city.toLocaleLowerCase("az").includes(cityQuery.trim().toLocaleLowerCase("az")));
  return (
    <Box component="section" className={styles.hero}>
      <Container maxWidth="xl" className={styles.heroGrid}>
        <Stack className={styles.heroCopy}>
          <Typography component="h1" variant="h1">Yaxınlığındakı işi tap</Typography>
          <Typography>Lokasiyanı paylaş, sənə ən yaxın vakansiyaları məsafəyə görə kəşf et.</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={2.5}>
            <Button variant="contained" startIcon={<MyLocationRounded />} onClick={ctx.handleLocationActivation} disabled={ctx.locationLoading}>
              {ctx.locationLoading ? "Lokasiya alınır..." : "Yaxınlıqdakı işləri göstər"}
            </Button>
            <Button variant="outlined" startIcon={<PlaceOutlined />} onClick={() => setCityPickerOpen(true)}>Şəhəri özüm seçim</Button>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center" mt={2} color="text.secondary">
            <LockRounded sx={{ fontSize: 16 }} /><Typography variant="caption">Dəqiq ünvanınız işəgötürənlərlə paylaşılmır.</Typography>
          </Stack>
        </Stack>
        <Box className={styles.skyline} aria-label="Bakı şəhərinin sahil mənzərəsi">
          <Image src="/baku-nearby-jobs.png" alt="Bakı sahili və vakansiya lokasiyası" fill priority sizes="(max-width: 800px) 100vw, 52vw" className={styles.heroImage} />
        </Box>
      </Container>
      <Dialog open={cityPickerOpen} onClose={() => setCityPickerOpen(false)} fullWidth maxWidth="xs" aria-labelledby="city-picker-title">
        <DialogTitle id="city-picker-title">Şəhər seçin</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="Şəhər axtar..." autoComplete="off" inputProps={{ "aria-label": "Şəhər axtar" }} sx={{ mt: 1, mb: 2, "& .MuiInputBase-root": { height: 52, fontSize: 16 }, "& input": { height: "auto", py: 1.5 } }} />
          <Box className={styles.cityPickerList}>
            {filteredCities.map((city) => <Button key={city} fullWidth variant={ctx.city === city ? "contained" : "outlined"} startIcon={<PlaceOutlined />} onClick={() => { void ctx.handleCitySelection(city); setCityPickerOpen(false); setCityQuery(""); }}>{city}</Button>)}
            {!filteredCities.length && <Typography color="text.secondary" textAlign="center" py={2}>Bu adla şəhər tapılmadı.</Typography>}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function SearchPanel({ ctx }: { ctx: HomeContext }) {
  const categories = (ctx.homeCategoryOptions.length ? ctx.homeCategoryOptions : fallbackCategories).slice(0, 6);
  return (
    <Container maxWidth="xl" className={styles.searchWrap}>
      <Card component="form" onSubmit={ctx.handleHeroSearchSubmit} className={styles.searchCard}>
        <Box className={styles.searchFields}>
          <TextField value={ctx.search} onChange={(event) => ctx.setSearch(event.target.value)} placeholder="Vəzifə, şirkət və ya açar söz" label="Vakansiya axtar" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
          <FormControl>
            <Select displayEmpty value={ctx.city} onChange={(event) => ctx.setCity(event.target.value)} startAdornment={<InputAdornment position="start"><PlaceOutlined /></InputAdornment>} inputProps={{ "aria-label": "Şəhər, rayon və ya metro" }}>
              <MenuItem value="">Şəhər, rayon və ya metro</MenuItem>
              {ctx.cityOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl>
            <Select displayEmpty value={ctx.category} onChange={(event) => ctx.setCategory(event.target.value)} inputProps={{ "aria-label": "Kateqoriya seç" }}>
              <MenuItem value="">Kateqoriya seç</MenuItem>
              {ctx.homeCategoryOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" disabled={ctx.loading} startIcon={<SearchRounded />}>{ctx.loading ? "Axtarılır" : "Axtar"}</Button>
        </Box>
        <Typography variant="caption" fontWeight={800} color="text.secondary">Populyar kateqoriyalar</Typography>
        <Box className={styles.categoryRow}>
          {categories.map((item, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            const selected = ctx.category === item;
            return <Button key={item} variant={selected ? "contained" : "outlined"} color={selected ? "primary" : "inherit"} startIcon={<Icon />} onClick={() => ctx.setCategory((current) => current === item ? "" : item)}>{item}</Button>;
          })}
          <Button variant="text" startIcon={<TuneRounded />}>Hamısı</Button>
        </Box>
      </Card>
    </Container>
  );
}

function JobsArea({ ctx }: { ctx: HomeContext }) {
  const [mapJobId, setMapJobId] = useState<string | number | null>(null);
  const jobs = ctx.homeJobs.slice(0, 20);
  const nearbyCampusAndMetroJobs = useMemo(() => ctx.allJobs
    .map((job) => ({ job, nearestPlace: getNearestBakuPlace(job) }))
    .filter((item): item is { job: Job; nearestPlace: NonNullable<ReturnType<typeof getNearestBakuPlace>> } => Boolean(item.nearestPlace && item.nearestPlace.distanceM <= 5000))
    .sort((a, b) => a.nearestPlace.distanceM - b.nearestPlace.distanceM), [ctx.allJobs]);
  const openAll = () => { ctx.setJobsMode("all"); ctx.setFocusedMapJobId(null); ctx.setActiveSection("jobs"); };
  const mapJob = mapJobId === null ? null : ctx.allJobs.find((job) => String(job.id) === String(mapJobId));
  const modalMapJobs = mapJob && !ctx.homeMapJobs.some((job) => String(job.id) === String(mapJob.id))
    ? [...ctx.homeMapJobs, mapJob]
    : ctx.homeMapJobs;
  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 5 } }}>
      <Box className={styles.jobsResultsHeader}>
        <Box><Typography component="h2" variant="h4" fontWeight={800}>Sizə ən yaxın vakansiyalar</Typography><Typography variant="body2" color="text.secondary">{ctx.city || ctx.effectiveLocation?.address || "Yaxınlığınız"} · {jobs.length} göstərilir, cəmi {ctx.homeJobs.length} elan</Typography></Box>
        <Stack direction="row" gap={0.75} className={styles.radiusChips} aria-label="Axtarış radiusu">
          {[1000, 3000, 5000, 10000, 30000].map((item) => <Chip key={item} label={`${item / 1000} km`} clickable onClick={() => ctx.handleHomeRadiusChange(String(item))} color={Number(ctx.homeRadiusM) === item ? "primary" : "default"} variant={Number(ctx.homeRadiusM) === item ? "filled" : "outlined"} />)}
        </Stack>
      </Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}><Button onClick={openAll}>Bütün vakansiyalara bax <ArrowForwardRounded sx={{ ml: 0.5 }} /></Button></Stack>
      {ctx.error ? <Alert severity="error" sx={{ mb: 2 }}>{ctx.error}</Alert> : null}
      {ctx.ok ? <Alert severity="success" sx={{ mb: 2 }}>{ctx.ok}</Alert> : null}
      <Box className={styles.jobsGrid}>
        {jobs.length ? jobs.map((job) => <SharedJobCard key={job.id} job={job} onClick={() => ctx.openJobDetail(job.id)} onPrefetch={() => ctx.prefetchJobDetail(job.id)} isFavorite={ctx.favoriteJobIds.has(String(job.id))} onToggleFavorite={(event: MouseEvent<HTMLButtonElement>) => ctx.handleToggleFavorite(job, event)} onShowMap={() => setMapJobId(job.id)} />) : <Card className={styles.emptyCard}><BusinessCenterRounded color="disabled" /><Typography data-no-translate fontWeight={700}>{ctx.locationLoading ? "Lokasiya müəyyən edilir..." : "Bu radiusda vakansiya tapılmadı"}</Typography><Typography variant="body2" color="text.secondary">Radiusu artırın və ya şəhər seçin.</Typography></Card>}
      </Box>
      <Dialog open={Boolean(mapJob)} onClose={() => setMapJobId(null)} fullWidth maxWidth="xl" PaperProps={{ className: styles.jobsMapDialog }} aria-labelledby="nearby-jobs-map-title">
        <Box className={styles.jobsMapDialogHeader}><Box><Typography id="nearby-jobs-map-title" variant="h6" fontWeight={800}>Vakansiyaların xəritəsi</Typography><Typography variant="body2" color="text.secondary">{ctx.homeRadiusM ? `${Number(ctx.homeRadiusM) / 1000} km radiusda ${ctx.homeJobs.length} elan` : `${ctx.homeJobs.length} elan`}</Typography></Box><IconButton onClick={() => setMapJobId(null)} aria-label="Xəritəni bağla"><CloseRounded /></IconButton></Box>
        <DialogContent className={styles.jobsMapDialogContent}>
          <Box className={styles.jobsMapDialogMap}><ctx.JobsMap jobs={modalMapJobs} seekers={ctx.user ? ctx.seekersOnMap : []} showSeekers={Boolean(ctx.user)} focusedJobId={mapJob?.id || null} userLocation={ctx.effectiveLocation} radiusM={Number(ctx.homeRadiusM) || 30000} /></Box>
          <Stack className={styles.jobsMapDialogList} divider={<Divider flexItem />}>
            {ctx.homeJobs.map((job) => <Box key={job.id} className={styles.mapJobRow}>
              <Button className={styles.mapJobSelect} onClick={() => setMapJobId(job.id)} aria-pressed={String(mapJobId) === String(job.id)}><Box textAlign="left" minWidth={0}><Typography fontWeight={800} noWrap>{job.title || "Vakansiya"}</Typography><Typography variant="body2" color="text.secondary" noWrap>{company(job)} · {address(job)}</Typography><Typography variant="caption" color="primary.main" fontWeight={800}>{salary(job)}</Typography></Box></Button>
              <Button size="small" onClick={() => { setMapJobId(null); ctx.openJobDetail(job.id); }}>Elana bax</Button>
            </Box>)}
            {!ctx.homeJobs.length && <Typography color="text.secondary" p={2}>Bu radiusda göstəriləcək elan yoxdur.</Typography>}
          </Stack>
        </DialogContent>
      </Dialog>
      <Box className={styles.collectionsGrid}>
        <MetroList jobs={nearbyCampusAndMetroJobs} ctx={ctx} onShowMap={(job) => setMapJobId(job.id)} />
      </Box>
    </Container>
  );
}

function MetroList({ jobs, ctx, onShowMap }: { jobs: Array<{ job: Job; nearestPlace: NonNullable<ReturnType<typeof getNearestBakuPlace>> }>; ctx: HomeContext; onShowMap: (job: Job) => void }) {
  const visibleJobs = jobs.slice(0, 16);
  return <Card className={`${styles.listCard} ${styles.nearbyPlacesCard}`}>
    <Box className={styles.collectionHeader}>
      <Box className={styles.collectionIcon}><PlaceOutlined /></Box>
      <Box flex={1}>
        <Typography component="h2" fontWeight={800}>Metro və universitetlərə yaxın işlər</Typography>
      <Typography variant="caption" color="text.secondary">Vakansiya ünvanından ən yaxın metroya və ya universitetə olan məsafə · 5 km radius</Typography>
      </Box>
      <Chip label={`${visibleJobs.length} göstərilir · ${jobs.length} elan`} color="primary" variant="outlined" />
    </Box>
    {visibleJobs.length ? <Box className={styles.nearbyPlacesGrid}>
      {visibleJobs.map(({ job, nearestPlace }) => <SharedJobCard key={job.id} job={job} nearbyLabel={`${nearestPlace.type === "metro" ? "Ən yaxın metro" : "Ən yaxın universitet"}: ${nearestPlace.name} · ${(nearestPlace.distanceM / 1000).toFixed(1)} km`} onClick={() => ctx.openJobDetail(job.id)} onPrefetch={() => ctx.prefetchJobDetail(job.id)} isFavorite={ctx.favoriteJobIds.has(String(job.id))} onToggleFavorite={(event: MouseEvent<HTMLButtonElement>) => ctx.handleToggleFavorite(job, event)} onShowMap={() => { ctx.setFocusedMapJobId(job.id); onShowMap(job); }} />)}
    </Box> : <Box className={styles.nearbyPlacesEmpty}><BusinessCenterRounded color="disabled" /><Typography fontWeight={700}>5 km radiusda uyğun elan yoxdur</Typography><Typography variant="body2" color="text.secondary">Yalnız xəritədə dəqiq lokasiyası olan elanlar göstərilir.</Typography></Box>}
  </Card>;
}

function HowItWorks() {
  const steps = [[LocationOnRounded, "Lokasiyanı seç", "Şəhərini və ya mövqeyini seçərək başla."], [MyLocationRounded, "Radiusu müəyyən et", "İstədiyin məsafə radiusunu seç və filtrlə."], [SearchRounded, "Yaxın vakansiyaları gör", "Sənə ən yaxın işləri məsafəyə görə kəşf et."]] as const;
  return <Container maxWidth="xl" className={styles.how}><Typography component="h2" variant="h4" textAlign="center">Asimos necə işləyir?</Typography><Box className={styles.steps}>{steps.map(([Icon, title, text], index) => <Box key={title} className={styles.step}><Box className={styles.stepIcon}><Icon /></Box>{index < steps.length - 1 ? <Box className={styles.stepLine} /> : null}<Typography component="h3" fontWeight={800}>{title}</Typography><Typography variant="body2" color="text.secondary">{text}</Typography></Box>)}</Box></Container>;
}

function TrustAndCta() {
  const trust = [[VerifiedUserRounded, "Təsdiqlənmiş şirkətlər", "Bütün şirkətlərimiz daim yoxlanılır və təsdiqlənir."], [LockRounded, "Məlumatların gizliliyi", "Məlumatların qorunması bizim üçün prioritet məsələdir."], [CampaignRounded, "Şübhəli elanı şikayət et", "Şübhəli elanları bizə bildirin, araşdıraq və tədbir görək."], [HeadsetMicRounded, "Dəstək mərkəzi", "Hər zaman sual və problemləriniz üçün yanınızdayıq."]];
  return <Container maxWidth="xl"><Card className={styles.trustCard}><Typography component="h2" variant="h5" textAlign="center">Təhlükəsiz iş axtarışı</Typography><Box className={styles.trustGrid}>{trust.map(([Icon, title, text]) => <Stack key={String(title)} direction="row" gap={1.5}><Icon color="primary" /><Box><Typography fontWeight={800}>{String(title)}</Typography><Typography variant="body2" color="text.secondary">{String(text)}</Typography></Box></Stack>)}</Box><Alert severity="warning" variant="outlined" icon={<CampaignRounded />}>İş üçün ödəniş tələb edən elanları bizə bildirin.</Alert></Card></Container>;
}

function Stats({ stats, jobs }: { stats: SiteStats | null; jobs: Job[] }) {
  const fallbackEmployers = new Set(jobs.map((job) => job.companyName || job.company_name).filter(Boolean)).size;
  const values = [
    [BusinessCenterRounded, stats?.activeJobs ?? stats?.active_jobs ?? jobs.length, "aktiv vakansiya"],
    [ApartmentRounded, stats?.employers ?? stats?.companies ?? stats?.verifiedCompanies ?? stats?.verified_companies ?? fallbackEmployers, "işəgötürən hesabı"],
    [LocationOnRounded, stats?.cities ?? 74, "şəhər və rayon"],
    [SupportAgentRounded, stats?.seekers ?? stats?.users ?? stats?.totalUsers ?? stats?.total_users ?? null, "iş axtaran"],
  ] as const;
  return <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 5 } }}><Card className={styles.stats}>{values.map(([Icon, value, label]) => <Stack key={label} direction="row" alignItems="center" gap={1.5}><Icon color="secondary" /><Box><Typography variant="h5">{value === null ? "—" : compactNumber(Number(value))}</Typography><Typography variant="body2" color="text.secondary">{label}</Typography></Box></Stack>)}</Card></Container>;
}

function CareerAdvice() { return <CareerPreview />; }

export default function HomepageRedesign({ ctx }: { ctx: HomeContext }) {
  if (ctx.activeSection !== "home") return null;
  return <Box className={styles.page}><Hero ctx={ctx} /><SearchPanel ctx={ctx} /><JobsArea ctx={ctx} /><HowItWorks /><TrustAndCta /><Stats stats={ctx.siteStats} jobs={ctx.allJobs || ctx.homeJobs || []} /><CareerAdvice /></Box>;
}
