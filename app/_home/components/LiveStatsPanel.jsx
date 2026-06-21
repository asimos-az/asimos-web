"use client";

import styles from "./LiveStatsPanel.module.css";

function getNumber(...values) {
  for (const value of values) {
    const numberValue = Number(value || 0);
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue;
  }

  return 0;
}

export default function LiveStatsPanel({ siteStats }) {
  const last28DaysValue = getNumber(
    siteStats?.visitsLast28Days,
    siteStats?.visits_last_28_days,
    siteStats?.last28DaysVisits,
    siteStats?.last_28_days_visits,
    siteStats?.visits28d,
    siteStats?.visitsThisMonth,
  );

  const items = [
    {
      key: "active-jobs",
      icon: "💼",
      value: getNumber(siteStats?.activeJobs, siteStats?.active_jobs),
      label: "Aktiv elan",
    },
    {
      key: "today-visits",
      icon: "📅",
      value: getNumber(siteStats?.visitsToday, siteStats?.visits_today),
      label: "Bugünkü ziyarətçi",
    },
    {
      key: "online-users",
      icon: "🟢",
      value: getNumber(siteStats?.onlineUsers, siteStats?.online_users),
      label: "Onlayn istifadəçi",
    },
    {
      key: "last-28-days",
      icon: "📈",
      value: last28DaysValue,
      label: "Son 28 gündə daxil olan",
    },
  ];

  return (
    <section className={`container page-section ${styles.section}`}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span aria-hidden="true">📊</span>
            Canlı Performans Göstəriciləri
          </h2>

          <span className={styles.liveBadge}>
            <i aria-hidden="true" />
            Canlı
          </span>
        </div>

        <div className={styles.metrics}>
          {items.map((item) => (
            <div className={styles.metric} key={item.key}>
              <span className={styles.metricIcon} aria-hidden="true">
                {item.icon}
              </span>
              <strong>{Number(item.value || 0).toLocaleString("az-AZ")}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
