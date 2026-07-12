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
