"use client";

import dynamic from "next/dynamic";

const HomeJobsMap = dynamic(() => import("../../components/JobsMap"), {
  ssr: false,
  loading: () => (
    <section className="container page-section jobs-map-section">
      <header className="section-head jobs-map-head">
        <h2>Elanların xəritədə görünüşü</h2>
        <p>Xəritə yüklənir...</p>
      </header>
      <div className="jobs-map-shell card"><p className="jobs-map-empty">Xəritə modulu hazırlanır.</p></div>
    </section>
  ),
});

export default HomeJobsMap;
