"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Instagram, Youtube, BarChart3 } from "lucide-react";

export default function HomeClient() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 100, damping: 20 }
        }
    };

    return (
        <main className="flex min-h-[100dvh] flex-col items-center bg-[#09090b] selection:bg-copper-500/30 selection:text-copper-200 overflow-x-hidden">
            {/* Hero Section - Centered Authoritative Architecture */}
            <section className="relative flex min-h-[90dvh] w-full items-center justify-center overflow-hidden px-4">
                {/* Subtle Background Glows */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-copper-600/5 blur-[120px]" />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial={false}
                    animate="visible"
                    className="container relative z-10 flex flex-col items-center text-center px-0"
                >
                    <motion.div
                        variants={itemVariants}
                        className="mb-8 inline-flex items-center rounded-full border border-copper-500/20 bg-copper-500/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-copper-500 backdrop-blur-md"
                    >
                        <span className="mr-3 h-2 w-2 rounded-full bg-copper-500 shadow-[0_0_12px_rgba(184,103,58,0.8)]" />
                        Season 3 • Underway
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="max-w-5xl text-5xl font-black leading-none tracking-tighter text-white sm:text-7xl md:text-9xl uppercase italic"
                    >
                        CBT <span className="text-transparent bg-clip-text bg-gradient-to-r from-copper-300 via-copper-400 to-copper-600">League</span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mt-8 max-w-[320px] text-sm font-medium leading-relaxed text-zinc-500 md:max-w-[700px] md:text-xl"
                    >
                        <span className="md:hidden">Competitive adult men&apos;s basketball with schedules, standings, and history.</span>
                        <span className="hidden md:inline">
                            Experience the most competitive adult men&apos;s basketball league. <br className="hidden md:block" />
                            Professional atmosphere, elite competition, and historical tracking.
                        </span>
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center"
                    >

                        <Link
                            href="/schedule/"
                            prefetch={false}
                            className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-copper-500 px-10 text-lg font-black uppercase italic tracking-tighter text-white transition-all hover:bg-copper-600 active:scale-95 shadow-[0_20px_40px_-15px_rgba(194,120,69,0.4)]"
                        >
                            Explore Schedule
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/rules/"
                            prefetch={false}
                            className="flex h-16 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-10 text-lg font-black uppercase italic tracking-tighter text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95"
                        >
                            Rules
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Featured Bento Grid */}
            <section className="container mx-auto px-4 py-24 md:px-6 md:py-32">
                <div className="mb-16 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 flex items-center gap-3">
                        <div className="h-px w-8 bg-copper-500/50" />
                        Explore
                    </h2>
                    <h3 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">League <span className="text-copper-500">Hub</span></h3>
                </div>

                <div className="grid gap-6 md:grid-cols-12 md:grid-rows-2 h-auto md:h-[700px]">
                    {/* Big Feature Card */}
                    <Link
                        href="/stats/leaders/"
                        prefetch={false}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/50 p-6 transition-all hover:bg-zinc-900 hover:scale-[1.01] sm:p-8 md:col-span-8 md:row-span-2 md:p-12"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-40 w-40 text-white sm:h-52 sm:w-52 md:h-64 md:w-64" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-2xl font-black text-white uppercase italic leading-none tracking-tighter sm:text-3xl md:text-5xl">League <br /> Leaders</h4>
                            <p className="mt-6 max-w-sm text-base text-zinc-500 leading-relaxed font-medium md:text-lg">Top performers in Points, Rebounds, and Assists.</p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 text-sm font-black text-copper-500 uppercase tracking-widest group-hover:gap-5 transition-all">
                            EXPLORE <ArrowRight className="h-4 w-4" />
                        </div>
                    </Link>

                    {/* Smaller Feature Cards */}
                    <Link
                        href="/teams/"
                        prefetch={false}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/50 p-6 transition-all hover:bg-zinc-900 hover:scale-[1.01] sm:p-8 md:col-span-4 md:p-10"
                    >
                        <Users className="h-10 w-10 text-copper-500 mb-6" />
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Teams</h4>
                            <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-medium">Rosters, records, and team pages for every season.</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-copper-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all group-hover:gap-3">
                            EXPLORE <ArrowRight className="h-3 w-3" />
                        </div>
                    </Link>

                    <Link
                        href="/stats/all-time/"
                        prefetch={false}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/50 p-6 transition-all hover:bg-zinc-900 hover:scale-[1.01] sm:p-8 md:col-span-4 md:p-10"
                    >
                        <Trophy className="h-10 w-10 text-copper-500 mb-6" />
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">All-Time Records</h4>
                            <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-medium">Career leaders and league history across every season.</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-copper-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all group-hover:gap-3">
                            EXPLORE <ArrowRight className="h-3 w-3" />
                        </div>
                    </Link>
                </div>
            </section>

            {/* The Commissioner Section */}
            <section className="container mx-auto px-4 py-12 md:px-6">
                <div className="flex items-center gap-4 border-l-2 border-copper-500 pl-6">
                    <Trophy className="h-6 w-6 text-copper-500 shrink-0" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">Commissioner</p>
                        <p className="text-lg font-black uppercase tracking-tight text-white">
                            Coach <span className="text-copper-500">Byrd</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Social Signal */}
            <section className="w-full bg-[#09090b] py-24 border-t border-white/5 md:py-32">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Stay <span className="text-copper-500">Connected</span></h2>
                            <p className="mt-4 text-zinc-500 font-medium">Join our community on social media to catch live streams, highlights, and league updates.</p>
                        </div>

                        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                            <a
                                href="https://www.instagram.com/_cbtleague/"
                                target="_blank"
                                rel="noreferrer"
                                className="group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 hover:bg-white/10 transition-all sm:w-auto sm:px-8 sm:py-6"
                            >
                                <Instagram className="h-8 w-8 text-copper-500" />
                                <div className="text-left leading-none">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Follow us</p>
                                    <p className="text-lg font-bold text-white uppercase tracking-tighter">Instagram</p>
                                </div>
                            </a>
                            <a
                                href="https://www.youtube.com/@coachbyrd7973/streams"
                                target="_blank"
                                rel="noreferrer"
                                className="group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 hover:bg-white/10 transition-all sm:w-auto sm:px-8 sm:py-6"
                            >
                                <Youtube className="h-8 w-8 text-red-500" />
                                <div className="text-left leading-none">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Watch Live</p>
                                    <p className="text-lg font-bold text-white uppercase tracking-tighter">YouTube</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            {/* Footer */}
            <footer className="w-full py-12 border-t border-white/5 text-center">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-700">© 2026 CBT League. All Rights Reserved.</p>
            </footer>
        </main >
    );
}
