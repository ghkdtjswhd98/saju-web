// 장문 리포트 서버 측 이어쓰기 — 고객이 화면을 닫아도 남은 파트를 끝까지 생성한다.
//
// 왜: 파트 분할 생성은 "요청 1회 = 파트 1개"이고 다음 파트는 클라이언트 재접속이 트리거였다.
// 고객이 중간에 화면을 닫으면 진행 중인 파트까지만 저장되고 나머지는 영영 생성되지 않았다 —
// PDF 메일도 완성 시점에만 나가므로 "닫아도 링크로 볼 수 있어요"를 믿은 고객은 반쪽 상품을 받는다.
// (2026-09-09 심층사주 결제 건이 4파트 중 2파트에서 멈춘 채 6일간 방치된 것을 새벽 점검에서 발견)
//
// 방식: 파트가 끝났는데 고객이 이미 떠났으면, 같은 스트림 주소로 새 요청을 보내 락이 잡히는
// 첫 응답까지만 기다리고 끊는다. 새 요청의 함수는 "클라이언트 이탈에도 완주" 규칙에 따라 그 파트를
// 끝내고, 또 떠난 상태이므로 다음 파트를 같은 방식으로 넘긴다. 파트 수만큼만 이어지고 실패 시엔 멈춘다.

const DEFAULT_TIMEOUT_MS = 20_000;

export async function kickNextPart(
  url: string,
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<boolean> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: "text/event-stream" },
      cache: "no-store",
    });
    if (!res.ok || !res.body) return false;
    const reader = res.body.getReader();
    // 첫 청크(full/busy) = 상대 함수가 락 판정까지 마쳤다는 뜻. 그 이상 붙잡고 있을 이유가 없다.
    const first = await reader.read();
    await reader.cancel().catch(() => {});
    return !first.done;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
