"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "@/styles/admin.module.css";

type Application = {
  id: number;
  name: string;
  age: number;
  gender: "남" | "여" | "기타";
  phone: string;
  kakao_id: string | null;
  location: string | null;
  preferred_gender: string | null;
  note: string | null;
  desired_date: string | null;
  status: "pending" | "confirmed" | "matched" | "rejected";
  admin_note: string | null;
  created_at: string;
};

type StatusType = "all" | "pending" | "confirmed" | "matched" | "rejected";
type TabType = "applications" | "settings";
type SettingsSubTab = "date" | "weekday";

type DateSetting = {
  date: string;
  max_male: number;
  max_female: number;
};

type WeekdaySetting = {
  weekday: number;
  max_male: number;
  max_female: number;
};

const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABELS: Record<string, string> = {
  pending: "대기중",
  confirmed: "확정",
  matched: "매칭완료",
  rejected: "거절",
};

const STATUS_EMOJI: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  matched: "💕",
  rejected: "❌",
};

const FALLBACK_DEFAULT_MAX = 4;

const AdminPage = (): React.ReactElement => {
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<TabType>("applications");

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StatusType>("all");

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // 설정 서브탭
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("date");

  // 날짜 설정 관련 상태
  const [dateSettings, setDateSettings] = useState<DateSetting[]>([]);
  const [newSettingDate, setNewSettingDate] = useState("");
  const [defaultMax, setDefaultMax] = useState(FALLBACK_DEFAULT_MAX);
  const [newSettingMaxMale, setNewSettingMaxMale] =
    useState(FALLBACK_DEFAULT_MAX);
  const [newSettingMaxFemale, setNewSettingMaxFemale] =
    useState(FALLBACK_DEFAULT_MAX);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // 요일 설정 관련 상태
  const [weekdaySettings, setWeekdaySettings] = useState<WeekdaySetting[]>([]);
  const [newWeekday, setNewWeekday] = useState(1);
  const [newWeekdayMaxMale, setNewWeekdayMaxMale] =
    useState(FALLBACK_DEFAULT_MAX);
  const [newWeekdayMaxFemale, setNewWeekdayMaxFemale] =
    useState(FALLBACK_DEFAULT_MAX);

  const fetchApplications = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);

    try {
      const statusParam =
        filterStatus === "all" ? "" : `?status=${filterStatus}`;
      const res = await fetch(`/api/admin/applications${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setIsLoggedIn(false);
        setLoginError("토큰이 만료되었거나 유효하지 않습니다.");
        return;
      }

      const json = await res.json();
      console.log("API Response:", json);
      if (json.ok) {
        setApplications(json.data || []);
      } else {
        console.error("API Error:", json.message);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplications();
    }
  }, [isLoggedIn, filterStatus, fetchApplications]);

  const handleLogin = useCallback((): void => {
    if (!token.trim()) {
      setLoginError("토큰을 입력해주세요.");
      return;
    }
    setLoginError("");
    setIsLoggedIn(true);
  }, [token]);

  const handleLogout = useCallback((): void => {
    setIsLoggedIn(false);
    setToken("");
    setApplications([]);
    setDateSettings([]);
  }, []);

  // 날짜 설정 조회
  const fetchDateSettings = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsSettingsLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setDateSettings(json.data ?? []);
        if (json.defaultMaxPerGender) {
          setDefaultMax(json.defaultMaxPerGender);
          setNewSettingMaxMale(json.defaultMaxPerGender);
          setNewSettingMaxFemale(json.defaultMaxPerGender);
        }
      }
    } catch {
      console.error("Failed to fetch settings");
    } finally {
      setIsSettingsLoading(false);
    }
  }, [token]);

  // 날짜 설정 저장
  const saveSettings = useCallback(
    async ({
      date,
      maxMale,
      maxFemale,
    }: {
      date: string;
      maxMale: number;
      maxFemale: number;
    }): Promise<void> => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date, maxMale, maxFemale }),
        });

        if (res.ok) {
          fetchDateSettings();
          setNewSettingDate("");
          setNewSettingMaxMale(defaultMax);
          setNewSettingMaxFemale(defaultMax);
        }
      } catch {
        console.error("Failed to save settings");
      }
    },
    [token, fetchDateSettings, defaultMax]
  );

  // 날짜 설정 삭제
  const deleteSettings = useCallback(
    async (date: string): Promise<void> => {
      if (
        !confirm(
          `${date} 설정을 삭제하시겠습니까? (기본값 ${defaultMax}명으로 복원)`
        )
      )
        return;

      try {
        const res = await fetch(`/api/admin/settings?date=${date}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setDateSettings((prev) => prev.filter((s) => s.date !== date));
        }
      } catch {
        console.error("Failed to delete settings");
      }
    },
    [token, defaultMax]
  );

  // 요일 설정 조회
  const fetchWeekdaySettings = useCallback(async (): Promise<void> => {
    if (!token) return;

    try {
      const res = await fetch("/api/admin/settings?type=weekday", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setWeekdaySettings(json.data ?? []);
        if (json.defaultMaxPerGender) {
          setDefaultMax(json.defaultMaxPerGender);
          setNewWeekdayMaxMale(json.defaultMaxPerGender);
          setNewWeekdayMaxFemale(json.defaultMaxPerGender);
        }
      }
    } catch {
      console.error("Failed to fetch weekday settings");
    }
  }, [token]);

  // 요일 설정 저장
  const saveWeekdaySettings = useCallback(
    async ({
      weekday,
      maxMale,
      maxFemale,
    }: {
      weekday: number;
      maxMale: number;
      maxFemale: number;
    }): Promise<void> => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "weekday",
            weekday,
            maxMale,
            maxFemale,
          }),
        });

        if (res.ok) {
          fetchWeekdaySettings();
          setNewWeekday(1);
          setNewWeekdayMaxMale(defaultMax);
          setNewWeekdayMaxFemale(defaultMax);
        }
      } catch {
        console.error("Failed to save weekday settings");
      }
    },
    [token, fetchWeekdaySettings, defaultMax]
  );

  // 요일 설정 삭제
  const deleteWeekdaySettings = useCallback(
    async (weekday: number): Promise<void> => {
      if (
        !confirm(
          `${WEEKDAY_NAMES[weekday]}요일 설정을 삭제하시겠습니까? (기본값 ${defaultMax}명으로 복원)`
        )
      )
        return;

      try {
        const res = await fetch(`/api/admin/settings?weekday=${weekday}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setWeekdaySettings((prev) =>
            prev.filter((s) => s.weekday !== weekday)
          );
        }
      } catch {
        console.error("Failed to delete weekday settings");
      }
    },
    [token, defaultMax]
  );

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && activeTab === "settings") {
      if (settingsSubTab === "date") {
        fetchDateSettings();
      } else {
        fetchWeekdaySettings();
      }
    }
  }, [
    isLoggedIn,
    activeTab,
    settingsSubTab,
    fetchDateSettings,
    fetchWeekdaySettings,
  ]);

  const updateStatus = useCallback(
    async ({
      id,
      status,
    }: {
      id: number;
      status: "pending" | "confirmed" | "matched" | "rejected";
    }): Promise<void> => {
      try {
        const res = await fetch("/api/admin/applications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, status }),
        });

        if (res.ok) {
          setApplications((prev) =>
            prev.map((app) => (app.id === id ? { ...app, status } : app))
          );
          if (selectedApp?.id === id) {
            setSelectedApp((prev) => (prev ? { ...prev, status } : null));
          }
        }
      } catch {
        console.error("Update failed");
      }
    },
    [token, selectedApp]
  );

  const deleteApplication = useCallback(
    async (id: number): Promise<void> => {
      if (!confirm("정말 삭제하시겠습니까?")) return;

      try {
        const res = await fetch(`/api/admin/applications?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setApplications((prev) => prev.filter((app) => app.id !== id));
          if (selectedApp?.id === id) {
            setSelectedApp(null);
          }
        }
      } catch {
        console.error("Delete failed");
      }
    },
    [token, selectedApp]
  );

  const summary = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, matched: 0, rejected: 0 };
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    return counts;
  }, [applications]);

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <main className={styles.container}>
        <Link href="/" className={styles.homeLink}>
          🍷 정담 서울
        </Link>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>🔐 정담 서울 관리자</h1>
          <p className={styles.loginSubtitle}>관리자 토큰을 입력해주세요</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin Token"
            className={styles.loginInput}
          />
          <button onClick={handleLogin} className={styles.loginButton}>
            로그인
          </button>
          {loginError && <p className={styles.loginError}>{loginError}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <span className={styles.titleEmoji}>🍷</span>
            <h1 className={styles.title}>정담 서울 관리</h1>
          </div>
          <p className={styles.subtitle}>JEONGDAM SEOUL ADMIN</p>
        </div>
        <Link href="/" className={styles.homeLink}>
          🍷 정담 서울
        </Link>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "applications" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("applications")}
        >
          📋 신청자 관리
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "settings" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ 날짜 설정
        </button>
      </div>

      {activeTab === "applications" && (
        <>
          {/* Controls */}
          <div className={styles.controls}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusType)}
              className={styles.filterSelect}
            >
              <option value="all">전체 보기</option>
              <option value="pending">⏳ 대기중</option>
              <option value="confirmed">✅ 확정</option>
              <option value="matched">💕 매칭완료</option>
              <option value="rejected">❌ 거절</option>
            </select>
            <button
              onClick={fetchApplications}
              className={styles.refreshButton}
            >
              🔄 새로고침
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              로그아웃
            </button>
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.pending}</div>
              <div className={styles.summaryLabel}>⏳ 대기중</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.confirmed}</div>
              <div className={styles.summaryLabel}>✅ 확정</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.matched}</div>
              <div className={styles.summaryLabel}>💕 매칭완료</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.rejected}</div>
              <div className={styles.summaryLabel}>❌ 거절</div>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loading}>불러오는 중...</div>
            ) : applications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyEmoji}>📭</div>
                <p className={styles.emptyText}>신청자가 없습니다</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>성별</th>
                    <th>이름</th>
                    <th>나이</th>
                    <th>연락처</th>
                    <th>희망일</th>
                    <th>신청일</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            app.status === "pending"
                              ? styles.statusPending
                              : app.status === "confirmed"
                              ? styles.statusConfirmed
                              : app.status === "matched"
                              ? styles.statusMatched
                              : styles.statusRejected
                          }`}
                        >
                          {STATUS_EMOJI[app.status]} {STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.genderBadge} ${
                            app.gender === "남"
                              ? styles.genderMale
                              : app.gender === "여"
                              ? styles.genderFemale
                              : styles.genderOther
                          }`}
                        >
                          {app.gender === "남"
                            ? "♂"
                            : app.gender === "여"
                            ? "♀"
                            : "?"}
                        </span>
                      </td>
                      <td
                        style={{ cursor: "pointer", fontWeight: 600 }}
                        onClick={() => setSelectedApp(app)}
                      >
                        {app.name}
                      </td>
                      <td>{app.age}세</td>
                      <td>{app.phone}</td>
                      <td>{app.desired_date || "-"}</td>
                      <td>{formatDate(app.created_at)}</td>
                      <td>
                        <div className={styles.actions}>
                          {app.status === "pending" && (
                            <>
                              <button
                                className={`${styles.actionButton} ${styles.actionConfirm}`}
                                onClick={() =>
                                  updateStatus({
                                    id: app.id,
                                    status: "confirmed",
                                  })
                                }
                              >
                                확정
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.actionReject}`}
                                onClick={() =>
                                  updateStatus({
                                    id: app.id,
                                    status: "rejected",
                                  })
                                }
                              >
                                거절
                              </button>
                            </>
                          )}
                          {app.status === "confirmed" && (
                            <button
                              className={`${styles.actionButton} ${styles.actionMatch}`}
                              onClick={() =>
                                updateStatus({ id: app.id, status: "matched" })
                              }
                            >
                              매칭
                            </button>
                          )}
                          <button
                            className={`${styles.actionButton} ${styles.actionDelete}`}
                            onClick={() => deleteApplication(app.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail Modal */}
          {selectedApp && (
            <div
              className={styles.modalOverlay}
              onClick={() => setSelectedApp(null)}
            >
              <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>📋 신청 상세</h2>
                  <button
                    className={styles.modalClose}
                    onClick={() => setSelectedApp(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>상태</span>
                    <span className={styles.detailValue}>
                      {STATUS_EMOJI[selectedApp.status]}{" "}
                      {STATUS_LABELS[selectedApp.status]}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>이름</span>
                    <span className={styles.detailValue}>
                      {selectedApp.name}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>나이</span>
                    <span className={styles.detailValue}>
                      {selectedApp.age}세
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>성별</span>
                    <span className={styles.detailValue}>
                      {selectedApp.gender}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>연락처</span>
                    <span className={styles.detailValue}>
                      {selectedApp.phone}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>카카오톡</span>
                    <span className={styles.detailValue}>
                      {selectedApp.kakao_id || "-"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>활동 지역</span>
                    <span className={styles.detailValue}>
                      {selectedApp.location || "-"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>선호 조건</span>
                    <span className={styles.detailValue}>
                      {selectedApp.preferred_gender || "-"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>희망 날짜</span>
                    <span className={styles.detailValue}>
                      {selectedApp.desired_date || "-"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>메모</span>
                    <span className={styles.detailValue}>
                      {selectedApp.note || "-"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>신청일시</span>
                    <span className={styles.detailValue}>
                      {new Date(selectedApp.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  {selectedApp.status === "pending" && (
                    <>
                      <button
                        className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                        onClick={() =>
                          updateStatus({
                            id: selectedApp.id,
                            status: "confirmed",
                          })
                        }
                      >
                        ✅ 확정
                      </button>
                      <button
                        className={`${styles.modalButton} ${styles.modalButtonReject}`}
                        onClick={() =>
                          updateStatus({
                            id: selectedApp.id,
                            status: "rejected",
                          })
                        }
                      >
                        ❌ 거절
                      </button>
                    </>
                  )}
                  {selectedApp.status === "confirmed" && (
                    <button
                      className={`${styles.modalButton} ${styles.modalButtonMatch}`}
                      onClick={() =>
                        updateStatus({ id: selectedApp.id, status: "matched" })
                      }
                    >
                      💕 매칭완료
                    </button>
                  )}
                  <button
                    className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                    onClick={() => setSelectedApp(null)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className={styles.settingsSection}>
          <h2 className={styles.settingsTitle}>⚙️ 최대 인원 설정</h2>
          <p className={styles.settingsDesc}>
            기본값은 성별별 {defaultMax}명입니다. 우선순위: 특정 날짜 {">"} 요일
            {">"} 기본값
          </p>

          {/* 서브탭 */}
          <div className={styles.subTabs}>
            <button
              className={`${styles.subTab} ${
                settingsSubTab === "date" ? styles.subTabActive : ""
              }`}
              onClick={() => setSettingsSubTab("date")}
            >
              📅 날짜별 설정
            </button>
            <button
              className={`${styles.subTab} ${
                settingsSubTab === "weekday" ? styles.subTabActive : ""
              }`}
              onClick={() => setSettingsSubTab("weekday")}
            >
              🗓️ 요일별 설정
            </button>
          </div>

          {/* 날짜별 설정 */}
          {settingsSubTab === "date" && (
            <>
              <div className={styles.settingsForm}>
                <input
                  type="date"
                  value={newSettingDate}
                  onChange={(e) => setNewSettingDate(e.target.value)}
                  className={styles.settingsInput}
                  min={new Date().toISOString().split("T")[0]}
                />
                <div className={styles.settingsInputGroup}>
                  <label>남성</label>
                  <input
                    type="number"
                    value={newSettingMaxMale}
                    onChange={(e) =>
                      setNewSettingMaxMale(Number(e.target.value))
                    }
                    className={styles.settingsNumberInput}
                    min={0}
                    max={99}
                  />
                </div>
                <div className={styles.settingsInputGroup}>
                  <label>여성</label>
                  <input
                    type="number"
                    value={newSettingMaxFemale}
                    onChange={(e) =>
                      setNewSettingMaxFemale(Number(e.target.value))
                    }
                    className={styles.settingsNumberInput}
                    min={0}
                    max={99}
                  />
                </div>
                <button
                  onClick={() =>
                    saveSettings({
                      date: newSettingDate,
                      maxMale: newSettingMaxMale,
                      maxFemale: newSettingMaxFemale,
                    })
                  }
                  disabled={!newSettingDate}
                  className={styles.settingsSaveButton}
                >
                  저장
                </button>
              </div>

              <div className={styles.settingsList}>
                {isSettingsLoading ? (
                  <div className={styles.loading}>불러오는 중...</div>
                ) : dateSettings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyEmoji}>📝</div>
                    <p className={styles.emptyText}>
                      설정된 날짜가 없습니다. 요일 설정 또는 기본값({defaultMax}
                      명)이 적용됩니다.
                    </p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>남성 최대</th>
                        <th>여성 최대</th>
                        <th>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateSettings.map((setting) => (
                        <tr key={setting.date}>
                          <td>{setting.date}</td>
                          <td>{setting.max_male}명</td>
                          <td>{setting.max_female}명</td>
                          <td>
                            <button
                              className={`${styles.actionButton} ${styles.actionDelete}`}
                              onClick={() => deleteSettings(setting.date)}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* 요일별 설정 */}
          {settingsSubTab === "weekday" && (
            <>
              <div className={styles.settingsForm}>
                <select
                  value={newWeekday}
                  onChange={(e) => setNewWeekday(Number(e.target.value))}
                  className={styles.settingsSelect}
                >
                  {WEEKDAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}요일
                    </option>
                  ))}
                </select>
                <div className={styles.settingsInputGroup}>
                  <label>남성</label>
                  <input
                    type="number"
                    value={newWeekdayMaxMale}
                    onChange={(e) =>
                      setNewWeekdayMaxMale(Number(e.target.value))
                    }
                    className={styles.settingsNumberInput}
                    min={0}
                    max={99}
                  />
                </div>
                <div className={styles.settingsInputGroup}>
                  <label>여성</label>
                  <input
                    type="number"
                    value={newWeekdayMaxFemale}
                    onChange={(e) =>
                      setNewWeekdayMaxFemale(Number(e.target.value))
                    }
                    className={styles.settingsNumberInput}
                    min={0}
                    max={99}
                  />
                </div>
                <button
                  onClick={() =>
                    saveWeekdaySettings({
                      weekday: newWeekday,
                      maxMale: newWeekdayMaxMale,
                      maxFemale: newWeekdayMaxFemale,
                    })
                  }
                  className={styles.settingsSaveButton}
                >
                  저장
                </button>
              </div>

              <div className={styles.settingsList}>
                {isSettingsLoading ? (
                  <div className={styles.loading}>불러오는 중...</div>
                ) : weekdaySettings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyEmoji}>📝</div>
                    <p className={styles.emptyText}>
                      설정된 요일이 없습니다. 모든 요일은 기본값({defaultMax}
                      명)이 적용됩니다.
                    </p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>요일</th>
                        <th>남성 최대</th>
                        <th>여성 최대</th>
                        <th>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekdaySettings.map((setting) => (
                        <tr key={setting.weekday}>
                          <td>{WEEKDAY_NAMES[setting.weekday]}요일</td>
                          <td>{setting.max_male}명</td>
                          <td>{setting.max_female}명</td>
                          <td>
                            <button
                              className={`${styles.actionButton} ${styles.actionDelete}`}
                              onClick={() =>
                                deleteWeekdaySettings(setting.weekday)
                              }
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
};

export default AdminPage;
