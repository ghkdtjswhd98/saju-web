// 케미 초대 링크 — 브라우저 전용 헬퍼 (계측 + 주인 키 보관). 서버 컴포넌트에서 import하지 말 것.
import { track } from "@vercel/analytics";
import { trackCustomPixel } from "@/components/MetaPixel";

// 스펙 계측 4종: 링크 생성 / 유입 / 입력 완료 / 재생성(친구가 자기 링크 만듦)
export type ChemiEvent = "chemi_create" | "chemi_visit" | "chemi_reply" | "chemi_regen";

export function trackChemi(event: ChemiEvent, data?: Record<string, string | number | boolean>) {
  try {
    track(event, data); // Vercel Analytics 커스텀 이벤트 — 배포 환경에서만 전송
  } catch {
    /* 미설치/차단 — 무시 */
  }
  trackCustomPixel(event, data);
}

// 주인 키는 URL에 싣지 않고 만든 브라우저에만 남긴다 — 링크가 돌아다녀도 순위 전체는 주인만 본다
const OWNER_PREFIX = "orobmi_chemi_owner:";
const MINE_KEY = "orobmi_chemi_mine";

export function saveOwnerKey(code: string, ownerKey: string) {
  try {
    localStorage.setItem(OWNER_PREFIX + code, ownerKey);
    localStorage.setItem(MINE_KEY, code);
  } catch {
    /* private 모드 등 — 링크는 여전히 동작, 전체 순위만 못 본다 */
  }
}

export function getOwnerKey(code: string): string | null {
  try {
    return localStorage.getItem(OWNER_PREFIX + code);
  } catch {
    return null;
  }
}

/** 이 브라우저에서 마지막으로 만든 내 링크 코드 */
export function getMyCode(): string | null {
  try {
    return localStorage.getItem(MINE_KEY);
  } catch {
    return null;
  }
}
