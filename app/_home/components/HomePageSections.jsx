import AlertsSection from "./home-sections/AlertsSection";
import AuthSectionView from "./home-sections/AuthSectionView";
import CreateJobSection from "./home-sections/CreateJobSection";
import HomeLandingSection from "./home-sections/HomeLandingSection";
import HomeSearchSection from "./home-sections/HomeSearchSection";
import JobsSection from "./home-sections/JobsSection";
import NotificationsSection from "./home-sections/NotificationsSection";
import ProfileSection from "./home-sections/ProfileSection";
import RoleSwitchConfirmModal from "./home-sections/RoleSwitchConfirmModal";
import SupportPageSection from "./home-sections/SupportPageSection";
import TermsSection from "./home-sections/TermsSection";
import HomepageRedesign from "./redesign/HomepageRedesign";
import DiscoveryPages from "./home-sections/DiscoveryPages";

export default function HomePageSections({ ctx }) {
  return (
    <>
      <HomepageRedesign ctx={ctx} />
      <DiscoveryPages ctx={ctx} />
      {ctx.activeSection !== "home" ? <HomeSearchSection ctx={ctx} /> : null}
      {ctx.activeSection !== "home" ? <HomeLandingSection ctx={ctx} /> : null}
      <JobsSection ctx={ctx} />
      <CreateJobSection ctx={ctx} />
      <AlertsSection ctx={ctx} />
      <NotificationsSection ctx={ctx} />
      <ProfileSection ctx={ctx} />
      <SupportPageSection ctx={ctx} />
      <TermsSection ctx={ctx} />
      <AuthSectionView ctx={ctx} />
      <RoleSwitchConfirmModal ctx={ctx} />
    </>
  );
}
