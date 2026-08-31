"use client";

import { useMemo, useState, type ComponentType, type FormEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
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
  ChevronRightRounded,
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

type JobLocation = { address?: string; lat?: number | string; lng?: number | string };
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
};

type SiteStats = {
  activeJobs?: number;
  active_jobs?: number;
  companies?: number;
  verifiedCompanies?: number;
  verified_companies?: number;
  users?: number;
  totalUsers?: number;
  total_users?: number;
  cities?: number;
};

type HomeContext = {
  activeSection: string;
  search: string;
  setSearch: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  cityOptions: string[];
  category: string;
  setCategory: (value: string | ((current: string) => string)) => void;
  homeCategoryOptions: string[];
  loading: boolean;
  handleHeroSearchSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  homeJobs: Job[];
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
  focusedMapJobId: string | number | null;
  JobsMap: ComponentType<{ jobs: Job[]; focusedJobId: string | number | null; userLocation?: JobLocation | null }>;
  homeRadiusM: string;
  handleHomeRadiusChange: (radius: string) => void | Promise<void>;
  locationLoading: boolean;
  handleLocationActivation: () => void;
  user?: { fullName?: string; full_name?: string; role?: string } | null;
  canCreateJob: boolean;
  unread?: number;
  error?: string;
  ok?: string;
};

const categoryIcons = [StorefrontRounded, SupportAgentRounded, CodeRounded, PaymentsRounded, CampaignRounded, WarehouseRounded];
const fallbackCategories = ["Satış", "Müştəri xidməti", "İT və Proqramlaşdırma", "Maliyyə", "Marketinq", "Logistika"];

function compactNumber(value: number): string {
  return new Intl.NumberFormat("az-AZ").format(Math.max(0, Math.round(value)));
}

function timeAgo(value?: string): string {
  if (!value) return "Yeni əlavə olunub";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Yeni əlavə olunub";
  const hours = Math.max(1, Math.round((Date.now() - timestamp) / 3_600_000));
  if (hours < 24) return `${hours} saat əvvəl`;
  return `${Math.max(1, Math.round(hours / 24))} gün əvvəl`;
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

function logo(job: Job): string | undefined {
  const value = job.companyLogo || job.company_logo;
  return value && /^https?:\/\//.test(value) ? value : undefined;
}

function SectionTitle({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
      <Typography component="h2" variant="h5" sx={{ fontSize: { xs: 20, md: 24 } }}>{children}</Typography>
      {action ? <Button onClick={onAction} endIcon={<ArrowForwardRounded />} size="small">{action}</Button> : null}
    </Stack>
  );
}

function Header({ ctx }: { ctx: HomeContext }) {
  const [open, setOpen] = useState(false);
  const go = (section: string) => { ctx.setActiveSection(section); setOpen(false); };
  const navigation = [
    ["jobs", "Vakansiyalar"], ["jobs", "Şirkətlər"], ["about", "Karyera məsləhətləri"], ["about", "Haqqımızda"],
  ];
  return (
    <Box component="header" className={styles.header}>
      <Container maxWidth="xl" className={styles.headerInner}>
        <Link href="/" className={styles.logoLink} aria-label="Asimos ana səhifə">
          <Image src="/logo.svg" width={124} height={38} alt="Asimos" priority />
        </Link>
        <Stack component="nav" direction="row" className={styles.desktopNav} aria-label="Əsas naviqasiya">
          {navigation.map(([key, label], index) => <Button key={`${key}-${index}`} color="inherit" onClick={() => go(key)}>{label}</Button>)}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1} className={styles.desktopActions}>
          <Button color="inherit" size="small" endIcon={<LanguageRounded fontSize="small" />}>AZ</Button>
          <IconButton aria-label="Seçimlər" onClick={() => go("profile")}><BookmarkBorderRounded /></IconButton>
          {ctx.user ? (
            <Button variant="outlined" onClick={() => go("profile")}>{ctx.user.fullName || ctx.user.full_name || "Profil"}</Button>
          ) : <Button variant="outlined" onClick={() => go("auth")}>Daxil ol</Button>}
          <Button variant="contained" onClick={() => go(ctx.canCreateJob ? "create" : "auth")} startIcon={<BusinessCenterRounded />}>
            Elan yerləşdir
          </Button>
        </Stack>
        <IconButton className={styles.mobileMenu} onClick={() => setOpen(true)} aria-label="Menyunu aç"><MenuRounded /></IconButton>
      </Container>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: "min(86vw, 340px)", p: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Image src="/logo.svg" width={110} height={34} alt="Asimos" />
          <IconButton onClick={() => setOpen(false)} aria-label="Menyunu bağla"><CloseRounded /></IconButton>
        </Stack>
        {navigation.map(([key, label], index) => <Button key={`${key}-${index}`} onClick={() => go(key)} fullWidth sx={{ justifyContent: "flex-start", mb: 1 }}>{label}</Button>)}
        <Divider sx={{ my: 2 }} />
        <Button variant="outlined" fullWidth onClick={() => go(ctx.user ? "profile" : "auth")} sx={{ mb: 1 }}>Daxil ol</Button>
        <Button variant="contained" fullWidth onClick={() => go(ctx.canCreateJob ? "create" : "auth")}>Elan yerləşdir</Button>
      </Drawer>
    </Box>
  );
}

