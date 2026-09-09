import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

// 옛 포스터 주소(/brand/poster?product=code) 호환용 — 포스터 생성기는 app/brand/poster/[code]/route.tsx로 옮겨
// 빌드 때 정적 생성한다(love119 모바일 벤치마킹 권고 1). 카톡·SNS에 이미 공유된 OG 링크가 깨지지 않게 308만 남긴다.
export function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("product") ?? "";
  if (!getProduct(code)) return new Response("bad product", { status: 400 });
  return NextResponse.redirect(new URL(`/brand/poster/${code}`, url), 308);
}
