// 랜딩 FAQ — 롱테일 검색 질의에 대응 + FAQPage 구조화 데이터
const FAQS: { q: string; a: string }[] = [
  {
    q: "정말 회원가입 없이 무료로 사주를 볼 수 있나요?",
    a: "네. 이름(별칭 가능), 성별, 생년월일, 태어난 시간만 입력하면 30초 안에 무료 결과가 나와요. 회원가입, 앱 설치, 카드 등록이 전혀 필요 없어요. 무료 결과는 1인당 하루 3회까지 볼 수 있어요.",
  },
  {
    q: "AI 사주는 팔자를 틀리게 계산한다던데, 여기는 다른가요?",
    a: "가장 큰 차이점이에요. 일반 AI 챗봇에게 사주를 물으면 사주팔자 계산 자체를 추측으로 처리해 틀리는 경우가 많아요. 오롭미는 만세력 데이터 기반 결정론적 알고리즘으로 팔자·오행·십신을 먼저 확정하고, AI는 그 확정된 값의 해석만 담당해요. 계산이 틀릴 수 없는 구조예요.",
  },
  {
    q: "태어난 시간을 모르면 못 보나요?",
    a: "볼 수 있어요. 시간을 '모름'으로 선택하면 년주·월주·일주 세 기둥을 중심으로 해석해드려요. 시간까지 알면 더 정밀해지지만, 몰라도 충분히 의미 있는 결과가 나와요.",
  },
  {
    q: "음력 생일도 되나요?",
    a: "네. 음력(윤달 포함)으로 입력하면 자동으로 양력으로 변환해 계산해요. 1900~2050년 사이 출생이면 모두 지원돼요.",
  },
  {
    q: "유료 리포트는 무료와 뭐가 다른가요?",
    a: "무료는 타고난 기질과 의식하면 좋은 그늘, 올해의 힌트까지 담은 맛보기예요. 유료 리포트는 재물운, 직업운, 연애운, 건강운, 나이별 인생 흐름(대운 시간표)까지 7,000자 안팎의 심층 해석을 담아요. 결제 즉시 생성되고, 발급된 링크로 언제든 다시 볼 수 있어요.",
  },
  {
    q: "결과가 매번 달라지지 않나요?",
    a: "팔자·오행·별점은 계산값이라 언제 봐도 동일해요. 해석 문장은 AI가 짓기 때문에 표현은 조금씩 다를 수 있지만, 같은 계산값을 근거로 하므로 내용의 방향은 일관돼요.",
  },
];

export default function LandingFaq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-center text-lg font-bold">자주 묻는 질문</h2>
      <div className="mt-5 space-y-2">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-card px-5 py-4">
            <summary className="cursor-pointer list-none text-[15px] font-medium">
              {f.q}
              <span className="float-right text-ink-soft transition group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
