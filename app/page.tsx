import Link from "next/link";
import FreeForm from "@/components/FreeForm";
import LandingFaq from "@/components/LandingFaq";
import Orobi from "@/components/Orobi";
import ReviewList from "@/components/ReviewList";
import CategoryChips from "@/components/home/CategoryChips";
import PosterCarousel, { type PosterCarouselItem } from "@/components/home/PosterCarousel";
import ProductRail from "@/components/home/ProductRail";
import { isLaunchActive, LAUNCH_END } from "@/lib/launch";
import { POSTER_PORTRAIT_BG } from "@/lib/poster-art";
import { getPricing } from "@/lib/pricing";
import { PRODUCTS, type ProductCode } from "@/lib/products";

// 단계 가격 반영을 위해 60초 캐시
export const revalidate = 60;

// 전면 캐러셀 5장 — 가격 사다리 상단부터 (스펙 고정 순서)
const CAROUSEL_CODES: ProductCode[] = ["deep", "bundle", "reunion", "marriage", "year"];

// 오픈특가 뱃지 문구 — 마감일은 lib/launch.ts가 진실의 원천이라 KST 기준 월/일을 거기서 뽑는다
function launchBadgeLabel(): string | undefined {
  if (!isLaunchActive()) return undefined;
  const kst = new Date(LAUNCH_END.getTime() + 9 * 60 * 60 * 1000);
  return `오픈특가 · ${kst.getUTCMonth() + 1}/${kst.getUTCDate()}까지`;
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9A9DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// 친구 섹션 카드 공통 껍데기 — 탭 영역은 아이콘 42px + 패딩으로 56px(모바일 44px 이상)
function ToolCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const cls = "flex min-h-11 items-center gap-3 rounded-[14px] border border-line bg-card p-3.5";
  const body = (
    <>
      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-bg">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-xs leading-[17px] text-ink-soft">{desc}</span>
      </span>
      <Chevron />
    </>
  );
  // FreeForm이 mode를 마운트 시 1회만 읽어서 /?mode=couple은 새 요청이어야 한다 — 그래서 Link 대신 a
  if (href.startsWith("/?")) return <a href={href} className={cls}>{body}</a>;
  return <Link href={href} className={cls}>{body}</Link>;
}

