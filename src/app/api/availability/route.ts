import { NextResponse } from "next/server";
import { getDateStatus, getDefaultMax } from "@/lib/checkAvailability";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AvailabilityData = {
  date: string;
  maleCount: number;
  femaleCount: number;
  maxMale: number;
  maxFemale: number;
  isMaleClosed: boolean;
  isFemaleClosed: boolean;
};

/**
 * 날짜별 확정 인원 및 마감 여부 조회 API
 * GET /api/availability?date=2026-01-15 (단일 날짜)
 * GET /api/availability?month=2026-01 (월별 전체)
 */
export const GET = async (req: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  try {
    // 단일 날짜 조회
    if (date) {
      const status = await getDateStatus(date);
      return NextResponse.json({
        ok: true,
        date,
        male: status.maleCount,
        female: status.femaleCount,
        maxMale: status.maxMale,
        maxFemale: status.maxFemale,
        isMaleClosed: status.isMaleClosed,
        isFemaleClosed: status.isFemaleClosed,
      });
    }

    // 월별 조회
    if (month) {
      const defaultMax = getDefaultMax();
      const [y, m] = month.split("-").map(Number);
      const start = `${month}-01`;
      const endDate = new Date(y, m, 1);
      const end = endDate.toISOString().slice(0, 10);

      // 확정된 신청 조회
      const { data: applications } = await supabaseAdmin
        .from("applications")
        .select("desired_date, gender")
        .eq("status", "confirmed")
        .not("desired_date", "is", null)
        .gte("desired_date", start)
        .lt("desired_date", end);

      // 날짜별 설정 조회
      const { data: settings } = await supabaseAdmin
        .from("date_settings")
        .select("date, max_male, max_female")
        .gte("date", start)
        .lt("date", end);

      // 설정 맵 생성
      const settingsMap = new Map<
        string,
        { maxMale: number; maxFemale: number }
      >();
      for (const s of settings ?? []) {
        settingsMap.set(s.date, {
          maxMale: s.max_male ?? defaultMax,
          maxFemale: s.max_female ?? defaultMax,
        });
      }

      // 날짜별 집계
      const countMap = new Map<string, { male: number; female: number }>();
      for (const app of applications ?? []) {
        const d = app.desired_date as string;
        if (!countMap.has(d)) {
          countMap.set(d, { male: 0, female: 0 });
        }
        const counts = countMap.get(d)!;
        if (app.gender === "남") counts.male++;
        else if (app.gender === "여") counts.female++;
      }

      // 결과 생성
      const byDate: AvailabilityData[] = [];
      const allDates = new Set([...countMap.keys(), ...settingsMap.keys()]);

      for (const d of allDates) {
        const counts = countMap.get(d) ?? { male: 0, female: 0 };
        const setting = settingsMap.get(d) ?? {
          maxMale: defaultMax,
          maxFemale: defaultMax,
        };

        byDate.push({
          date: d,
          maleCount: counts.male,
          femaleCount: counts.female,
          maxMale: setting.maxMale,
          maxFemale: setting.maxFemale,
          isMaleClosed: counts.male >= setting.maxMale,
          isFemaleClosed: counts.female >= setting.maxFemale,
        });
      }

      // 날짜순 정렬
      byDate.sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({
        ok: true,
        byDate,
        defaultMaxPerGender: defaultMax,
      });
    }

    return NextResponse.json(
      { ok: false, message: "date or month parameter required" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
};
