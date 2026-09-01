"use client";

import EmployerProfilePanel from "./profile/EmployerProfilePanel";
import SeekerProfilePanel from "./profile/SeekerProfilePanel";

export default function ProfileSection({ ctx }) {
  if (ctx.activeSection !== "profile") return null;
  if (ctx.roleName === "employer") return <EmployerProfilePanel ctx={ctx} />;
  return <SeekerProfilePanel ctx={ctx} />;
}
