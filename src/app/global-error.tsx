"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050507] text-white">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(194,120,69,0.18),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_30%)]" />

          <section className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/80 p-8 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] sm:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-copper-500/20 bg-copper-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-copper-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              CBT League Status
            </div>

            <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
              Site update in progress
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              Something hit a bad state during this page load. Try refreshing the site,
              or head back to the homepage while the current update settles.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-copper-500 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-copper-400"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Page
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
              >
                Back To Home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
