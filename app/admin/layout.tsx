// 운영자 콘솔만 라이트 유지 — body가 theme-night라 여기서 day 토큰을 복원한다(헤더·푸터는 다크 그대로)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-day min-h-screen bg-bg text-ink">{children}</div>;
}
