import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { seasonId, teamName, playerName, gameLog, opponent, gameNumber } = body;

        const dataPath = path.join(process.cwd(), 'src', 'data', 'data.json');
        const fileContent = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(fileContent);

        const season = data.seasons[seasonId];
        const team = season.teams.find((t: any) => t.Team === teamName);
        const player = team.roster.find((p: any) => p.name === playerName);

        if (!player) throw new Error("Player not found");

        if (!player.stats) player.stats = [];

        // Add the metadata to the log entry
        const finalLog = {
            game_number: gameNumber || (player.stats.length + 1),
            opponent: opponent || "Unknown",
            ...gameLog
        };

        player.stats.push(finalLog);
        player.GamesPlayed = (player.GamesPlayed || 0) + 1;

        await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({ success: true, message: `Saved ${playerName} vs ${opponent}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
