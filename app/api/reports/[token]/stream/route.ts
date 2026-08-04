// 리포트 해석 생성 SSE — 무료/유료 공용.
// 리포트 행이 존재한다는 것 자체가 생성 권한 (유료는 결제 confirm에서만 행이 생성됨).
import { and, eq, lt, or, sql } from "drizzle-orm";
import { getDb, reports } from "@/lib/db";
import { FREE_MODEL, PAID_MODEL, streamReport } from "@/lib/anthropic";
import { parseBlocks } from "@/lib/parse-blocks";
import { FORMATS } from "@/lib/prompts/formats";
import {
  buildLoveUserPrompt, buildSingleUserPrompt, buildYearUserPrompt,
} from "@/lib/prompts/user-template";
import type { PersonInput, SajuResult } from "@/lib/saju/types";

export const runtime = "nodejs";
export const maxDuration = 300; // Opus 장문 생성 대비

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = getDb();

  const rows = await db.select().from(reports).where(eq(reports.token, token)).limit(1);
  const report = rows[0];
  if (!report) return new Response("not found", { status: 404 });

  const encoder = new TextEncoder();

  // 이미 완료 → 저장본 즉시 전달 (페이지 새로고침 없이도 렌더 가능)
  if (report.status === "done") {
    const content = report.content as { rawText?: string } | null;
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(sse({ t: "full", text: content?.rawText ?? "" })));
        c.enqueue(encoder.encode(sse({ t: "done" })));
        c.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream" } });
  }

  // 생성 락: pending → generating 전환에 성공한 요청만 생성 수행.
  // 서버 강제 종료 등으로 generating에 고착된 경우(10분 경과) 재락을 허용해 자동 복구.
  // failed도 재락 허용 — 단, 클라이언트는 failed 상태에서 자동 접속하지 않고
  // 사용자가 "다시 시도"를 눌렀을 때만 접속한다 (지속 장애 시 새로고침마다 재과금 방지).
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const locked = await db
    .update(reports)
    .set({ status: "generating", generatingAt: sql`now()` })
    .where(
      and(
        eq(reports.token, token),
        or(
          eq(reports.status, "pending"),
          eq(reports.status, "failed"),
          and(eq(reports.status, "generating"), lt(reports.generatingAt, staleBefore)),
        ),
      ),
    )
    .returning({ token: reports.token });

  if (!locked.length) {
    // 다른 요청이 생성 중 (또는 failed) — 클라이언트는 잠시 후 재시도
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(sse({ t: "busy" })));
        c.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream" } });
  }

  // 상품별 모델/형식/프롬프트 구성
  const productCode = report.productCode;
  const format = FORMATS[productCode];
  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const isFree = productCode.startsWith("free");
  const model = isFree ? FREE_MODEL : PAID_MODEL;
  // 유료는 분량 강화(평생사주 7,000자급 ≈ 9K 토큰) + adaptive thinking 여유분
  // 무료도 6블록 700자+로 개편돼 1024로는 잘린다. deep은 20,000자(≈27K 토큰) + thinking 여유분.
  const maxTokens = isFree ? 3000 : productCode === "deep" ? 40000 : 24000;

  let userPrompt: string;
  if (productCode === "love" || productCode === "free_love") {
    const [rA, rB] = report.sajuData as [SajuResult, SajuResult];
    userPrompt = buildLoveUserPrompt(
      { person: persons[0], result: rA },
      { person: persons[1], result: rB },
    );
  } else if (productCode === "year") {
    userPrompt = buildYearUserPrompt(persons[0], report.sajuData as SajuResult);
  } else {
    // lifetime/career는 대운 시간표를 근거 데이터로 제공 ("언제"를 말할 수 있게)
    userPrompt = buildSingleUserPrompt(persons[0], report.sajuData as SajuResult, {
      withDaewoon:
        productCode === "lifetime" || productCode === "career" || productCode === "deep",
    });
  }

  const stream = new ReadableStream({
    async start(c) {
      // 클라이언트가 중간에 이탈해도 생성은 완주해 저장한다 — 이탈 시 enqueue가 던지는데,
      // 그때 생성을 중단하면 결제된 Opus 호출이 통째로 버려지고 재접속 시 전액 재과금된다.
      let clientGone = false;
      const send = (data: object) => {
        if (clientGone) return;
        try {
          c.enqueue(encoder.encode(sse(data)));
        } catch {
          clientGone = true;
        }
      };
      try {
        const claudeStream = streamReport({
          model,
          formatSystem: format.system,
          userPrompt,
          maxTokens,
          useThinking: !isFree,
        });

        claudeStream.on("text", (delta) => {
          send({ t: "delta", text: delta });
        });

        const final = await claudeStream.finalMessage();
        const rawText = final.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { text: string }).text)
          .join("");
        const blocks = parseBlocks(rawText, format.markers);

        await db
          .update(reports)
          .set({
            status: "done",
            content: { blocks, rawText },
            model,
            usage: {
              input_tokens: final.usage.input_tokens,
              output_tokens: final.usage.output_tokens,
              cache_creation_input_tokens: final.usage.cache_creation_input_tokens,
              cache_read_input_tokens: final.usage.cache_read_input_tokens,
            },
            completedAt: new Date(),
          })
          .where(eq(reports.token, token));

        send({ t: "done" });
      } catch (err) {
        console.error("[report-stream] 생성 실패:", err);
        // failed로 종결 — 사용자가 "다시 시도"를 눌러야만 재생성 (자동 무한 재호출 금지)
        await db
          .update(reports)
          .set({ status: "failed" })
          .where(eq(reports.token, token))
          .catch(() => {});
        send({ t: "error" });
      } finally {
        if (!clientGone) {
          try {
            c.close();
          } catch {
            /* 이미 닫힘 */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
