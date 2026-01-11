"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

const AdminPage = (): React.ReactElement => {
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StatusType>("all");

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

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
  }, []);

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
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>🔐 관리자 로그인</h1>
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
            <span className={styles.titleEmoji}>👑</span>
            <h1 className={styles.title}>관리자 대시보드</h1>
          </div>
          <p className={styles.subtitle}>신청자 현황 관리</p>
        </div>
      </header>

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
        <button onClick={fetchApplications} className={styles.refreshButton}>
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
                              updateStatus({ id: app.id, status: "confirmed" })
                            }
                          >
                            확정
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.actionReject}`}
                            onClick={() =>
                              updateStatus({ id: app.id, status: "rejected" })
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                <span className={styles.detailValue}>{selectedApp.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>나이</span>
                <span className={styles.detailValue}>{selectedApp.age}세</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>성별</span>
                <span className={styles.detailValue}>{selectedApp.gender}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>연락처</span>
                <span className={styles.detailValue}>{selectedApp.phone}</span>
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
                      updateStatus({ id: selectedApp.id, status: "confirmed" })
                    }
                  >
                    ✅ 확정
                  </button>
                  <button
                    className={`${styles.modalButton} ${styles.modalButtonReject}`}
                    onClick={() =>
                      updateStatus({ id: selectedApp.id, status: "rejected" })
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
    </main>
  );
};

export default AdminPage;
