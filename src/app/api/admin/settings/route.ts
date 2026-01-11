import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDefaultMax } from "@/lib/checkAvailability";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

/** 요일 이름 (일~토) */
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const verifyToken = (req: Request): boolean => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_TOKEN && ADMIN_TOKEN.length > 0;
};

/**
 * 설정 조회
 * GET /api/admin/settings?type=date (날짜별 설정)
 * GET /api/admin/settings?type=weekday (요일별 설정)
 * GET /api/admin/settings?date=2026-01-15 (단일 날짜)
 * GET /api/admin/settings?month=2026-01 (월별 전체)
 */
export const GET = async (req: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  try {
    // 요일별 설정 조회
    if (type === "weekday") {
      const { data, error } = await supabaseAdmin
        .from("weekday_settings")
        .select("*")
        .order("weekday", { ascending: true });

      if (error) {
        if (error.code === "42P01") {
          return NextResponse.json({
            ok: true,
            data: [],
            weekdayNames: WEEKDAY_NAMES,
            defaultMaxPerGender: getDefaultMax(),
          });
        }
        console.error("Weekday settings fetch error:", error);
        return NextResponse.json(
          { ok: false, message: "Database error" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: data ?? [],
        weekdayNames: WEEKDAY_NAMES,
        defaultMaxPerGender: getDefaultMax(),
      });
    }

    // 날짜별 설정 조회
    let query = supabaseAdmin.from("date_settings").select("*");

    if (date) {
      query = query.eq("date", date);
    } else if (month) {
      const [y, m] = month.split("-").map(Number);
      const start = `${month}-01`;
      const endDate = new Date(y, m, 1);
      const end = endDate.toISOString().slice(0, 10);
      query = query.gte("date", start).lt("date", end);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({
          ok: true,
          data: [],
          defaultMaxPerGender: getDefaultMax(),
        });
      }
      console.error("Settings fetch error:", error);
      return NextResponse.json(
        { ok: false, message: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      defaultMaxPerGender: getDefaultMax(),
    });
  } catch (err) {
    console.error("Settings API error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
};

/**
 * 설정 추가/수정
 * POST /api/admin/settings
 * Body (날짜): { type: "date", date: "2026-01-15", maxMale: 4, maxFemale: 4 }
 * Body (요일): { type: "weekday", weekday: 0, maxMale: 4, maxFemale: 4 }
 */
export const POST = async (req: Request): Promise<NextResponse> => {
  if (!verifyToken(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { type, date, weekday, maxMale, maxFemale } = body as {
      type?: "date" | "weekday";
      date?: string;
      weekday?: number;
      maxMale: number;
      maxFemale: number;
    };

    const defaultMax = getDefaultMax();

    // 요일별 설정
    if (type === "weekday") {
      if (weekday === undefined || weekday < 0 || weekday > 6) {
        return NextResponse.json(
          { ok: false, message: "Valid weekday (0-6) is required" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin.from("weekday_settings").upsert(
        {
          weekday,
          max_male: maxMale ?? defaultMax,
          max_female: maxFemale ?? defaultMax,
        },
        { onConflict: "weekday" }
      );

      if (error) {
        console.error("Weekday settings upsert error:", error);
        return NextResponse.json(
          { ok: false, message: "Failed to save weekday settings" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // 날짜별 설정 (기본)
    if (!date) {
      return NextResponse.json(
        { ok: false, message: "Date is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("date_settings").upsert(
      {
        date,
        max_male: maxMale ?? defaultMax,
        max_female: maxFemale ?? defaultMax,
      },
      { onConflict: "date" }
    );

    if (error) {
      console.error("Settings upsert error:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
};

/**
 * 설정 삭제 (기본값으로 복원)
 * DELETE /api/admin/settings?date=2026-01-15 (날짜)
 * DELETE /api/admin/settings?weekday=0 (요일)
 */
export const DELETE = async (req: Request): Promise<NextResponse> => {
  if (!verifyToken(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const weekday = searchParams.get("weekday");

    // 요일 설정 삭제
    if (weekday !== null) {
      const weekdayNum = parseInt(weekday, 10);
      if (isNaN(weekdayNum) || weekdayNum < 0 || weekdayNum > 6) {
        return NextResponse.json(
          { ok: false, message: "Valid weekday (0-6) is required" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("weekday_settings")
        .delete()
        .eq("weekday", weekdayNum);

      if (error) {
        console.error("Weekday settings delete error:", error);
        return NextResponse.json(
          { ok: false, message: "Failed to delete" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // 날짜 설정 삭제
    if (!date) {
      return NextResponse.json(
        { ok: false, message: "Date or weekday is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("date_settings")
      .delete()
      .eq("date", date);

    if (error) {
      console.error("Settings delete error:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to delete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings DELETE error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
};
