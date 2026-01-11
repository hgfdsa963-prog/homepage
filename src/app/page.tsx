"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/home.module.css";

type MonthStats = {
  male: number;
  female: number;
  total: number;
};

const ADMIN_CLICK_COUNT = 5;
const CLICK_TIMEOUT = 2000;

const HomePage = (): React.ReactElement => {
  const router = useRouter();
  const [stats, setStats] = useState<MonthStats | null>(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleClick = useCallback((): void => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= ADMIN_CLICK_COUNT) {
      clickCountRef.current = 0;
      router.push("/admin");
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, CLICK_TIMEOUT);
  }, [router]);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        const res = await fetch(`/api/status?month=${month}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // 통계 로드 실패 시 무시
      }
    };
    fetchStats();
  }, []);

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <span className={styles.heroEmoji}>💝</span>
        <h1 className={styles.title} onClick={handleTitleClick}>
          블라인드 소개팅
        </h1>
        <p className={styles.subtitle}>
          &ldquo;대충 아무나&rdquo;가 아니라,
          <br />
          최소한의 정보로 최대한 정성껏 매칭해보는 실험이에요.
        </p>
      </section>

      {/* Process Card */}
      <section className={styles.processCard}>
        <h2 className={styles.processTitle}>
          <span>✨</span> 진행 방식
        </h2>
        <ol className={styles.processList}>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepText}>간단한 신청서 작성</span>
          </li>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepText}>조건/성향 간단 검토</span>
          </li>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepText}>매칭 가능 시에만 연락</span>
          </li>
        </ol>
      </section>

      {/* CTA Buttons */}
      <div className={styles.ctaSection}>
        <Link
          href="/apply"
          className={`${styles.ctaButton} ${styles.ctaPrimary}`}
        >
          💌 신청하러 가기
        </Link>
        <Link
          href="/calendar"
          className={`${styles.ctaButton} ${styles.ctaSecondary}`}
        >
          📅 신청 현황 보기
        </Link>
      </div>

      {/* Stats Preview */}
      {stats && (
        <div className={styles.statsPreview}>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>👨</div>
            <div className={styles.statValue}>{stats.male}</div>
            <div className={styles.statLabel}>이번 달 남성</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>👩</div>
            <div className={styles.statValue}>{stats.female}</div>
            <div className={styles.statLabel}>이번 달 여성</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>💕</div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>총 신청자</div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h3 className={styles.faqTitle}>
          <span>💬</span> 자주 묻는 질문
        </h3>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 신청하면 무조건 연락 오나요?</p>
          <p className={styles.faqAnswer}>
            A. 아니요, 매칭 가능성이 있을 때만 연락드려요. 무응답이면… 마음의
            박수 한 번만 보내주세요 👏
          </p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 개인정보는 어떻게 되나요?</p>
          <p className={styles.faqAnswer}>
            A. 매칭 목적으로만 사용하고, 매칭 완료 후 일정 기간 뒤 삭제해요.
          </p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 비용이 있나요?</p>
          <p className={styles.faqAnswer}>
            A. 파일럿 기간 동안은 무료예요! 잘 되면 정식 오픈, 안 되면… 우리만의
            흑역사로 봉인 🔒
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        Made with 💕 for better connections
      </footer>
    </main>
  );
};

export default HomePage;
