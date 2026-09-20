"use client";

export default function MapSection({ ctx }) {
  if (ctx.activeSection !== "map") return null;

  const isEmployer = ctx.user?.role === "employer";
  return (
    <main className="full-map-page">
      <ctx.JobsMap
        jobs={ctx.allJobs || []}
        seekers={isEmployer ? ctx.seekersOnMap : []}
        showSeekers={isEmployer}
        focusedJobId={null}
        userLocation={ctx.effectiveLocation}
      />
    </main>
  );
}
