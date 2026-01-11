"use client";

import { useMemo, useState } from "react";

type FormState = {
  name: string;
  age: string;
  gender: "남" | "여" | "기타";
  phone: string;
  kakaoId: string;
  location: string;
  preferredGender: string;
  note: string;
  agreePrivacy: boolean;
  website: string; // honeypot
};

const initial: FormState = {
  name: "",
  age: "",
  gender: "남",
  phone: "",
  kakaoId: "",
  location: "",
  preferredGender: "",
  note: "",
  agreePrivacy: false,
  website: "",
};

export default function Page() {
  const [f, setF] = useState<FormState>(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return (
      f.name.trim().length > 0 &&
      f.age.trim().length > 0 &&
      f.phone.trim().length > 0 &&
      f.agreePrivacy &&
      status !== "loading"
    );
  }, [f, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setStatus("error");
        setMsg(json.message ?? "요청 처리에 실패했어요.");
        return;
      }

      setStatus("done");
      setMsg("신청이 접수됐어요! 확인 후 연락드릴게요 🙂");
      setF(initial);
    } catch {
      setStatus("error");
      setMsg("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 16px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>블라인드 소개팅 신청</h1>
        <p style={{ lineHeight: 1.6, opacity: 0.85 }}>
          가볍게 신청 → 조건 확인 → 매칭 가능하면 연락! (파일럿이라 정성껏
          하지만… 과한 기대는 금지! 기대는 우리를 배신해요 😇)
        </p>
      </header>

      <section
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>진행 방식</h2>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
          <li>신청 내용을 바탕으로 성향/조건을 간단히 검토해요.</li>
          <li>
            매칭 가능성이 있을 때만 연락드려요(무응답이면… 죄송하지만 인연이
            아니었던 걸로 🥲).
          </li>
          <li>개인정보는 파일럿 운영을 위해 최소한으로만 받아요.</li>
        </ul>
      </section>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {/* honeypot: 사람은 보통 안 채움 */}
        <input
          value={f.website}
          onChange={(e) => setF({ ...f, website: e.target.value })}
          placeholder="website"
          autoComplete="off"
          tabIndex={-1}
          style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
        />

        <Field label="이름/닉네임 *">
          <input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            style={inputStyle}
            placeholder="예) 훈 / 김OO"
          />
        </Field>

        <div
          style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
        >
          <Field label="나이 *">
            <input
              value={f.age}
              onChange={(e) => setF({ ...f, age: e.target.value })}
              style={inputStyle}
              placeholder="예) 31"
              inputMode="numeric"
            />
          </Field>

          <Field label="성별 *">
            <select
              value={f.gender}
              onChange={(e) =>
                setF({ ...f, gender: e.target.value as FormState["gender"] })
              }
              style={inputStyle}
            >
              <option value="남">남</option>
              <option value="여">여</option>
              <option value="기타">기타</option>
            </select>
          </Field>
        </div>

        <Field label="연락처(휴대폰) *">
          <input
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            style={inputStyle}
            placeholder="예) 010-1234-5678"
          />
        </Field>

        <Field label="카카오톡 ID (선택)">
          <input
            value={f.kakaoId}
            onChange={(e) => setF({ ...f, kakaoId: e.target.value })}
            style={inputStyle}
            placeholder="예) hoon123"
          />
        </Field>

        <Field label="주 활동 지역 (선택)">
          <input
            value={f.location}
            onChange={(e) => setF({ ...f, location: e.target.value })}
            style={inputStyle}
            placeholder="예) 분당/판교/강남"
          />
        </Field>

        <Field label="선호 성별/조건 (선택)">
          <input
            value={f.preferredGender}
            onChange={(e) => setF({ ...f, preferredGender: e.target.value })}
            style={inputStyle}
            placeholder="예) 상관없음 / 여성 / 남성"
          />
        </Field>

        <Field label="한 줄 소개/메모 (선택)">
          <textarea
            value={f.note}
            onChange={(e) => setF({ ...f, note: e.target.value })}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder="예) 주말에 드라이브/사진 좋아해요"
          />
        </Field>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={f.agreePrivacy}
            onChange={(e) => setF({ ...f, agreePrivacy: e.target.checked })}
          />
          <span style={{ lineHeight: 1.4 }}>
            개인정보 수집/이용에 동의합니다. (필수)
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: canSubmit ? "#111" : "#999",
            color: "#fff",
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontSize: 16,
          }}
        >
          {status === "loading" ? "접수 중..." : "신청하기"}
        </button>

        {msg && (
          <p
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 12,
              background: "#f5f5f5",
            }}
          >
            {msg}
          </p>
        )}
      </form>

      <footer
        style={{
          marginTop: 28,
          paddingTop: 16,
          borderTop: "1px solid #eee",
          opacity: 0.9,
        }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>
          개인정보 수집/이용 안내(파일럿)
        </h3>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          수집 항목: 이름/닉네임, 나이, 성별, 연락처, (선택)카카오톡ID/지역/메모
          <br />
          이용 목적: 소개팅 매칭 및 연락
          <br />
          보관 기간: 매칭 완료 또는 신청일로부터 3개월 이내 파기(원하면 즉시
          삭제 요청 가능)
          <br />
          문의/삭제 요청: 운영자에게 별도 안내된 연락처로 요청
        </p>
      </footer>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 15,
};
