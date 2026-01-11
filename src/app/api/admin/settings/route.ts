import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDefaultMax } from "@/lib/checkAvailability";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

const verifyToken = (req: Request): boolean => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_TOKEN && ADMIN_TOKEN.length > 0;
};

/**
 * 날짜별 최대 인원 설정 조회
 * GET /api/admin/settings?date=2026-01-15 (단일 날짜)
 * GET /api/admin/settings?month=2026-01 (월별 전체)
 */
export const GET = async (req: Request): Promise<NextResponse> => {
  // 설정 조회는 인증 없이도 가능 (availability API에서 사용)
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  try {
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
      // 테이블이 없으면 기본값 반환
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
 * 날짜별 최대 인원 설정 추가/수정
 * POST /api/admin/settings
 * Body: { date: "2026-01-15", maxMale: 4, maxFemale: 4 }
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
    const { date, maxMale, maxFemale } = body as {
      date: string;
      maxMale: number;
      maxFemale: number;
    };

    if (!date) {
      return NextResponse.json(
        { ok: false, message: "Date is required" },
        { status: 400 }
      );
    }

    const defaultMax = getDefaultMax();
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
 * 날짜별 설정 삭제 (기본값으로 복원)
 * DELETE /api/admin/settings?date=2026-01-15
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

    if (!date) {
      return NextResponse.json(
        { ok: false, message: "Date is required" },
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
