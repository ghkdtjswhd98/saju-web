"use client";

import { useEffect } from "react";

// 무료 결과 열람 흔적을 저장 — 이후 상품 페이지 경유로 체크아웃에 들어와도
// "내 정보 그대로 불러오기"를 제안할 수 있게 한다 (재입력 이탈 방지)
export default function RememberFreeResult({ shareId }: { shareId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem("orobmi_last_free", shareId);
    } catch {
      /* private 모드 등 — 무시 */
    }
  }, [shareId]);
  return null;
}
