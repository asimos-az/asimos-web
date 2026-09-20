"use client";

export default function MapSection({ ctx }) {
  if (ctx.activeSection !== "map") return null;

  const isAuthenticated = Boolean(ctx.user);
  return (
    <main className="full-map-page">
      <ctx.JobsMap
        jobs={ctx.allJobs || []}
        seekers={isAuthenticated ? ctx.seekersOnMap : []}
        showSeekers={isAuthenticated}
        focusedJobId={null}
        userLocation={ctx.effectiveLocation}
      />
    </main>
  );
}
