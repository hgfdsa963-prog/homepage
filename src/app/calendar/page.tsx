"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import styles from "@/styles/dashboard.module.css";

type Stats = {
  ok: boolean;
  month: string;
  byDate: Record<
    string,
    { 남: number; 여: number; 기타: number; total: number }
  >;
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const formatMonth = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const CalendarPage = (): React.ReactElement => {
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async (targetMonth: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/status?month=${targetMonth}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch {
      // 로드 실패 시 무시
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(month);
  }, [month, loadStats]);

  const navigateMonth = useCallback((direction: -1 | 1): void => {
    setMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const newDate = new Date(y, m - 1 + direction, 1);
      return formatMonth(newDate);
    });
  }, []);

  const calendar = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();

    const cells: Array<{ date: string | null }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, "0");
      cells.push({ date: `${month}-${dd}` });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [month]);

  const summary = useMemo(() => {
    if (!stats?.byDate) return { male: 0, female: 0, total: 0 };
    let male = 0;
    let female = 0;
    let total = 0;
    Object.values(stats.byDate).forEach((v) => {
      male += v.남;
      female += v.여;
      total += v.total;
    });
    return { male, female, total };
  }, [stats]);

  const displayMonth = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return `${y}년 ${m}월`;
  }, [month]);

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <span className={styles.titleEmoji}>📅</span>
            <h1 className={styles.title}>예약 현황</h1>
          </div>
          <p className={styles.subtitle}>
            희망 날짜별 신청 현황입니다. 날짜 미선택자는 표시되지 않습니다.
          </p>
        </div>
        <Link href="/" className={styles.backLink}>
          ← 정담 서울
        </Link>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.navButton}
          onClick={() => navigateMonth(-1)}
          type="button"
        >
          ◀
        </button>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={styles.monthInput}
        />
        <button
          className={styles.navButton}
          onClick={() => navigateMonth(1)}
          type="button"
        >
          ▶
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconMale}`}>👨</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{summary.male}</div>
            <div className={styles.summaryLabel}>{displayMonth} 남성</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconFemale}`}>👩</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{summary.female}</div>
            <div className={styles.summaryLabel}>{displayMonth} 여성</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconTotal}`}>💕</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{summary.total}</div>
            <div className={styles.summaryLabel}>총 신청자</div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          {DAYS.map((day) => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {calendar.map((cell, i) => {
            const data = cell.date ? stats?.byDate?.[cell.date] : null;
            const hasData = data && data.total > 0;

            return (
              <div
                key={i}
                className={`${styles.dayCell} ${
                  !cell.date
                    ? styles.dayCellEmpty
                    : hasData
                      ? styles.dayCellHasData
                      : ""
                }`}
              >
                <div className={styles.dayNumber}>
                  {cell.date ? Number(cell.date.slice(-2)) : ""}
                </div>

                {cell.date && (
                  <div className={styles.dayStats}>
                    {hasData ? (
                      <>
                        <div className={styles.statRow}>
                          <span className={styles.statMale}>♂ {data.남}</span>
                          <span className={styles.statFemale}>♀ {data.여}</span>
                        </div>
                        {data.기타 > 0 && (
                          <div className={styles.statTotal}>
                            기타 {data.기타}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={styles.noData}>—</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendMale}`} />
            <span>남성</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendFemale}`} />
            <span>여성</span>
          </div>
        </div>

        {/* Loading / No Data */}
        {isLoading && (
          <div className={styles.noDataMessage}>
            <div className={styles.noDataEmoji}>⏳</div>
            <p className={styles.noDataText}>불러오는 중...</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default CalendarPage;
