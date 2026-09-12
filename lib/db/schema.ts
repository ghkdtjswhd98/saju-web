import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 주문 — 결제 검증의 진실의 원천. amount는 서버 카탈로그에서 확정한 값만 저장.
export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // "ord_" + nanoid — 토스 orderId로 그대로 사용
  productCode: text("product_code").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending | paid | failed | canceled
  paymentKey: text("payment_key"),
  inputData: jsonb("input_data").notNull(), // { persons: PersonInput[] }
  reportToken: text("report_token"), // 결제 승인 시 발급된 리포트 토큰
  // 고객 식별자 — 링크 재발송·후기 요청·재구매 안내의 유일한 경로.
  // 이게 없으면 링크를 잃은 고객은 환불밖에 답이 없고(원가는 이미 지출), 후기도 재구매도 불가능하다.
  // 수집 근거: 전자상거래법상 계약 내용·이행 통지 (개인정보처리방침에 목적 명시)
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

// 리포트 — 무료(free)/유료 공통. token이 조회 키(추측 불가 nanoid).
export const reports = pgTable(
  "reports",
  {
    token: text("token").primaryKey(), // nanoid(24)
    orderId: text("order_id").references(() => orders.id),
    productCode: text("product_code").notNull(), // free | lifetime | love | year | career
    inputData: jsonb("input_data").notNull(), // { persons: PersonInput[] }
    inputHash: text("input_hash"), // 무료 결과 24h 중복 방지용
    sajuData: jsonb("saju_data").notNull(), // computeAll 스냅샷 (궁합은 배열)
    content: jsonb("content"), // { blocks: Record<string,string>, rawText: string }
    model: text("model"),
    status: text("status").notNull().default("pending"), // pending | generating | done | failed
    usage: jsonb("usage"), // { input_tokens, output_tokens, ... } 원가 추적
    generatingAt: timestamp("generating_at", { withTimezone: true }), // 생성 락 시각 — 고착 복구용
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("reports_input_hash_idx").on(t.inputHash)],
);

// 무료 맛보기 IP 레이트리밋 — key = "{ip}:{yyyy-mm-dd}"
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 환불 요청 — "결과가 불만족스러우면 환불" 정책의 접수 창구.
//
// 환불 실행 자체는 수동(토스 콘솔/계좌이체)이지만, 여기 쌓이는 reason이 진짜 자산이다.
// 후기는 만족한 사람만 남기므로, 우리 리포트가 어디서 부족한지는 이 테이블에만 기록된다.
// 이 사유들이 다음 프롬프트 개선의 입력이 된다.
export const refundRequests = pgTable("refund_requests", {
  id: text("id").primaryKey(), // "rr_" + nanoid
  reportToken: text("report_token").notNull(), // reports 참조하지 않음 — 토큰이 틀려도 접수는 받는다
  reason: text("reason").notNull(), // 어떤 점이 부족했는지 (개선 입력)
  contact: text("contact"), // 회신받을 이메일/연락처 (선택)
  resolved: integer("resolved").notNull().default(0), // 0=접수 1=처리완료
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 후기 — 리포트 토큰 기반(실보유자만 작성 가능), 리포트당 1건.
// isTester: 주문 없이 발급된 리포트(체험단 증정)의 후기 — 공정위 지침에 따라 "체험단" 라벨 표기용
export const reviews = pgTable("reviews", {
  reportToken: text("report_token").primaryKey().references(() => reports.token),
  rating: integer("rating").notNull(), // 1~5
  text: text("text").notNull(),
  displayName: text("display_name").notNull(), // "지민***" 형태 익명화
  productCode: text("product_code").notNull(),
  isTester: integer("is_tester").notNull().default(0), // 0=구매, 1=체험단
  // 대가성 표시 — 공정위 「추천·보증 등에 관한 표시·광고 심사지침」상 대가를 받은 후기는
  // 그 사실을 후기와 같은 화면에 표시해야 한다. none=대가없음 tester=체험단제공 coupon=리워드제공
  rewardType: text("reward_type").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 후기 리워드 쿠폰 — 후기를 남긴 분께 1회용 코드를 발급한다.
//
// ⚠️ 별점과 무관하게 발급한다. 좋은 후기에만 주면 리뷰 조작이고 공정위 제재 대상이다.
// 사용 처리는 수동(운영자 콘솔) — 당근 채팅이 주 채널이라 자동 결제 연동보다 이쪽이 현실적이다.
export const couponCodes = pgTable("coupon_codes", {
  code: text("code").primaryKey(), // "OROB-XXXX-XXXX" — 채팅에 불러주기 좋은 형태
  kind: text("kind").notNull(), // "review" 등 발급 사유
  benefit: text("benefit").notNull(), // 사람이 읽는 혜택 설명
  issuedForToken: text("issued_for_token").notNull().unique(), // 리포트당 1장
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedNote: text("used_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 케미 초대 링크 — "친구 중 누가 나랑 제일 잘 맞을까?" 바이럴 루프(스펙 2026-08-17 1단계).
// sajuSubset에는 케미 계산에 필요한 파생값(지지·오행 분포)만 담는다 — 생년월일 원본은 URL에도 서버에도 없다.
export const chemiLinks = pgTable("chemi_links", {
  code: text("code").primaryKey(), // 8자 무작위 — 공유 URL 조각(/chemi/{code})
  nickname: text("nickname").notNull(), // 링크 주인 별명 (친구 랜딩 "{nickname}님과 너의 케미는?")
  sajuSubset: jsonb("saju_subset").notNull(), // ChemiSubset { branches, elements }
  ownerKey: text("owner_key").notNull(), // 32자 무작위 — 주인만 순위 전체 열람 (localStorage 보관)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 친구 응답 — 링크당 여러 건이 쌓여 케미 순위판이 된다. 친구의 파생값도 저장하지 않는다(점수·라벨만).
export const chemiReplies = pgTable(
  "chemi_replies",
  {
    id: text("id").primaryKey(), // "cr_" + nanoid
    linkCode: text("link_code").notNull().references(() => chemiLinks.code),
    nickname: text("nickname").notNull(),
    score: integer("score").notNull(), // 58~96
    label: text("label").notNull(), // 점수 구간별 긍정 한 줄 (저장 시점 문구 고정)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chemi_replies_link_code_idx").on(t.linkCode)],
);
