import type { MetadataRoute } from "next";
import { ILGAN_LIST } from "@/lib/ilgan-content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// 정적 공개 페이지만 노출 — 개인 결과 페이지(/free, /report)는 제외
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/test/ohaeng`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/ilgan`, changeFrequency: "monthly", priority: 0.7 },
    ...ILGAN_LIST.map((i) => ({
      url: `${SITE_URL}/ilgan/${i.key}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/refund`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