function Hero({ ctx }: { ctx: HomeContext }) {
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
            <Button variant="outlined" onClick={() => ctx.setCity("Bakı")}>Şəhəri özüm seçim</Button>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center" mt={2} color="text.secondary">
            <LockRounded sx={{ fontSize: 16 }} /><Typography variant="caption">Dəqiq ünvanınız işəgötürənlərlə paylaşılmır.</Typography>
          </Stack>
        </Stack>
        <Box className={styles.skyline} aria-hidden="true">
          <Box className={styles.skylineLines} />
          <LocationOnRounded className={styles.heroPin} />
        </Box>
      </Container>
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

function ProximityMap({ ctx }: { ctx: HomeContext }) {
  const [showRealMap, setShowRealMap] = useState(false);
  const radius = Number(ctx.homeRadiusM) || 1000;
  const radiusOptions = [1000, 3000, 5000, 10000];
  const nearby = useMemo(
    () => ctx.homeJobs.filter((job) => {
      const distance = job.distanceM ?? job.distance_m;
      return typeof distance !== "number" || distance <= radius;
    }),
    [ctx.homeJobs, radius],
  );
  const nearbyMapJobs = useMemo(
    () => ctx.homeMapJobs.filter((job) => nearby.some((nearbyJob) => String(nearbyJob.id) === String(job.id))),
    [ctx.homeMapJobs, nearby],
  );
  const count = nearby.length;
  const openNearbyJobs = () => {
    ctx.setJobsMode("all");
    ctx.setActiveSection("jobs");
  };
  return (
    <Container maxWidth="xl" sx={{ mt: 2.5 }}>
      <Card className={styles.proximityCard}>
        <Stack className={styles.proximityCopy}>
          <Stack direction="row" gap={1.2} alignItems="flex-start"><LocationOnRounded color="primary" /><Typography variant="h5" component="h2">{ctx.effectiveLocation?.address || "Nərimanovda"} 1 km yaxınlığında <strong>{count} vakansiya</strong> tapdıq.</Typography></Stack>
          <Stack direction="row" gap={1} flexWrap="wrap"><Button variant="contained" onClick={openNearbyJobs}>Elanlara bax</Button><Button variant="outlined" startIcon={<PlaceOutlined />} onClick={() => setShowRealMap((current) => !current)}>{showRealMap ? "Xəritəni bağla" : "Xəritədə göstər"}</Button></Stack>
          <Typography variant="caption" fontWeight={800}>Radius</Typography>
          <Stack direction="row" gap={1}>{radiusOptions.map((item) => <Chip key={item} label={`${item / 1000} km`} clickable onClick={() => ctx.handleHomeRadiusChange(String(item))} color={radius === item ? "primary" : "default"} variant={radius === item ? "filled" : "outlined"} aria-label={`${item / 1000} kilometr radius seç`} />)}</Stack>
        </Stack>
        {showRealMap ? <Box className={styles.realMap}><ctx.JobsMap jobs={nearbyMapJobs} focusedJobId={ctx.focusedMapJobId} userLocation={ctx.effectiveLocation} /></Box> : <Box className={styles.mapCanvas} aria-label="Yaxın vakansiyaların xəritə görünüşü">
          <Box className={styles.radiusCircle}><Typography fontWeight={800} color="primary.main">Nərimanov</Typography><Box className={styles.mapCenter} /></Box>
          {["18% 28%", "30% 67%", "58% 32%", "70% 70%", "45% 15%"].map((position, index) => {
            const [top, left] = position.split(" ");
            return <Box key={position} className={styles.mapMarker} sx={{ top, left }}><BusinessCenterRounded /></Box>;
          })}
          <Typography className={styles.metroLabel}>Metro · Nəriman Nərimanov</Typography>
        </Box>}
      </Card>
    </Container>
  );
}

function JobCard({ job, ctx }: { job: Job; ctx: HomeContext }) {
  const distance = job.distanceM ?? job.distance_m;
  return (
    <Card className={styles.jobCard} onMouseEnter={() => ctx.prefetchJobDetail(job.id)} onClick={() => ctx.openJobDetail(job.id)} tabIndex={0} role="article" onKeyDown={(event) => { if (event.key === "Enter") ctx.openJobDetail(job.id); }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Avatar src={logo(job)} variant="rounded" sx={{ width: 48, height: 48, bgcolor: "primary.light", color: "primary.dark", fontWeight: 800 }}>{company(job).slice(0, 1)}</Avatar>
        <IconButton size="small" aria-label="Elanı seçimlərə əlavə et" onClick={(event) => { event.stopPropagation(); ctx.handleToggleFavorite(job, event); }} color={ctx.favoriteJobIds.has(String(job.id)) ? "primary" : "default"}><BookmarkBorderRounded /></IconButton>
      </Stack>
      <Box>
        <Typography component="h3" fontWeight={800} className={styles.jobTitle}>{job.title || "Vakansiya"}</Typography>
        <Typography variant="body2" color="text.secondary">{company(job)}</Typography>
      </Box>
      <Typography fontWeight={800}>{salary(job)}</Typography>
      <Stack direction="row" gap={0.5} alignItems="center" color="text.secondary"><PlaceOutlined sx={{ fontSize: 15 }} /><Typography variant="caption">{address(job)}{distance ? ` • ${distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`} uzaqlıqda` : ""}</Typography></Stack>
      <Stack direction="row" gap={0.7} flexWrap="wrap"><Chip label={job.jobType || job.job_type || job.workType || "Tam iş günü"} size="small" />{job.isSponsored || job.sponsored ? <Chip label="Sponsorlu" color="warning" size="small" /> : null}</Stack>
      <Typography variant="caption" color="text.secondary">{timeAgo(job.createdAt || job.created_at)}</Typography>
    </Card>
  );
}

function JobsArea({ ctx }: { ctx: HomeContext }) {
  const jobs = ctx.homeJobs.slice(0, 4);
  const openAll = () => { ctx.setJobsMode("all"); ctx.setFocusedMapJobId(null); ctx.setActiveSection("jobs"); };
  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 5 } }}>
      <SectionTitle action="Hamısına bax" onAction={openAll}>Sizə ən yaxın vakansiyalar</SectionTitle>
      {ctx.error ? <Alert severity="error" sx={{ mb: 2 }}>{ctx.error}</Alert> : null}
      {ctx.ok ? <Alert severity="success" sx={{ mb: 2 }}>{ctx.ok}</Alert> : null}
      <Box className={styles.jobsGrid}>
        {jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} ctx={ctx} />) : Array.from({ length: 4 }, (_, index) => <Card key={index} className={styles.emptyCard}><BusinessCenterRounded color="disabled" /><Typography fontWeight={700}>Vakansiyalar yüklənir</Typography><Typography variant="body2" color="text.secondary">Yeni elanlar bir azdan burada görünəcək.</Typography></Card>)}
      </Box>
      <Box className={styles.collectionsGrid}>
        <MiniList title="Bu gün əlavə olunanlar" jobs={ctx.homeJobs.slice(4, 8)} ctx={ctx} />
        <MetroList jobs={ctx.homeJobs} ctx={ctx} />
        <MiniList title="Təcrübə tələb etməyən işlər" jobs={ctx.homeJobs.slice(8, 12)} ctx={ctx} />
      </Box>
      <Box className={styles.workModeGrid}>
        <Card className={styles.modeBanner}><QueryBuilderRounded /><Box><Typography fontWeight={800}>Part-time və növbəli işlər</Typography><Typography variant="body2">{Math.max(0, Math.round(ctx.homeJobs.length * .23))} vakansiya</Typography></Box><ArrowForwardRounded /></Card>
        <Card className={`${styles.modeBanner} ${styles.remoteBanner}`}><LaptopMacRounded /><Box><Typography fontWeight={800}>Uzaqdan işlər</Typography><Typography variant="body2">{Math.max(0, Math.round(ctx.homeJobs.length * .33))} vakansiya</Typography></Box><ArrowForwardRounded /></Card>
      </Box>
    </Container>
  );
}

function MiniList({ title, jobs, ctx }: { title: string; jobs: Job[]; ctx: HomeContext }) {
  return <Card className={styles.listCard}><SectionTitle action="Hamısına bax">{title}</SectionTitle><Stack divider={<Divider flexItem />} spacing={1.25}>{jobs.length ? jobs.slice(0, 4).map((job) => <Stack key={job.id} direction="row" gap={1.2} alignItems="center" className={styles.miniJob} onClick={() => ctx.openJobDetail(job.id)}><Avatar src={logo(job)} variant="rounded">{company(job).charAt(0)}</Avatar><Box flex={1} minWidth={0}><Typography fontWeight={800} noWrap>{job.title || "Vakansiya"}</Typography><Typography variant="caption" color="text.secondary" noWrap>{company(job)} • {address(job)}</Typography></Box><BookmarkBorderRounded fontSize="small" /></Stack>) : <Typography variant="body2" color="text.secondary">Hazırda uyğun elan yoxdur.</Typography>}</Stack></Card>;
}

function MetroList({ jobs, ctx }: { jobs: Job[]; ctx: HomeContext }) {
  const metros = ["28 May", "Gənclik", "Nəriman Nərimanov", "Elmlər Akademiyası"];
  return <Card className={styles.listCard}><SectionTitle>Metroya yaxın işlər</SectionTitle><Stack spacing={1}>{metros.map((metro, index) => <Button key={metro} className={styles.metroButton} onClick={() => { ctx.setSearch(metro); ctx.setActiveSection("jobs"); }}><PlaceOutlined /><Box textAlign="left" flex={1}><Typography fontWeight={800}>{metro}</Typography><Typography variant="caption">{Math.max(0, Math.round((jobs.length || 1) * (.11 + index * .04)))} vakansiya</Typography></Box><ChevronRightRounded /></Button>)}</Stack></Card>;
}

function HowItWorks() {
  const steps = [[LocationOnRounded, "Lokasiyanı seç", "Şəhərini və ya mövqeyini seçərək başla."], [MyLocationRounded, "Radiusu müəyyən et", "İstədiyin məsafə radiusunu seç və filtrlə."], [SearchRounded, "Yaxın vakansiyaları gör", "Sənə ən yaxın işləri məsafəyə görə kəşf et."], [NearMeRounded, "1 kliklə müraciət et", "Uyğun işi seç və bir kliklə müraciətini göndər."] ] as const;
  return <Container maxWidth="xl" className={styles.how}><Typography component="h2" variant="h4" textAlign="center">Asimos necə işləyir?</Typography><Box className={styles.steps}>{steps.map(([Icon, title, text], index) => <Box key={title} className={styles.step}><Box className={styles.stepIcon}><Icon /></Box>{index < steps.length - 1 ? <Box className={styles.stepLine} /> : null}<Typography component="h3" fontWeight={800}>{title}</Typography><Typography variant="body2" color="text.secondary">{text}</Typography></Box>)}</Box></Container>;
}

function TrustAndCta({ ctx }: { ctx: HomeContext }) {
  const trust = [[VerifiedUserRounded, "Təsdiqlənmiş şirkətlər", "Bütün şirkətlərimiz daim yoxlanılır və təsdiqlənir."], [LockRounded, "Məlumatların gizliliyi", "Məlumatların qorunması bizim üçün prioritet məsələdir."], [CampaignRounded, "Şübhəli elanı şikayət et", "Şübhəli elanları bizə bildirin, araşdıraq və tədbir görək."], [HeadsetMicRounded, "Dəstək mərkəzi", "Hər zaman sual və problemləriniz üçün yanınızdayıq."]];
  return <Container maxWidth="xl"><Card className={styles.trustCard}><Typography component="h2" variant="h5" textAlign="center">Təhlükəsiz iş axtarışı</Typography><Box className={styles.trustGrid}>{trust.map(([Icon, title, text]) => <Stack key={String(title)} direction="row" gap={1.5}><Icon color="primary" /><Box><Typography fontWeight={800}>{String(title)}</Typography><Typography variant="body2" color="text.secondary">{String(text)}</Typography></Box></Stack>)}</Box><Alert severity="warning" variant="outlined" icon={<CampaignRounded />}>İş üçün ödəniş tələb edən elanları bizə bildirin.</Alert></Card><Card className={styles.employerCta}><Box><Typography variant="h4" component="h2">Doğru namizədlərə daha yaxın olun</Typography><Typography color="text.secondary">Lokasiyaya əsaslanan vakansiyalarınızla yaxın ərazidə olan minlərlə namizədə çatın.</Typography><Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={2.5}><Button variant="contained" onClick={() => ctx.setActiveSection(ctx.canCreateJob ? "create" : "auth")}>Vakansiyanı dərc et</Button><Button variant="outlined" onClick={() => ctx.setActiveSection("profile")}>Şirkət profili yarat</Button></Stack></Box><Box className={styles.ctaArt} aria-hidden="true"><ApartmentRounded /><LocationOnRounded /><BusinessCenterRounded /></Box></Card></Container>;
}

function Stats({ ctx }: { ctx: HomeContext }) {
  const stats = ctx.siteStats || {};
  const values = [[BusinessCenterRounded, stats.activeJobs ?? stats.active_jobs ?? ctx.homeJobs.length, "aktiv vakansiya"], [ApartmentRounded, stats.companies ?? stats.verifiedCompanies ?? stats.verified_companies ?? 0, "təsdiqlənmiş şirkət"], [LocationOnRounded, stats.cities ?? 25, "şəhər və rayon"], [SupportAgentRounded, stats.users ?? stats.totalUsers ?? stats.total_users ?? 0, "uğurlu müraciət"]] as const;
  return <Container maxWidth="xl"><Card className={styles.stats}>{values.map(([Icon, value, label]) => <Stack key={label} direction="row" alignItems="center" gap={1.5}><Icon color="secondary" /><Box><Typography variant="h5">{compactNumber(Number(value))}+</Typography><Typography variant="body2" color="text.secondary">{label}</Typography></Box></Stack>)}</Card></Container>;
}

function CareerAdvice() {
  const cards = [["#eaf8f2", SupportAgentRounded, "Müsahibəyə necə hazırlaşmalı?", "Müsahibədə uğurlu olmaq üçün 7 əsas tövsiyə."], ["#fff2e7", MyLocationRounded, "CV-nizi fərqləndirən 5 məsləhət", "İşəgötürənlərin diqqətini çəkən CV yazın."], ["#eaf4ff", LaptopMacRounded, "Uzaqdan işləyərkən məhsuldarlığı artırın", "Ev şəraitində effektiv işləmək üçün məsləhətlər."] ] as const;
  return <Container maxWidth="xl" className={styles.advice}><SectionTitle action="Hamısına bax">Karyera məsləhətləri</SectionTitle><Box className={styles.adviceGrid}>{cards.map(([color, Icon, title, text]) => <Card key={title} className={styles.adviceCard}><Box className={styles.adviceArt} sx={{ backgroundColor: color }}><Icon /></Box><Box p={2}><Typography component="h3" fontWeight={800}>{title}</Typography><Typography variant="body2" color="text.secondary">{text}</Typography><Stack direction="row" justifyContent="space-between" mt={1.5}><Typography variant="caption">Karyera • 5 dəq oxu</Typography><ArrowForwardRounded fontSize="small" /></Stack></Box></Card>)}</Box></Container>;
}

export default function HomepageRedesign({ ctx }: { ctx: HomeContext }) {
  if (ctx.activeSection !== "home") return null;
  return <Box className={styles.page}><Header ctx={ctx} /><Hero ctx={ctx} /><SearchPanel ctx={ctx} /><ProximityMap ctx={ctx} /><JobsArea ctx={ctx} /><HowItWorks /><TrustAndCta ctx={ctx} /><Stats ctx={ctx} /><CareerAdvice /></Box>;
}
