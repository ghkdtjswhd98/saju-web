// 리포트 링크 발송 — 고객이 링크를 잃어도 다시 찾을 수 있게 하는 유일한 안전망.
// 이게 없으면 링크 유실 = 환불(원가는 이미 지출) = 순손실이고, 후기 요청도 재구매 안내도 불가능하다.
//
// RESEND_API_KEY가 없으면 조용히 건너뛴다 — 메일 실패가 결제·발급을 막아서는 안 된다.
import { Resend } from "resend";
import { SITE } from "@/lib/site";

const FROM = process.env.EMAIL_FROM || "오롭미 <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * 운영자 장애 알림 — 리포트 생성 실패를 대표에게 즉시 알린다.
 *
 * 근거(멍거 역산): 이 사업을 확실히 망하게 하는 법 중 하나가 "돈 받은 리포트가
 * 안 만들어지고 있는데 그걸 이틀 뒤에 아는 것"이다. 실제로 크레딧 소진으로
 * 전면 장애가 났던 전력이 있다(2026-08-04). 그때는 우연히 발견했다 — 이제는 메일이 온다.
 */
export async function sendOwnerAlert(subject: string, body: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — 운영자 알림 건너뜀:", subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: SITE.email,
      subject: `[오롭미 장애] ${subject}`,
      text: `${body}\n\n— 오롭미 자동 알림 (${new Date().toISOString()})`,
    });
    if (error) {
      console.error("[email] 운영자 알림 실패:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] 운영자 알림 예외:", e);
    return false;
  }
}

/**
 * 완성된 리포트 PDF를 첨부해 발송 — 리포트 생성 완료 시점에 호출된다.
 * 결제 직후 메일은 "링크 보관"용이고, 이 메일이 실제 상품 전달이다.
 * (강의 벤치마킹 2026-08-30: 상위 판매자 전원이 PDF 파일 자동 발송 — 링크보다 소장감이 크고
 *  "받은 파일"이 후기·재구매의 앵커가 된다)
 */
export async function sendReportPdf(args: {
  to: string;
  name: string;
  productName: string;
  reportUrl: string;
  pdf: Buffer;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — PDF 발송 건너뜀");
    return false;
  }
  const name = escapeHtml(args.name);
  const product = escapeHtml(args.productName);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: `${name}님의 ${args.productName} 완성 — PDF로 보내드려요 📄`,
      attachments: [
        {
          filename: `오롭미_${args.productName.replace(/[\\/:*?"<>| ]/g, "_")}_${args.name}.pdf`,
          content: args.pdf,
        },
      ],
      html: `<div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#3d3d3d;line-height:1.7">
  <p style="color:#8f7bb8;letter-spacing:4px;font-size:13px;margin:0">오롭미 | All of Me</p>
  <h1 style="font-size:20px;margin:12px 0 4px">${name}님의 ${product}가 완성됐어요</h1>
  <p style="font-size:14px;margin:0 0 16px">첨부된 PDF는 ${name}님만을 위해 방금 만들어진 파일이에요. 폰에 저장해두고 생각날 때마다 꺼내 보세요.</p>
  <p style="font-size:14px;margin:0 0 16px">웹에서 보시려면: <a href="${args.reportUrl}" style="color:#7c68a6;font-weight:bold">리포트 열기</a></p>
  <p style="font-size:14px;margin:0 0 24px">다 읽으시고 리포트 페이지 아래에서 별점과 한 줄 후기를 남겨주시면, 다음 리포트에 쓸 수 있는 혜택을 드려요 🙏</p>
  <hr style="border:none;border-top:1px solid #e4ded6;margin:24px 0">
  <p style="color:#9a948c;font-size:12px;margin:0">
    ${SITE.brandFull}<br>
    사업자등록번호 ${SITE.bizNumber} · 문의 ${SITE.email}<br>
    이 메일은 주문하신 리포트 전달을 위해 발송됐어요 (광고 메일 아님).
  </p>
</div>`,
    });
    if (error) {
      console.error("[email] PDF 발송 실패:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] PDF 발송 예외:", e);
    return false;
  }
}

export interface ReportMailArgs {
  to: string;
  name: string;
  productName: string;
  /** 리포트 링크들 (번들이면 여러 개) */
  links: { label: string; url: string }[];
}

/** 결제 완료 후 리포트 링크 발송. 실패해도 예외를 던지지 않는다(호출부의 결제 흐름 보호). */
export async function sendReportLinks(args: ReportMailArgs): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — 발송 건너뜀");
    return false;
  }

  const name = escapeHtml(args.name);
  const items = args.links
    .map(
      (l) =>
        `<li style="margin:8px 0"><a href="${l.url}" style="color:#7c68a6;font-weight:bold">${escapeHtml(l.label)} 열기</a><br><span style="color:#9a948c;font-size:12px">${l.url}</span></li>`,
    )
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      // 이 메일은 결제 직후 발송된다 — 시점상 리포트는 아직 생성 전이므로
      // "완성됐다"고 쓰면 거짓말이 된다. 이 메일의 목적은 링크 보관이다.
      subject: `${name}님의 ${args.productName} 링크예요 (보관해두세요) 🌙`,
      html: `<div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#3d3d3d;line-height:1.7">
  <p style="color:#8f7bb8;letter-spacing:4px;font-size:13px;margin:0">오롭미 | All of Me</p>
  <h1 style="font-size:20px;margin:12px 0 4px">${name}님의 리포트 링크예요</h1>
  <p style="color:#7a7a7a;font-size:14px;margin:0 0 20px">아래 링크는 만료되지 않아요. 링크를 잃어버리셔도 이 메일만 있으면 언제든 다시 열어보실 수 있어요.</p>
  <ul style="padding-left:18px;margin:0 0 24px">${items}</ul>
  <p style="font-size:14px;margin:0 0 6px">처음 여실 때 글이 쓰이는 과정이 보여요. 다 쓰이기까지 몇 분 걸릴 수 있어요.</p>
  <p style="font-size:14px;margin:0 0 6px">완성된 뒤에는 페이지 맨 아래에서 <b>PDF로 저장</b>하실 수 있어요.</p>
  <p style="font-size:14px;margin:0 0 24px">다 읽으시고 별점과 한 줄 후기를 남겨주시면 큰 힘이 됩니다 🙏</p>
  <hr style="border:none;border-top:1px solid #e4ded6;margin:24px 0">
  <p style="color:#9a948c;font-size:12px;margin:0">
    ${SITE.brandFull}<br>
    사업자등록번호 ${SITE.bizNumber} · 문의 ${SITE.email}<br>
    이 메일은 주문하신 리포트 전달을 위해 발송됐어요 (광고 메일 아님).
  </p>
</div>`,
    });
    if (error) {
      console.error("[email] 발송 실패:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] 발송 예외:", e);
    return false;
  }
}
