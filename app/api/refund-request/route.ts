import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getDb, refundRequests } from "@/lib/db";
import { checkActionLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// 환불 요청 접수 — "결과가 불만족스러우면 환불" 정책의 입구.
//
// 환불 실행은 수동이다(토스 콘솔 또는 계좌이체). 이 API가 하는 일은 두 가지:
//   1) 고객이 메일 쓰는 마찰 없이 한 번에 접수하게 해서, 불만이 후기로 터지기 전에 우리에게 오게 한다
//   2) "무엇이 부족했는지"를 축적한다 — 후기는 만족한 사람만 남기므로, 우리 약점은 여기에만 기록된다
export async function POST(req: Request) {
  try {
    // 같은 사람이 폼을 도배하는 것만 막는다. 진짜 불만 고객을 막으면 안 되므로 넉넉하게.
    if (!(await checkActionLimit("refund", getClientIp(req), 10))) {
      return NextResponse.json(
        { error: "요청이 너무 많아요. 급하시면 메일로 연락 주세요." },
        { status: 429 },
      );
    }

    let body: { reportToken?: unknown; reason?: unknown; contact?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
    }

    const reportToken = typeof body.reportToken === "string" ? body.reportToken.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim().slice(0, 200) : "";

    if (!reportToken) {
      return NextResponse.json({ error: "리포트 링크를 함께 알려주세요." }, { status: 400 });
    }
    // 개선 입력이 목적이므로 최소 길이를 요구한다. "환불" 두 글자만 오면 배울 게 없다.
    if (reason.length < 10) {
      return NextResponse.json(
        { error: "어떤 점이 부족했는지 열 글자 이상 적어주세요. 그게 저희가 고칠 근거가 돼요." },
        { status: 400 },
      );
    }

    await getDb().insert(refundRequests).values({
      id: `rr_${nanoid(18)}`,
      reportToken: reportToken.slice(0, 200),
      reason: reason.slice(0, 4000),
      contact: contact || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/refund-request]", err);
    return NextResponse.json({ error: "접수 중 오류가 났어요. 메일로 연락 주세요." }, { status: 500 });
  }
}
