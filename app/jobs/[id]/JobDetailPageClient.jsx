"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { clearAuthToken } from "../../../lib/api";
import { clearAuth, loadAuth } from "../../../lib/auth-store";
import JobDetail from "../../components/JobDetail";

const guestNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
  { key: "terms", label: "Qaydalar" },
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
  { key: "create", label: "Elan yarat" },
  { key: "alerts", label: "Bildirişlər" },
  { key: "notifications", label: "Push" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Dəstək" },
  { key: "terms", label: "Qaydalar" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Bazadakı işlər" },
  { key: "myJobs", label: "Mənim elanlar" },
  { key: "create", label: "Elan yarat" },
  { key: "notifications", label: "Bildirişlər" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Dəstək" },
  { key: "terms", label: "Qaydalar" },
];

function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
}

export default function JobDetailPageClient({ job, error }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = loadAuth();
    if (saved?.user) {
      setUser(saved.user);
    }
  }, []);

  const navItems = useMemo(() => {
    const roleName = normalizeRole(user?.role);
    return roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;
  }, [user]);

  function handleNavigate(section) {
    if (section === "home") {
      router.push("/");
      return;
    }

    if (section === "terms") {
      router.push("/policy");
      return;
    }

    router.push(`/?section=${section}`);
  }

  function handleSignOut() {
    setUser(null);
    clearAuthToken();
    clearAuth();
    router.push("/");
  }

  return (
    <>
      <Header
        activeSection="jobs"
        setActiveSection={handleNavigate}
        navItems={navItems}
        user={user}
        handleSignOut={handleSignOut}
      />
      {error ? (
        <section className="container page-section">
          <p className="notice error">{error}</p>
        </section>
      ) : (
        <JobDetail job={job} mode="page" />
      )}
    </>
  );
}