"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Users, BarChart3, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Home", href: "/", icon: Trophy },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Standings", href: "/standings", icon: Trophy },
    { name: "Teams", href: "/teams", icon: Users },
];

const statsItems = [
    { name: "Team Stats", href: "/stats/teams" },
    { name: "Player Stats", href: "/stats/players" },
    { name: "League Leaders", href: "/stats/leaders" },
    { name: "All-Time Records", href: "/stats/all-time" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const pathname = usePathname();
    const normalizedPathname = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

    return (
        <nav
            className={cn(
                "fixed top-0 z-50 w-full transition-all duration-500",
                scrolled
                    ? "py-3"
                    : "py-6"
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className={cn(
                    "flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-500",
                    scrolled
                        ? "bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-[inner_0_1px_0_rgba(255,255,255,0.1)] shadow-2xl"
                        : "bg-transparent border-transparent"
                )}>
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Image
                                src={`${basePath}/images/cbt-logo1.jpg`}
                                alt="CBT League Logo"
                                fill
                                sizes="40px"
                                priority
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                            CBT <span className="text-white">LEAGUE</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-2 md:flex">
                        {navItems.map((item) => {
                            const isActive = normalizedPathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href === "/" ? "/" : `${item.href}/`}
                                    prefetch={false}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-bold transition-colors uppercase tracking-tight",
                                        isActive ? "text-white" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 z-0 rounded-lg bg-copper-600/10 border border-copper-500/20"
                                            transition={springConfig}
                                        />
                                    )}
                                    <span className="relative z-10">{item.name}</span>
                                </Link>
                            );
                        })}

                        <div className="relative pl-4 ml-4 border-l border-white/10">
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-1 text-sm font-bold transition-colors hover:text-white uppercase tracking-tight",
                                    pathname.includes("/stats") ? "text-copper-500" : "text-zinc-500"
                                )}
                                aria-expanded={statsOpen}
                                aria-haspopup="menu"
                                onMouseEnter={() => setStatsOpen(true)}
                                onClick={() => setStatsOpen(!statsOpen)}
                            >
                                Stats <ChevronDown className={cn("h-4 w-4 transition-transform", statsOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {statsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-4 w-56 rounded-2xl border border-white/10 bg-zinc-950/90 p-2 shadow-2xl backdrop-blur-xl"
                                        onMouseLeave={() => setStatsOpen(false)}
                                    >
                                        <div className="grid gap-1">
                                            {statsItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={`${item.href}/`}
                                                    prefetch={false}
                                                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-400 hover:bg-copper-600/10 hover:text-copper-500 transition-all uppercase tracking-widest"
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="rounded-xl bg-white/5 border border-white/10 p-2 text-white hover:bg-white/10 md:hidden active:scale-95 transition-all"
                        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isOpen}
                        aria-controls="mobile-navigation"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="mobile-navigation"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-x-4 top-24 z-40 rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl md:hidden"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href === "/" ? "/" : `${item.href}/`}
                                        prefetch={false}
                                        className={cn(
                                            "flex items-center gap-4 rounded-2xl px-4 py-4 text-xl font-black uppercase italic tracking-tighter transition-all",
                                            normalizedPathname === item.href ? "bg-copper-600 text-white shadow-lg shadow-copper-600/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <item.icon className="h-6 w-6" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Statistical Analysis</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {statsItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={`${item.href}/`}
                                            prefetch={false}
                                            className="flex flex-col gap-1 rounded-2xl bg-white/5 p-4 text-sm font-bold text-zinc-400 hover:text-copper-500 transition-all uppercase tracking-tight"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            <span className="leading-tight">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
