import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

const verifyToken = (req: Request): boolean => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_TOKEN && ADMIN_TOKEN.length > 0;
};

/** 신청자 목록 조회 */
export const GET = async (req: Request): Promise<NextResponse> => {
  if (!verifyToken(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending, confirmed, matched, rejected
  const month = searchParams.get("month"); // YYYY-MM

  let query = supabaseAdmin
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const endDate = new Date(y, m, 1);
    const end = endDate.toISOString().slice(0, 10);
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ ok: false, message: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
};

/** 신청자 상태 변경 */
export const PATCH = async (req: Request): Promise<NextResponse> => {
  if (!verifyToken(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, note } = body as {
      id: number;
      status: "pending" | "confirmed" | "matched" | "rejected";
      note?: string;
    };

    if (!id || !status) {
      return NextResponse.json({ ok: false, message: "Missing id or status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (note !== undefined) {
      updateData.admin_note = note;
    }

    const { error } = await supabaseAdmin
      .from("applications")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Admin update error:", error);
      return NextResponse.json({ ok: false, message: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin PATCH error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
};

/** 신청자 삭제 */
export const DELETE = async (req: Request): Promise<NextResponse> => {
  if (!verifyToken(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .eq("id", Number(id));

    if (error) {
      console.error("Admin delete error:", error);
      return NextResponse.json({ ok: false, message: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin DELETE error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
};
