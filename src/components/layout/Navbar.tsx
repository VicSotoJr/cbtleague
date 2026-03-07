"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Users, BarChart3, Menu, X, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Home", href: "/", icon: Trophy },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Playoffs", href: "/schedule#playoffs", icon: Trophy },
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

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 z-50 w-full transition-all duration-300",
                scrolled
                    ? "bg-black/80 backdrop-blur-md py-2 border-b border-white/10"
                    : "bg-transparent py-4"
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20 shadow-lg">
                            <img
                                src="/images/cbt-logo1.jpg"
                                alt="CBT League Logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white uppercase">
                            CBT League
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-orange-500",
                                    pathname === item.href ? "text-orange-500" : "text-zinc-400"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}

                        <div className="relative">
                            <button
                                className={cn(
                                    "flex items-center gap-1 text-sm font-medium transition-colors hover:text-orange-500",
                                    pathname.includes("/stats") ? "text-orange-500" : "text-zinc-400"
                                )}
                                onMouseEnter={() => setStatsOpen(true)}
                                onClick={() => setStatsOpen(!statsOpen)}
                            >
                                Stats <ChevronDown className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                                {statsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl"
                                        onMouseLeave={() => setStatsOpen(false)}
                                    >
                                        {statsItems.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className="block rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-orange-500"
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="rounded-full p-2 text-white hover:bg-white/10 md:hidden"
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
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-white/10 bg-zinc-950 px-4 py-6 md:hidden"
                    >
                        <div className="flex flex-col gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 text-lg font-medium",
                                        pathname === item.href ? "text-orange-500" : "text-zinc-400"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="h-px w-full bg-white/10 my-2" />
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Stats</p>
                            {statsItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-3 text-lg font-medium text-zinc-400"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <BarChart3 className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
