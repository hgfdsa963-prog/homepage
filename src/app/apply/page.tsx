"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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

type DateAvailability = {
  date: string;
  male: number;
  female: number;
  maxMale: number;
  maxFemale: number;
  isMaleClosed: boolean;
  isFemaleClosed: boolean;
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

const PHONE_REGEX = /^010-\d{4}-\d{4}$/;

/** 전화번호 포맷팅 (000-0000-0000) */
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};

const ApplyPage = (): React.ReactElement => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  // 날짜별 마감 정보
  const [dateAvailability, setDateAvailability] =
    useState<DateAvailability | null>(null);
  const [isCheckingDate, setIsCheckingDate] = useState(false);

  const isPhoneValid = useMemo(
    () => PHONE_REGEX.test(form.phone),
    [form.phone]
  );

  // 현재 성별에 대해 선택한 날짜가 마감인지 확인
  const isDateClosedForGender = useMemo(() => {
    if (!dateAvailability || !form.desiredDate) return false;
    if (form.gender === "남") return dateAvailability.isMaleClosed;
    if (form.gender === "여") return dateAvailability.isFemaleClosed;
    return false;
  }, [dateAvailability, form.desiredDate, form.gender]);

  const isSubmitEnabled = useMemo(
    () =>
      form.name.trim() &&
      form.age.trim() &&
      isPhoneValid &&
      form.agreePrivacy &&
      !isDateClosedForGender &&
      status !== "loading",
    [form, isPhoneValid, isDateClosedForGender, status]
  );

  // 날짜 선택 시 마감 여부 확인
  const checkDateAvailability = useCallback(
    async (date: string): Promise<void> => {
      if (!date) {
        setDateAvailability(null);
        return;
      }

      setIsCheckingDate(true);
      try {
        const res = await fetch(`/api/availability?date=${date}`);
        if (res.ok) {
          const json = await res.json();
          setDateAvailability({
            date,
            male: json.male ?? 0,
            female: json.female ?? 0,
            maxMale: json.maxMale ?? 4,
            maxFemale: json.maxFemale ?? 4,
            isMaleClosed: json.isMaleClosed ?? false,
            isFemaleClosed: json.isFemaleClosed ?? false,
          });
        }
      } catch {
        console.error("Failed to check date availability");
      } finally {
        setIsCheckingDate(false);
      }
    },
    []
  );

  // 날짜 변경 시 마감 여부 확인
  const handleDateChange = useCallback(
    (date: string): void => {
      setForm((prev) => ({ ...prev, desiredDate: date }));
      checkDateAvailability(date);
    },
    [checkDateAvailability]
  );

  // 성별 변경 시 마감 상태 다시 체크
  useEffect(() => {
    if (form.desiredDate && dateAvailability) {
      // 이미 불러온 데이터가 있으면 다시 API 호출 불필요
      // isDateClosedForGender가 자동으로 재계산됨
    }
  }, [form.gender, form.desiredDate, dateAvailability]);

  const handlePhoneChange = useCallback((value: string): void => {
    const formatted = formatPhoneNumber(value);
    setForm((prev) => ({ ...prev, phone: formatted }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();

      if (isDateClosedForGender) {
        setMessage("선택하신 날짜는 해당 성별이 마감되었습니다.");
        return;
      }

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
        setDateAvailability(null);
      } catch {
        setStatus("error");
        setMessage("네트워크 오류가 발생했어요. 다시 시도해주세요.");
      }
    },
    [form, isDateClosedForGender]
  );

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // 마감 상태 메시지 생성
  const getClosedMessage = (): string | null => {
    if (!dateAvailability || !form.desiredDate) return null;

    const messages: string[] = [];
    if (dateAvailability.isMaleClosed) {
      messages.push("남성 마감");
    }
    if (dateAvailability.isFemaleClosed) {
      messages.push("여성 마감");
    }

    if (messages.length === 0) return null;
    return messages.join(" / ");
  };

  const closedMessage = getClosedMessage();

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
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={styles.input}
              placeholder="010-0000-0000"
              type="tel"
              maxLength={13}
            />
            {form.phone && !isPhoneValid && (
              <p className={styles.fieldHint}>
                010-0000-0000 형식으로 입력해주세요
              </p>
            )}
          </div>

          <div className={styles.divider}>선택 사항</div>

          {/* Desired Date */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>희망 날짜</label>
            <input
              type="date"
              value={form.desiredDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`${styles.input} ${
                isDateClosedForGender ? styles.inputError : ""
              }`}
              min={new Date().toISOString().split("T")[0]}
            />
            {isCheckingDate && (
              <p className={styles.fieldHintInfo}>확인 중...</p>
            )}
            {closedMessage && !isCheckingDate && (
              <p
                className={`${styles.dateStatus} ${
                  isDateClosedForGender
                    ? styles.dateStatusClosed
                    : styles.dateStatusInfo
                }`}
              >
                📅 {form.desiredDate} : {closedMessage}
                {isDateClosedForGender && (
                  <span className={styles.dateClosedWarning}>
                    <br />
                    ⚠️ 선택하신 성별({form.gender})은 해당 날짜가
                    마감되었습니다. 다른 날짜를 선택해주세요.
                  </span>
                )}
              </p>
            )}
            {form.desiredDate &&
              !closedMessage &&
              !isCheckingDate &&
              dateAvailability && (
                <p className={styles.dateStatusAvailable}>
                  ✅ 신청 가능 (남 {dateAvailability.male}/
                  {dateAvailability.maxMale}, 여 {dateAvailability.female}/
                  {dateAvailability.maxFemale})
                </p>
              )}
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
