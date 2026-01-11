"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import styles from "@/styles/apply.module.css";

type FormState = {
  name: string;
  age: string;
  gender: "남" | "여" | "기타";
  phone: string;
  kakaoId: string;
  location: string;
  preferredGender: string;
  desiredDate: string;
  note: string;
  agreePrivacy: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  age: "",
  gender: "남",
  phone: "",
  kakaoId: "",
  location: "",
  preferredGender: "",
  desiredDate: "",
  note: "",
  agreePrivacy: false,
  website: "",
};

const ApplyPage = (): React.ReactElement => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const isSubmitEnabled = useMemo(
    () =>
      form.name.trim() &&
      form.age.trim() &&
      form.phone.trim() &&
      form.agreePrivacy &&
      status !== "loading",
    [form, status]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setStatus("error");
          setMessage(json.message ?? "요청 처리에 실패했어요.");
          return;
        }
        setStatus("done");
        setMessage("신청 접수 완료! 확인 후 연락드릴게요 💕");
        setForm(INITIAL_FORM);
      } catch {
        setStatus("error");
        setMessage("네트워크 오류가 발생했어요. 다시 시도해주세요.");
      }
    },
    [form]
  );

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.titleEmoji}>💌</span>
          <h1 className={styles.title}>소개팅 신청</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          ← 소개로
        </Link>
      </header>

      {/* Form Card */}
      <div className={styles.formCard}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Honeypot field */}
          <input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="website"
            tabIndex={-1}
            autoComplete="off"
            className={styles.honeypot}
          />

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              이름/닉네임 <span className={styles.required}>*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={styles.input}
              placeholder="부르실 이름을 알려주세요"
            />
          </div>

          {/* Age & Gender */}
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                나이 <span className={styles.required}>*</span>
              </label>
              <input
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                className={styles.input}
                inputMode="numeric"
                placeholder="만 나이"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                성별 <span className={styles.required}>*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  updateField("gender", e.target.value as FormState["gender"])
                }
                className={styles.select}
              >
                <option value="남">남성</option>
                <option value="여">여성</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              연락처 (휴대폰) <span className={styles.required}>*</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={styles.input}
              placeholder="010-1234-5678"
              type="tel"
            />
          </div>

          <div className={styles.divider}>선택 사항</div>

          {/* Desired Date */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>희망 날짜</label>
            <input
              type="date"
              value={form.desiredDate}
              onChange={(e) => updateField("desiredDate", e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Kakao ID */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>카카오톡 ID</label>
            <input
              value={form.kakaoId}
              onChange={(e) => updateField("kakaoId", e.target.value)}
              className={styles.input}
              placeholder="연락드릴 때 사용해요"
            />
          </div>

          {/* Location */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>주 활동 지역</label>
            <input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              className={styles.input}
              placeholder="예: 서울 강남, 경기 분당"
            />
          </div>

          {/* Preferred Gender */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>선호 조건</label>
            <input
              value={form.preferredGender}
              onChange={(e) => updateField("preferredGender", e.target.value)}
              className={styles.input}
              placeholder="원하는 상대방 조건 (나이대, 성별 등)"
            />
          </div>

          {/* Note */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>메모</label>
            <textarea
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              className={styles.textarea}
              placeholder="추가로 전달하고 싶은 내용이 있다면 적어주세요"
            />
          </div>

          {/* Privacy Agreement */}
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.agreePrivacy}
              onChange={(e) => updateField("agreePrivacy", e.target.checked)}
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxText}>
              개인정보 수집 및 이용에 동의합니다. (필수)
              <br />
              <small>
                수집 정보: 이름, 연락처, 성별, 나이 등 | 목적: 소개팅 매칭
              </small>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isSubmitEnabled}
            className={`${styles.submitButton} ${
              isSubmitEnabled ? styles.submitEnabled : styles.submitDisabled
            }`}
          >
            {status === "loading" ? <>⏳ 접수 중...</> : <>💕 신청하기</>}
          </button>

          {/* Message */}
          {message && (
            <p
              className={`${styles.message} ${
                status === "done" ? styles.messageSuccess : styles.messageError
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
};

export default ApplyPage;
