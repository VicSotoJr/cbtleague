import Link from "next/link";
import { ArrowRight, Trophy, Users, Calendar, Instagram, Youtube, FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <section className="relative flex h-[90vh] w-full items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-80" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-orange-600/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 flex flex-col items-center px-4 text-center md:px-6">
          <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-orange-400 backdrop-blur-md">
            <span className="mr-2 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Season 3 Underway
          </div>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tighter text-white sm:text-7xl md:text-8xl">
            CBT <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 italic">LEAGUE</span>
          </h1>

          <p className="mt-6 max-w-[600px] text-lg text-zinc-400 md:text-xl">
            Experience the most competitive adult men's basketball league. Professional atmosphere, elite competition, and historical tracking.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/schedule"
              className="flex h-14 items-center justify-center gap-2 rounded-xl bg-orange-600 px-8 text-lg font-bold text-white transition-all hover:bg-orange-700 hover:scale-105"
            >
              View Schedule
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/rules"
              className="flex h-14 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              Rules
              <FileText className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access/Stats Grid */}
      <section className="container mx-auto px-4 py-24 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "League Leaders",
              desc: "Top performers in Points, Rebounds, and Assists.",
              icon: BarChart3,
              href: "/stats/leaders",
              color: "border-orange-500/20"
            },
            {
              title: "League Rules",
              desc: "Official rules and regulations for the CBT League.",
              icon: FileText,
              href: "/rules",
              color: "border-blue-500/20"
            },
            {
              title: "All-Time Records",
              desc: "Legacy data from three full seasons of action.",
              icon: Users,
              href: "/stats/all-time",
              color: "border-green-500/20"
            }
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`group relative overflow-hidden rounded-2xl border ${item.color} bg-zinc-900/50 p-8 transition-all hover:border-white/20 hover:bg-zinc-900 hover:-translate-y-1`}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-orange-500/20">
                <item.icon className="h-6 w-6 text-white group-hover:text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-zinc-400">{item.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-orange-500">
                EXPLORE <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Social Call to Action */}
      <section className="w-full bg-zinc-950 py-20 border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Follow the action</h2>
          <div className="flex justify-center gap-8">
            <a href="https://www.instagram.com/_cbtleague/" className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm font-medium text-zinc-400">@_CBTLeague</span>
            </a>
            <a href="https://www.youtube.com/@coachbyrd7973/streams" className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Youtube className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm font-medium text-zinc-400">Coach Byrd</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
