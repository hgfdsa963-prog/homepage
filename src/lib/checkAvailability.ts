import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** 환경변수에서 기본 최대 인원 가져오기 (없으면 4) */
const getDefaultMax = (): number => {
  const envValue = process.env.DEFAULT_MAX_PER_GENDER;
  return envValue ? parseInt(envValue, 10) : 4;
};

type AvailabilityResult = {
  isAvailable: boolean;
  isMaleClosed: boolean;
  isFemaleClosed: boolean;
  maleCount: number;
  femaleCount: number;
  maxMale: number;
  maxFemale: number;
  message?: string;
};

/**
 * 서버단에서 날짜/성별 마감 여부 확인
 */
export const checkDateAvailability = async ({
  date,
  gender,
}: {
  date: string;
  gender: "남" | "여" | "기타";
}): Promise<AvailabilityResult> => {
  const defaultMax = getDefaultMax();

  // 1. 해당 날짜의 최대 인원 설정 조회
  const { data: settingsData } = await supabaseAdmin
    .from("date_settings")
    .select("max_male, max_female")
    .eq("date", date)
    .single();

  const maxMale = settingsData?.max_male ?? defaultMax;
  const maxFemale = settingsData?.max_female ?? defaultMax;

  // 2. 해당 날짜의 확정된 인원 수 조회
  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("gender")
    .eq("desired_date", date)
    .eq("status", "confirmed");

  let maleCount = 0;
  let femaleCount = 0;

  for (const app of applications ?? []) {
    if (app.gender === "남") maleCount++;
    else if (app.gender === "여") femaleCount++;
  }

  const isMaleClosed = maleCount >= maxMale;
  const isFemaleClosed = femaleCount >= maxFemale;

  // 3. 현재 성별에 대한 마감 여부 확인
  let isAvailable = true;
  let message: string | undefined;

  if (gender === "남" && isMaleClosed) {
    isAvailable = false;
    message = `해당 날짜(${date})는 남성 신청이 마감되었습니다. (${maleCount}/${maxMale}명)`;
  } else if (gender === "여" && isFemaleClosed) {
    isAvailable = false;
    message = `해당 날짜(${date})는 여성 신청이 마감되었습니다. (${femaleCount}/${maxFemale}명)`;
  }

  return {
    isAvailable,
    isMaleClosed,
    isFemaleClosed,
    maleCount,
    femaleCount,
    maxMale,
    maxFemale,
    message,
  };
};

/**
 * 날짜의 전체 현황 조회 (성별 무관)
 */
export const getDateStatus = async (
  date: string
): Promise<{
  maleCount: number;
  femaleCount: number;
  maxMale: number;
  maxFemale: number;
  isMaleClosed: boolean;
  isFemaleClosed: boolean;
}> => {
  const defaultMax = getDefaultMax();

  // 최대 인원 설정 조회
  const { data: settingsData } = await supabaseAdmin
    .from("date_settings")
    .select("max_male, max_female")
    .eq("date", date)
    .single();

  const maxMale = settingsData?.max_male ?? defaultMax;
  const maxFemale = settingsData?.max_female ?? defaultMax;

  // 확정된 인원 수 조회
  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("gender")
    .eq("desired_date", date)
    .eq("status", "confirmed");

  let maleCount = 0;
  let femaleCount = 0;

  for (const app of applications ?? []) {
    if (app.gender === "남") maleCount++;
    else if (app.gender === "여") femaleCount++;
  }

  return {
    maleCount,
    femaleCount,
    maxMale,
    maxFemale,
    isMaleClosed: maleCount >= maxMale,
    isFemaleClosed: femaleCount >= maxFemale,
  };
};

export { getDefaultMax };
