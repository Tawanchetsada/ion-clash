import Link from "next/link";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-card bg-white p-8 shadow-card border border-border">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy"
          >
            404
          </span>
          <h1 className="text-2xl font-bold text-navy">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="mt-2 text-sm text-navy/70">
            หน้าที่คุณค้นหาไม่มีอยู่ในระบบ หรือเลขด่านไม่ถูกต้อง
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/levels"
              className="min-h-11 inline-flex items-center justify-center rounded-card bg-gold px-5 py-2 font-bold text-navy shadow-card transition-colors hover:bg-gold/90"
            >
              เลือกด่าน
            </Link>
            <Link
              href="/"
              className="min-h-11 inline-flex items-center justify-center rounded-card border border-navy/20 px-5 py-2 font-semibold text-navy hover:bg-navy/5"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
