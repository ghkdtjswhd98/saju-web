import type { Metadata } from "next";
import AdminTabs from "@/components/AdminTabs";

export const metadata: Metadata = {
  title: "운영자 콘솔",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <AdminTabs />
    </div>
  );
}
