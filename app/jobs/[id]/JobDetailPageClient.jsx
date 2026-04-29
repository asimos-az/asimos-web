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
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
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
  const roleName = normalizeRole(user?.role);
  const canCreateJob = roleName === "employer";

  useEffect(() => {
    const saved = loadAuth();
    if (saved?.user) {
      setUser(saved.user);
    }
  }, []);

  const navItems = useMemo(() => {
    return roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;
  }, [roleName]);

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
        canCreateJob={canCreateJob}
      />
      {error ? (
        <section className="container page-section">
          <p className="notice error">{error}</p>
        </section>
      ) : (
        <JobDetail job={job} mode="page" user={user} />
      )}
    </>
  );
}