// 카카오톡 채널 카드 — 채널 URL(NEXT_PUBLIC_KAKAO_CHANNEL_URL)이 있을 때만 그린다. 없으면 0바이트.
function KakaoChannelCard() {
  const url = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL;
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-line bg-card p-3.5">
      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#FEE500]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#191919" aria-hidden="true">
          <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.2 4.6 6.6L5.5 21l4.4-2.6c.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-bold text-ink">카카오톡 채널 추가</span>
        <span className="text-xs leading-[17px] text-ink-soft">새 리포트·쿠폰 소식을 카톡으로</span>
        <a
          href={`${url.replace(/\/+$/, "")}/friend`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-[#FEE500] px-4 text-[13px] font-bold text-[#191919] transition hover:opacity-90"
        >
          채널 추가하고 소식 받기
        </a>
      </span>
    </div>
  );
}

export default async function Home() {
  const pricing = await getPricing();
  const launchBadge = launchBadgeLabel();
  const carousel: PosterCarouselItem[] = CAROUSEL_CODES.map((code) => {
    const p = PRODUCTS[code];
    return {
      code,
      shortName: p.shortName,
      cardTitle: p.cardTitle,
      pdfPages: p.pdfPages,
      current: pricing.prices[code].current,
      list: pricing.prices[code].list,
      bg: POSTER_PORTRAIT_BG[code],
    };
  });

  return (
    // 다크 바닥은 body(theme-night)가 깔고, 콘텐츠는 앱 셸(430px) 폭 — 데스크톱에서도 같은 폭
    // scroll-mt-16: "전체" 칩(#top)으로 돌아올 때 sticky 헤더에 칩 행이 가려지지 않게
    <div id="top" className="scroll-mt-16">
      <div className="mx-auto max-w-[430px] pb-10">
        {/* 칩 앵커 자체가 44px(h-11)라 위 7px 여백을 이미 포함 — 별도 pt 없이 바로 배치 */}
        <CategoryChips />

        <PosterCarousel items={carousel} launchBadge={launchBadge} />

        {/* 훅 + 무료 폼 — 다크 위 헤드라인, 폼은 paper 클래스로 라이트 토큰을 복원해 크림 카드 유지 */}
        <section className="px-4 pt-7">
          <div className="flex flex-col items-center text-center">
            <Orobi size={44} halo="none" />
            <h1 className="mt-3 text-[21px] font-bold leading-[1.4] tracking-[-0.3px] text-[#FAF7F2]">
              헤어진 그 사람, 올해 내 운, 결혼 시기
              <br />— 사주는 뭐라고 할까요?
            </h1>
            <p className="mt-2 text-[13px] leading-normal text-ink-soft">회원가입 없이 30초 · 만세력으로 정확하게</p>
          </div>
          <div
            id="free"
            className="paper mt-4 scroll-mt-16 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
          >
            <FreeForm />
          </div>
        </section>

        <ProductRail
          id="rail-reco"
          title="오롭미 추천"
          subtitle="먼저 보면 좋은 3종"
          codes={["deep", "bundle", "lifetime"]}
          pricing={pricing}
        />
        <ProductRail
          id="rail-love"
          title="연애가 고민이라면"
          subtitle="두 사람 사주로 봐요"
          codes={["reunion", "crush", "love", "marriage", "dohwa"]}
          pricing={pricing}
        />
        <ProductRail
          id="rail-money"
          title="일과 돈, 그리고 나"
          subtitle="내 팔자 하나로 봐요"
          codes={["career", "year", "lifetime"]}
          pricing={pricing}
        />

        {/* 친구 섹션 — 바이럴 루프 진입점 3카드 (케미 순위 → 궁합 → 오행 테스트) + 카카오 채널 */}
        <section className="px-5 pt-6">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[17px] font-bold text-ink">친구랑 같이 해보세요</h2>
            <p className="text-xs text-ink-soft">로그인 없이 바로</p>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            <ToolCard
              href="/chemi"
              title="친구 케미 순위"
              desc="내 링크 보내면 친구가 생일만 넣어요 — 누가 나랑 제일 잘 맞는지 순위가 쌓여요"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20V10M12 20V4M20 20v-7" />
                  <path d="M2 20h20" />
                </svg>
              }
            />
            <ToolCard
              // #free: 새 레이아웃은 폼이 첫 화면 아래라 리로드 후 폼까지 스크롤시킨다(location.search는 그대로 ?mode=couple)
              href="/?mode=couple#free"
              title="우리 궁합"
              desc="두 사람 생년월일만 넣으면 오행 케미 점수가 나와요"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="12" r="5" />
                  <circle cx="15" cy="12" r="5" />
                </svg>
              }
            />
            <ToolCard
              href="/test/ohaeng"
              title="오행 캐릭터 테스트"
              desc="생년월일 몰라도 OK — 12문항 1분이면 내 기운이 나와요"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15 9l-2 6-4 2 2-6z" />
                </svg>
              }
            />
          </div>
          <div className="mt-2.5">
            <KakaoChannelCard />
          </div>
        </section>

        {/* 수다방 티저 — 아직 없는 기능이라 버튼 없이 예고만 */}
        <section className="px-5 pt-3">
          <div className="flex items-center gap-3 rounded-[14px] border border-line bg-card p-3.5">
            <div className="shrink-0">
              <Orobi size={52} halo="none" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-ink">수다방</p>
                <span className="flex h-[18px] items-center rounded-full bg-accent-soft px-[7px] text-[10px] font-bold text-[#CFC8DD]">
                  준비 중
                </span>
              </div>
              <p className="self-start rounded-[12px_12px_12px_3px] border border-line bg-bg px-[11px] py-2 text-xs leading-[17px] text-ink">
                오늘 뭐가 제일 마음에 걸려요? 내 원국 보면서 같이 얘기해봐요.
              </p>
              <p className="text-[11px] leading-[15px] text-ink-soft">카톡하듯 사주 수다 · 하루 1번 무료</p>
            </div>
          </div>
        </section>

        {/* 신뢰 스트립 3칸 — 전부 실제로 지키는 약속만 */}
        <section className="px-5 pt-6">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-card px-3 py-3.5">
            <div className="flex flex-col items-center gap-2 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
              <p className="text-xs font-bold leading-4 text-ink">만세력으로 계산</p>
              <p className="text-[11px] leading-[15px] text-ink-soft">
                팔자는 데이터로,
                <br />
                AI는 해석만
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 border-x border-line text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12l-8 8-9-9V4h7z" />
                <circle cx="7.5" cy="7.5" r="1.5" />
              </svg>
              <p className="text-xs font-bold leading-4 text-ink">실판매가만 표기</p>
              <p className="text-[11px] leading-[15px] text-ink-soft">
                부풀린 정가·
                <br />
                가짜 마감 없음
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFE9A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <p className="text-xs font-bold leading-4 text-ink">자동 환불</p>
              <p className="text-[11px] leading-[15px] text-ink-soft">
                생성 실패 시 환불,
                <br />
                PDF 미수신 재발송
              </p>
            </div>
          </div>
        </section>

        {/* 어떻게 계산하나요 — 1문단 축약 */}
        <section className="px-5 pt-6">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-sm font-bold tracking-widest text-accent">어떻게 계산하나요</h2>
            <p className="mt-3 text-sm leading-6 text-ink">
              입력한 생년월일시를 만세력 데이터(1900~2050년, 절기·음력 변환 포함)와 대조해 사주팔자 여덟
              글자를 확정하고, 일간을 기준으로 오행·십신·신살을 결정론적 알고리즘으로 계산해요. AI는 그
              확정된 계산값만을 근거로 해석문을 지어서, 챗봇 사주에서 흔한 &quot;팔자 자체가 틀리는
              문제&quot;가 구조적으로 불가능해요. 같은 생년월일시면 언제나 같은 결과가 나와요.
            </p>
          </div>
        </section>

        <div className="px-5">
          <ReviewList limit={4} />
          <LandingFaq />
        </div>
      </div>
    </div>
  );
}
