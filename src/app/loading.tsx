import { PageShell } from "../components/layout/PageShell";

export default function Loading() {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
        <p className="text-sm font-semibold text-navy/70">กำลังโหลดข้อมูล…</p>
      </div>
    </PageShell>
  );
}
