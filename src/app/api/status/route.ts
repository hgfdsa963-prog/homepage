import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const GET = async (req: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? "";

  const parsed = QuerySchema.safeParse({ month });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid month format" },
      { status: 400 }
    );
  }

  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const endDate = new Date(y, m, 1);
  const end = endDate.toISOString().slice(0, 10);

  // desired_date가 있는 것만 집계
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("desired_date, gender")
    .gte("desired_date", start)
    .lt("desired_date", end);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Database error" },
      { status: 500 }
    );
  }

  const byDate: Record<
    string,
    { 남: number; 여: number; 기타: number; total: number }
  > = {};

  let totalMale = 0;
  let totalFemale = 0;
  let total = 0;

  for (const row of data ?? []) {
    const d = row.desired_date as string | null;
    const g = (row.gender ?? "기타") as "남" | "여" | "기타";

    if (g === "남") totalMale++;
    else if (g === "여") totalFemale++;
    total++;

    if (!d) continue;
    if (!byDate[d]) byDate[d] = { 남: 0, 여: 0, 기타: 0, total: 0 };
    byDate[d][g] += 1;
    byDate[d].total += 1;
  }

  return NextResponse.json({
    ok: true,
    month,
    byDate,
    male: totalMale,
    female: totalFemale,
    total,
  });
};
