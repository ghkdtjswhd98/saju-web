import type { Metadata } from "next";
import AdminConsole from "@/components/AdminConsole";

export const metadata: Metadata = {
  title: "운영자 콘솔",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <AdminConsole />
    </div>
  );
}
