import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const Schema = z.object({
  name: z.string().min(1).max(50),
  age: z.string().min(1).max(3),
  gender: z.enum(["남", "여", "기타"]),
  phone: z.string().min(8).max(20),
  kakaoId: z.string().max(50).optional().or(z.literal("")),
  location: z.string().max(50).optional().or(z.literal("")),
  preferredGender: z.string().max(100).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  desiredDate: z.string().optional().or(z.literal("")),
  agreePrivacy: z.coerce.boolean(),
  website: z.string().optional().or(z.literal("")),
});

export const POST = async (req: Request): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.issues);
      return NextResponse.json(
        { ok: false, message: "입력값을 확인해주세요." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot check
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    if (!data.agreePrivacy) {
      return NextResponse.json(
        { ok: false, message: "개인정보 수집/이용에 동의가 필요합니다." },
        { status: 400 }
      );
    }

    const desiredDate = data.desiredDate?.trim() || null;
    const ageNumber = parseInt(data.age, 10) || null;

    const { error } = await supabaseAdmin.from("applications").insert({
      name: data.name,
      age: ageNumber,
      gender: data.gender,
      phone: data.phone,
      kakao_id: data.kakaoId || null,
      location: data.location || null,
      preferred_gender: data.preferredGender || null,
      note: data.note || null,
      desired_date: desiredDate,
      agree_privacy: data.agreePrivacy,
      status: "pending",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { ok: false, message: "저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
