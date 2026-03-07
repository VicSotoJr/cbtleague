import React from "react";
import { Metadata } from "next";
import { ShieldAlert, FileText, Ban, Scale, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
    title: "Rule Book | CBT League",
    description: "Official rules and policies of the CBT League.",
};

const rules = [
    {
        icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
        title: "Punctuality",
        desc: "Please arrive to games on time. (mandatory). There will be a 15 min grace period but the games will start approximately at 5:45, 6:45, and 7:45 if we have enough to start the game. The team present gets an automatic win. The refs will leave if you don’t show up on time."
    },
    {
        icon: <Ban className="h-6 w-6 text-red-500" />,
        title: "No Nonsense Policy",
        desc: "This is a no NONSENSE league. I am more than fair but if you and your team become disrespectful to the staff or to other opponents, then the police will be called ASAP. The league will not tolerate any bs."
    },
    {
        icon: <Scale className="h-6 w-6 text-blue-500" />,
        title: "Gym Access Only",
        desc: "You’re only allowed in the gym. If you have to use the bathroom outside the gym you can but don’t wander around the halls. This is a middle school & it was very, very hard to get this gym for this adult men’s league so don’t ruin it for everyone else. Please!"
    },
    {
        icon: <ShieldAlert className="h-6 w-6 text-yellow-500" />,
        title: "Respect the Refs",
        desc: "Don’t give refs a hard time. I get the games will be intense but don’t be disrespectful and want to fight or threaten the refs. That’s an automatic disqualification from the league (No Exceptions)."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "Uniforms",
        desc: "You must wear your CBT jersey every game. This is mandatory. If you don't, you are not allowed to play."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "Playoff Eligibility",
        desc: "Individuals must play in a minimum 4 games to qualify for playoffs."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "Roster Locks",
        desc: "Rosters will be locked Week 3. That means you can not add anyone new to the team."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "Waivers",
        desc: "Everyone must sign a waiver to play in this league."
    },
    {
        icon: <Ban className="h-6 w-6 text-red-500" />,
        title: "No Weapons",
        desc: "No weapons!!! I shouldn’t even have to say this but you don’t know anybody more. Keep the peace!!!"
    },
    {
        icon: <Ban className="h-6 w-6 text-red-500" />,
        title: "League Removal",
        desc: "Another reminder, this a no nonsense league. If you continue to be a problem, you will be kicked out of the league without getting your money back. I’m very, very serious. Don’t ruin it for everyone else."
    },
    {
        icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
        title: "Forfeits",
        desc: "If you text or call me that your team has to forfeit the game, then that’s an automatic Loss. No turning back."
    },
    {
        icon: <Ban className="h-6 w-6 text-red-500" />,
        title: "No Hanging on Rim",
        desc: "No hanging on rim at all before and during the game."
    },
    {
        icon: <Scale className="h-6 w-6 text-blue-500" />,
        title: "Score Table Space",
        desc: "Nobody is allowed to be near the scores table complaining about stats."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "Game Clock",
        desc: "Each game has a 10 min running clock even on free throws. Last 2 mins in the 4th the clock will stop."
    },
    {
        icon: <FileText className="h-6 w-6 text-zinc-400" />,
        title: "4th Quarter Clock",
        desc: "4th quarter clock will run after made shot under 2 mins. It only stops for dead balls, timeouts and free throws."
    }
];

const policies = [
    "We’ll be cracking down on Technical fouls moving forward. Any swearing at refs or threatening refs will be an automatic technical foul.",
    "Same rules as the CIAC. After five team fouls in a quarter the opposing team is in the bonus and shoots two free throws. There is no one-and-one.",
    "2 techs the same game will result in being removed from the game.",
    "If you don’t leave the court after we tell you multiple times your team will get a team technical foul again & you will be removed from the league immediately for disrupting the league.",
    "A technical foul would count towards the players foul & the teams foul.",
    "Timeouts: Each team will be awarded two timeouts per half. The timeouts do not carry over.",
    "Spectators can come and watch the games but we will not be allowing people to argue with the refs and threatening them or the other team. You will be asked to leave and if you don’t leave we will be calling the police.",
    "If fan behavior becomes excessive, we will have to consider switching to player-only attendance. Please remind everyone you bring that this is a men's league - keep it respectful and keep it under control.",
    "If someone on the team gets hurt and can't make the 4 games, please notify me so you are eligible for playoffs.",
    "No trades in the league. You stay on the same team all year around.",
    "If you quit, you quit. There is no coming back and there are no refunds.",
    "NO SMOKING ON SCHOOL PROPERTY!",
    "Refs will not be replaced, It will be the same refs all season long.",
    "Game Policy: If any major altercation occurs, the team responsible for starting it will forfeit the game no matter what the score is. Final authority on all such decisions will rest with Coach Byrd, not the referees.",
    "If a situation between two players becomes too heated, both players will be required to sit out for two (2) minutes of game time to cool down."
];

export default function RulesPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl uppercase">
                    CBT <span className="text-orange-500">Rule Book</span>
                </h1>
                <p className="mt-6 text-lg text-zinc-400 leading-relaxed border-l-4 border-orange-500 pl-4 bg-orange-500/5 p-4 rounded-r-lg">
                    Hey guys. Welcome to the CBT League. There are a few things I want to
                    go over with each and every team. I will do my best to make sure this
                    league runs smoothly and no issues happen but it’s your responsibility
                    to follow these rules so we can meet each other half way. If you have
                    any questions about anything, please reach out to me.
                </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
                {/* Main Rules Display */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">The 15 Rules</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="space-y-4">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="group relative flex gap-6 rounded-2xl border border-white/5 bg-zinc-900/50 p-6 transition-all hover:border-orange-500/30 hover:bg-zinc-900">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 group-hover:bg-orange-500/10 transition-colors">
                                    {rule.icon}
                                </div>
                                <div>
                                    <h3 className="mb-1 text-lg font-bold text-white tracking-tight uppercase">
                                        Rule {idx + 1}: <span className="text-orange-500">{rule.title}</span>
                                    </h3>
                                    <p className="text-sm font-medium leading-relaxed text-zinc-400">
                                        {rule.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Policies */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">General Policies</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />

                        <ul className="space-y-6 relative z-10">
                            {policies.map((policy, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                    <p className="text-sm font-medium leading-relaxed text-zinc-300">
                                        {policy}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-12 rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
                            <h3 className="text-xl font-black text-red-500 uppercase tracking-widest mb-2">No Refunds!</h3>
                            <p className="text-sm text-zinc-400">All fees paid are final. Ensure you understand all rules before committing to the season.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
