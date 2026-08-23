"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error("App Error caught by error boundary:", error);
  }, [error]);

  return (
    <PageShell>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md rounded-card bg-white p-8 shadow-card border border-error/30">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-2xl font-bold text-error"
          >
            ⚠️
          </span>
          <h1 className="text-2xl font-bold text-navy">เกิดข้อผิดพลาดในการทำงาน</h1>
          <p className="mt-2 text-sm text-navy/70">
            ระบบพบข้อผิดพลาดที่ไม่คาดคิด: {error.message || "Unknown error"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="gold" onClick={reset}>
              ลองใหม่อีกครั้ง
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              กลับหน้าแรก
            </Button>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
