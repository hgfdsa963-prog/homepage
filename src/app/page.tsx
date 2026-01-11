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
        <span className={styles.heroEmoji}>🍷</span>
        <h1 className={styles.title} onClick={handleTitleClick}>
          정담 서울
        </h1>
        <p className={styles.brandTagline}>JEONGDAM SEOUL</p>
        <p className={styles.subtitle}>
          잔을 기울이며 나누는 진솔한 대화,
          <br />
          서울 한복판에서 만나는 특별한 인연.
        </p>
      </section>

      {/* Intro Section */}
      <section className={styles.introSection}>
        <p className={styles.introText}>
          정담(情談)은 &apos;정을 나누는 대화&apos;라는 뜻입니다.
          <br />
          바쁜 일상 속, 깊은 대화를 나눌 수 있는
          <br />
          프라이빗한 공간에서 새로운 인연을 만나보세요.
        </p>
      </section>

      {/* Process Card */}
      <section className={styles.processCard}>
        <h2 className={styles.processTitle}>
          <span>✨</span> 어떻게 진행되나요?
        </h2>
        <ol className={styles.processList}>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepContent}>
              <span className={styles.stepText}>간편 신청</span>
              <span className={styles.stepDesc}>
                기본 정보와 희망 일정을 알려주세요
              </span>
            </div>
          </li>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepContent}>
              <span className={styles.stepText}>맞춤 매칭</span>
              <span className={styles.stepDesc}>
                취향과 조건을 고려해 신중하게 매칭해요
              </span>
            </div>
          </li>
          <li className={styles.processItem}>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepContent}>
              <span className={styles.stepText}>정남에서 만남</span>
              <span className={styles.stepDesc}>
                분위기 좋은 술집에서 대화를 나눠보세요
              </span>
            </div>
          </li>
        </ol>
      </section>

      {/* CTA Buttons */}
      <div className={styles.ctaSection}>
        <Link
          href="/apply"
          className={`${styles.ctaButton} ${styles.ctaPrimary}`}
        >
          🥂 만남 신청하기
        </Link>
        <Link
          href="/calendar"
          className={`${styles.ctaButton} ${styles.ctaSecondary}`}
        >
          📅 예약 현황 보기
        </Link>
      </div>

      {/* Stats Preview */}
      {stats && (
        <div className={styles.statsPreview}>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>🤵</div>
            <div className={styles.statValue}>{stats.male}</div>
            <div className={styles.statLabel}>이번 달 신사</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>👗</div>
            <div className={styles.statValue}>{stats.female}</div>
            <div className={styles.statLabel}>이번 달 숙녀</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statEmoji}>🍷</div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>총 신청자</div>
          </div>
        </div>
      )}

      {/* Features */}
      <section className={styles.featuresSection}>
        <h3 className={styles.featuresTitle}>
          <span>🏮</span> 정담 서울이 특별한 이유
        </h3>
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🛋️</span>
            <span className={styles.featureText}>프라이빗한 공간</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🍸</span>
            <span className={styles.featureText}>시그니처 웰컴 드링크</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🎯</span>
            <span className={styles.featureText}>1:1 맞춤 매칭</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔒</span>
            <span className={styles.featureText}>철저한 정보 보호</span>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className={styles.locationSection}>
        <h3 className={styles.locationTitle}>
          <span>📍</span> 만남 장소
        </h3>
        <div className={styles.locationCard}>
          <div className={styles.locationInfo}>
            <div className={styles.locationName}>정남 (正南)</div>
            <div className={styles.locationDesc}>정담 서울의 파트너 술집</div>
            <div className={styles.locationAddress}>
              대구 중구 중앙대로77길 36 1층
            </div>
            <div className={styles.locationMeta}>
              <span>🚇 반월당역 15번 출구 도보 2분</span>
            </div>
            <div className={styles.locationMeta}>
              <span>🕗 PM 7:00 - AM 2:00</span>
            </div>
          </div>

          <a
            href="https://naver.me/GCvfr7UP"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.locationButton}
          >
            🗺️ 네이버 지도에서 보기
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h3 className={styles.faqTitle}>
          <span>💬</span> 자주 묻는 질문
        </h3>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 신청하면 무조건 매칭되나요?</p>
          <p className={styles.faqAnswer}>
            A. 양측 조건이 맞을 때만 매칭을 진행해요. 무리한 매칭보다 퀄리티
            있는 만남을 추구합니다.
          </p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 장소는 어디인가요?</p>
          <p className={styles.faqAnswer}>
            A. 대구 반월당에 위치한 &apos;정남&apos;에서 진행해요. 분위기 좋은
            술집에서 편하게 대화 나눠보세요.
          </p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 비용이 있나요?</p>
          <p className={styles.faqAnswer}>
            A. 현재 오픈 기념 무료로 진행 중이에요. 음료 비용은 각자 부담입니다.
          </p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>Q. 개인정보는 안전한가요?</p>
          <p className={styles.faqAnswer}>
            A. 매칭 목적으로만 사용하며, 매칭 완료 후 일정 기간이 지나면
            안전하게 삭제됩니다.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>정담 서울</div>
        <p className={styles.footerText}>
          진정한 대화, 특별한 인연
          <br />
          JEONGDAM SEOUL © 2026
        </p>
      </footer>
    </main>
  );
};

export default HomePage;
