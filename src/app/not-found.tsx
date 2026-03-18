import Link from "next/link";
import { ArrowRight, Clock3, ShieldAlert, Wrench } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#050507] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(194,120,69,0.18),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(232,180,134,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-copper-500/40 to-transparent" />
        <div className="absolute left-[8%] top-[18%] h-36 w-36 rounded-full border border-copper-500/10 bg-copper-500/10 blur-3xl" />
        <div className="absolute bottom-[12%] right-[10%] h-40 w-40 rounded-full border border-white/8 bg-white/6 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100dvh-10rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-copper-500/20 bg-copper-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-copper-100">
              <Clock3 className="h-3.5 w-3.5" />
              CBT League Service Notice
            </div>

            <h1 className="max-w-3xl text-5xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Under
              <span className="block bg-gradient-to-r from-copper-200 via-copper-400 to-copper-600 bg-clip-text text-transparent">
                Maintenance
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              The CBT League site is getting tuned up right now. Schedules, standings,
              and player pages will be back as soon as the current update finishes
              rolling out.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-copper-500 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-copper-400"
              >
                Return Home
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/schedule/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
              >
                Try Schedule
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-copper-500/20 via-transparent to-white/5 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-500">
                    System Status
                  </p>
                  <p className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
                    League Control Room
                  </p>
                </div>
                <div className="rounded-2xl border border-copper-500/20 bg-copper-500/10 p-3 text-copper-200">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "Public Site",
                    value: "Temporarily offline",
                    tone: "text-copper-200",
                  },
                  {
                    label: "Current Task",
                    value: "Rolling out updates and asset fixes",
                    tone: "text-white",
                  },
                  {
                    label: "Next Check",
                    value: "Refresh in a few minutes",
                    tone: "text-zinc-200",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      {item.label}
                    </p>
                    <p className={`mt-2 text-lg font-bold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-copper-200">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      Note
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      If you reached this page from a broken deploy, the next publish should
                      replace it automatically once the update finishes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
