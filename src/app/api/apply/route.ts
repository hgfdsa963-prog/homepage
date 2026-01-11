import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const Schema = z.object({
  name: z.string().min(1).max(50),
  age: z.coerce.number().int().min(19).max(60),
  gender: z.enum(["남", "여", "기타"]),
  phone: z.string().min(8).max(20),
  kakaoId: z.string().max(50).optional().or(z.literal("")),
  location: z.string().max(50).optional().or(z.literal("")),
  preferredGender: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  agreePrivacy: z.coerce.boolean(),
  // honeypot
  website: z.string().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = Schema.parse(body);

    // 봇이면 조용히 성공 처리(스팸 줄이기)
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    if (!data.agreePrivacy) {
      return NextResponse.json(
        { ok: false, message: "개인정보 수집/이용에 동의가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("applications").insert({
      name: data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      kakao_id: data.kakaoId || null,
      location: data.location || null,
      preferred_gender: data.preferredGender || null,
      note: data.note || null,
      agree_privacy: data.agreePrivacy,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "입력값을 확인해주세요." },
      { status: 400 }
    );
  }
}
