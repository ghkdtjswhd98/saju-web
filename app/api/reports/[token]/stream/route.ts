// 리포트 해석 생성 SSE — 무료/유료 공용.
// 리포트 행이 존재한다는 것 자체가 생성 권한 (유료는 결제 confirm에서만 행이 생성됨).
import { and, eq, lt, or, sql } from "drizzle-orm";
import { getDb, orders, reports } from "@/lib/db";
import { FREE_MODEL, PAID_MODEL, streamReport } from "@/lib/anthropic";
import { sendOwnerAlert, sendReportPdf } from "@/lib/email";
import { buildPdfForReport } from "@/lib/report-pdf";
import { siteUrl } from "@/lib/site";
import { parseBlocks } from "@/lib/parse-blocks";
import { CONCERN_MARKER, CONCERN_SECTION_SYSTEM, FORMATS } from "@/lib/prompts/formats";
import {
  buildLoveUserPrompt, buildSingleUserPrompt, buildYearUserPrompt,
} from "@/lib/prompts/user-template";
import { CRISIS_NOTICE, detectCrisis } from "@/lib/validate";
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

  // 여러 파트로 나눠 쓰는 상품의 진행 상태. 이전 요청이 남긴 본문·누적 usage를 이어받는다.
  const prevContent = report.content as
    | { rawText?: string; partsDone?: number }
    | null;
  const prevUsage = (report.usage ?? {}) as Record<string, number | undefined>;
  const prevProgress = {
    rawText: prevContent?.rawText ?? "",
    partsDone: prevContent?.partsDone ?? 0,
    usage: {
      input_tokens: prevUsage.input_tokens ?? 0,
      output_tokens: prevUsage.output_tokens ?? 0,
      cache_creation_input_tokens: prevUsage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: prevUsage.cache_read_input_tokens ?? 0,
    },
  };

  // 상품별 모델/형식/프롬프트 구성
  const productCode = report.productCode;
  const format = FORMATS[productCode];
  const persons = (report.inputData as { persons: PersonInput[] }).persons;
  const isFree = productCode.startsWith("free");
  const model = isFree ? FREE_MODEL : PAID_MODEL;
  // 유료는 분량 강화(평생사주 7,000자급 ≈ 9K 토큰) + adaptive thinking 여유분
  // 무료도 6블록 700자+로 개편돼 1024로는 잘린다. deep은 20,000자(≈27K 토큰) + thinking 여유분.
  const maxTokens = isFree ? 3000 : productCode === "deep" ? 40000 : 24000;

  // 고민 처리 — 신청자(persons[0])의 자유 서술.
  // 위기 키워드가 검출되면 프롬프트에 넣지 않는다(S8). AI가 그 마음에 운세의 언어로
  // 답하는 것 자체가 통제 불가능한 위험이라, 대신 고정 안내 문구를 완성 시점에 붙인다.
  const concern = persons[0]?.concern;
  const crisis = detectCrisis(concern);
  // 이름 칸(자유 텍스트 20자)으로 들어온 위기 문구는 프롬프트·PDF 제목에 그대로 실린다 —
  // 그런 문자열은 이름이 아니므로 "고객"으로 치환만 하고, 안내 문구 대상은 아니다.
  for (const p of persons) {
    if (detectCrisis(p.name)) p.name = "고객";
  }
  const withConcern = !isFree && Boolean(persons[0]?.concernTopic || concern) && !crisis;
  // deep은 고민이 있으면 마지막 파트에 "물어보신 것에 대하여" 섹션이 동적으로 붙는다.
  // FORMATS 상수는 불변 — 이 요청에서 쓸 사본만 확장한다.
  const withConcernSection = withConcern && productCode === "deep" && Boolean(concern);

  let userPrompt: string;
  // 2인 상품(love/free_love/reunion/crush)은 sajuData가 배열로 저장된다 —
  // 상품 목록에 의존하지 않고 저장 형태로 판별해 확장에 열어둔다.
  if (Array.isArray(report.sajuData)) {
    const [rA, rB] = report.sajuData as [SajuResult, SajuResult];
    userPrompt = buildLoveUserPrompt(
      { person: persons[0], result: rA },
      { person: persons[1], result: rB },
      { withConcern },
    );
  } else if (productCode === "year") {
    userPrompt = buildYearUserPrompt(persons[0], report.sajuData as SajuResult, { withConcern });
  } else {
    // 대운 시간표가 근거로 필요한 상품 ("언제"를 말하는 게 상품 가치인 것들)
    const DAEWOON_PRODUCTS = ["lifetime", "career", "deep", "marriage"];
    userPrompt = buildSingleUserPrompt(persons[0], report.sajuData as SajuResult, {
      withDaewoon: DAEWOON_PRODUCTS.includes(productCode),
      withConcern,
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
        // 재시도·재접속 시 화면을 저장된 진행분으로 교체한다 — 이게 없으면 실패한 파트의
        // 부분 본문(위기 안내 포함)이 클라이언트 화면에 남아 재생성분과 중복 표시된다.
        if (prevProgress.rawText) send({ t: "full", text: prevProgress.rawText + "\n\n" });

        // 장문 상품은 여러 파트로 나눠 쓴다. 이유가 둘이다:
        //  ① 한 호출로 12섹션을 요구하면 전 섹션이 목표의 50~76%에 그친다(2026-08-05 실측).
        //  ② 서버리스 함수 시간 제한(300초) — 한 요청에서 전부 생성하면 프로덕션에서 죽는다.
        // 그래서 "요청 1회 = 파트 1개"로 처리하고, 남은 파트가 있으면 클라이언트가 재접속한다.
        const baseParts = format.parts ?? [{ system: format.system, markers: format.markers }];
        // 동적 섹션은 마지막 파트의 사본에만 붙인다 (모듈 상수 오염 금지)
        const parts = withConcernSection
          ? baseParts.map((p, i) =>
              i === baseParts.length - 1
                ? { system: p.system + CONCERN_SECTION_SYSTEM, markers: [...p.markers, CONCERN_MARKER] }
                : p,
            )
          : baseParts;
        // 파싱용 전체 마커도 같은 기준으로 확장 — 마커 목록에 없는 섹션은
        // parseBlocks가 앞 블록 본문에 섞어버리므로 반드시 함께 늘려야 한다.
        const allMarkers =
          withConcernSection ? [...format.markers, CONCERN_MARKER] : format.markers;
        const done = prevProgress.partsDone;
        const part = parts[done];

        // 뒤 파트에는 앞부분을 넘겨 중복 서술을 막는다 (입력 토큰은 저렴)
        const prior = prevProgress.rawText
          ? `\n\n<이미_작성한_앞부분>\n${prevProgress.rawText}\n</이미_작성한_앞부분>\n위 내용과 중복되는 서술은 피하고, 지정된 섹션만 이어서 작성하세요.`
          : "";

        const claudeStream = streamReport({
          model,
          formatSystem: part.system,
          userPrompt: userPrompt + prior,
          maxTokens,
          useThinking: !isFree,
        });
        claudeStream.on("text", (delta) => {
          send({ t: "delta", text: delta });
        });

        const final = await claudeStream.finalMessage();
        const partText = final.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { text: string }).text)
          .join("");

        let rawText = prevProgress.rawText
          ? `${prevProgress.rawText}\n\n${partText}`
          : partText;
        const partsDone = done + 1;
        const isLast = partsDone >= parts.length;

        // 위기 검출 시: AI에게는 고민을 보여주지 않았고, 완성본 끝에 고정 안내를 붙인다.
        // rawText에 마커째로 넣어야 웹(rawText 분해)·PDF(blocks)·라이브 스트림이 전부 일관된다.
        const crisisMarkers =
          crisis && isLast && !isFree ? [...format.markers, CONCERN_MARKER] : null;
        if (crisisMarkers) {
          const notice = `\n\n===${CONCERN_MARKER.token}===\n${CRISIS_NOTICE}`;
          rawText += notice;
          send({ t: "delta", text: notice }); // 지금 보고 있는 사람에게도 전달
        }

        // usage는 파트별로 누적 (원가 추적 정확도 유지)
        const usage = {
          input_tokens: prevProgress.usage.input_tokens + (final.usage.input_tokens ?? 0),
          output_tokens: prevProgress.usage.output_tokens + (final.usage.output_tokens ?? 0),
          cache_creation_input_tokens:
            prevProgress.usage.cache_creation_input_tokens +
            (final.usage.cache_creation_input_tokens ?? 0),
          cache_read_input_tokens:
            prevProgress.usage.cache_read_input_tokens + (final.usage.cache_read_input_tokens ?? 0),
        };

        await db
          .update(reports)
          .set({
            // 남은 파트가 있으면 pending으로 되돌려 다음 요청이 락을 잡게 한다
            status: isLast ? "done" : "pending",
            content: {
              // 실제 본문에 존재하는 마커만으로 파싱한다. parseBlocks는 목록의 마커가
              // 하나라도 없으면 전체를 {raw}로 떨어뜨리는데, 그 상태로 done이 되면
              // PDF가 표지만 있는 빈 파일로 나간다(배포를 걸친 구버전 진행분·모델의
              // 동적 마커 누락에서 실증). 있는 것만 파싱하면 최소한 나온 섹션은 살린다.
              blocks: parseBlocks(
                rawText,
                (crisisMarkers ?? allMarkers).filter((m) =>
                  rawText.includes(`===${m.token}===`),
                ),
              ),
              rawText,
              partsDone,
            },
            model,
            usage,
            ...(isLast ? { completedAt: new Date() } : {}),
          })
          .where(eq(reports.token, token));

        send(isLast ? { t: "done" } : { t: "partial", partsDone, total: parts.length });

        // 유료 리포트 완성 → PDF 첨부 메일 자동 발송 (실제 상품 전달).
        // 실패해도 리포트 상태에는 영향 없음 — 고객은 웹/다운로드로 언제든 받을 수 있다.
        if (isLast && !isFree && report.orderId) {
          try {
            const orderRows = await db
              .select({ email: orders.email })
              .from(orders)
              .where(eq(orders.id, report.orderId))
              .limit(1);
            const to = orderRows[0]?.email;
            if (to) {
              const done = await db
                .select()
                .from(reports)
                .where(eq(reports.token, token))
                .limit(1);
              const { pdf, productName: pn } = await buildPdfForReport(done[0]);
              await sendReportPdf({
                to,
                name: persons[0].name,
                productName: pn,
                reportUrl: `${siteUrl()}/report/${token}`,
                pdf,
              });
            }
          } catch (mailErr) {
            console.error("[report-stream] PDF 메일 발송 실패 (리포트는 정상):", mailErr);
          }
        }
      } catch (err) {
        console.error("[report-stream] 생성 실패:", err);
        // failed로 종결 — 사용자가 "다시 시도"를 눌러야만 재생성 (자동 무한 재호출 금지).
        // 이미 끝난 파트는 content에 남아 있으므로 재시도 시 그 다음 파트부터 이어간다.
        await db
          .update(reports)
          .set({ status: "failed" })
          .where(eq(reports.token, token))
          .catch(() => {});
        // 유료 생성 실패 = 돈 받은 약속이 깨지는 중 — 대표에게 즉시 메일.
        // 크레딧 소진 전면 장애를 우연히 발견했던 전력이 있다(2026-08-04). 무료는 제외(소음).
        if (!isFree) {
          const msg = err instanceof Error ? err.message : String(err);
          await sendOwnerAlert(
            `유료 리포트 생성 실패 (${productCode})`,
            `토큰: ${token}\n상품: ${productCode}\n파트: ${prevProgress.partsDone + 1}\n에러: ${msg.slice(0, 500)}\n\n크레딧 소진이면 즉시 충전이 필요합니다. 고객 화면에는 "다시 시도" 버튼이 떠 있습니다.`,
          ).catch(() => {});
        }
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
