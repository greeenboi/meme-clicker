import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import { useEffect, useState } from "react";
import type { AppSchema } from "./instant.schema";
import {
	type AuthToken,
	getCurrentUser,
	logout,
} from "./lib/auth";
import db from "./lib/db";
import "./index.css";
import { Achievements } from "./components/Achievements";
import { GameStats } from "./components/GameStats";
import { Spells } from "./components/Spells";
import { UpgradeShop } from "./components/UpgradeShop";
import { playClickSfx } from "./lib/sfx";
import { useGameLogic } from "./lib/useGameLogic";
import { swampBg, swampPanel } from "./types/swamp";
import LeaderboardAsync from "./components/LeaderboardAsync";
import AuthPanel from "./components/AuthPanel";

export default function App() {
	const [user, setUser] = useState<AuthToken | null>(null);
	const [clicking, setClicking] = useState(false);

	// Load current user from cookie
	useEffect(() => {
		(async () => {
			setUser(await getCurrentUser());
		})();
	}, []);

	// Subscribe to current user's stats
	const statsQuery: InstaQLParams<AppSchema> | null = user
		? {
				profiles: {
					$: { where: { username: user.username } },
					stats: {},
					purchases: {},
				},
			}
		: null;

	const { data: statsData } = db.useQuery(statsQuery);
	type ProfileWith = InstaQLEntity<
		AppSchema,
		"profiles",
		{ purchases: Record<string, never>; stats: Record<string, never> }
	>;
	const profile = statsData?.profiles?.[0] as unknown as
		| ProfileWith
		| undefined;
	const stats = profile?.stats as InstaQLEntity<AppSchema, "stats"> | undefined;

	// Hook up local game logic features (stats hydrated from DB)
	const {
		gameState,
		upgrades,
		achievements: achievementList,
		spells: spellList,
		activeSpells,
		goldenClicks,
		clickFrog,
		purchaseUpgrade,
		castSpell,
		clickPower,
		hydrateFromPersisted,
	} = useGameLogic();

	useEffect(() => {
		if (stats) {
			hydrateFromPersisted(stats.totalFrogs ?? 0, stats.totalClicks ?? 0);
		}
	}, [stats, hydrateFromPersisted]);

	const addClick = async () => {
		if (!user) return;
		setClicking(true);
		const power = clickPower;
		// SFX: play sounds based on current total clicks BEFORE increment (consistency)
		playClickSfx(Math.floor(gameState.totalClicks));
		// Update local game logic first
		clickFrog();
		try {
			if (stats) {
				await db.transact(
					db.tx.stats[stats.id].merge({
						totalClicks: (stats.totalClicks ?? 0) + 1,
						totalFrogs: (stats.totalFrogs ?? 0) + power,
						lastActiveAt: new Date().toISOString(),
					}),
				);
			}
		} finally {
			setTimeout(() => setClicking(false), 120);
		}
	};

	if (!user) {
		return (
			<main className={`min-h-screen ${swampBg} text-emerald-50 p-4 md:p-6`}>
				<div className="max-w-6xl h-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
					<div className="space-y-4">
						<h1 className="text-3xl md:text-4xl font-extrabold text-emerald-100">
							Frog Wizard Clicker
						</h1>
						<p className="text-emerald-200">
							Conjure frogs, trade trinkets, and rise on the swamp leaderboard.
						</p>
						<LeaderboardAsync />
					</div>
					<AuthPanel onAuthed={setUser} />
				</div>
			</main>
		);
	}

	return (
		<div className={`min-h-screen ${swampBg} text-emerald-50 p-4 md:p-6`}>
			<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				<div className="lg:col-span-2 space-y-4 md:space-y-6">
					<div className={`p-4 md:p-5 rounded-2xl ${swampPanel}`}>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
							<div>
								<div className="text-base md:text-lg font-bold">
									Welcome, {user.username} 🐸
								</div>
								<div className="text-emerald-200 text-xs md:text-sm">
									Total Frogs:{" "}
									{Math.floor(gameState.totalFrogs).toLocaleString()}
								</div>
							</div>
							<button
								type="button"
								onClick={() => {
									logout();
									location.reload();
								}}
								className="px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-200 text-sm"
							>
								Logout
							</button>
						</div>

						<div className="flex flex-col items-center py-6 md:py-8">
							<button
								type="button"
								onClick={addClick}
								className={`text-6xl md:text-7xl transition-transform ${clicking ? "scale-95" : "hover:scale-105"}`}
								aria-label="Conjure a frog"
							>
								🐸
							</button>
							<div className="mt-3 text-emerald-200 text-sm">
								Clicks: {Math.floor(gameState.totalClicks).toLocaleString()}
							</div>
						</div>
					</div>

					<div className={`p-4 md:p-5 rounded-2xl ${swampPanel}`}>
						<GameStats
							gameState={gameState}
							clickPower={clickPower}
							goldenClicks={goldenClicks}
						/>
					</div>
				</div>

				<div
					className="space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden overscroll-contain pr-1
          [scrollbar-width:thin] [scrollbar-color:theme(colors.emerald.500)_transparent]
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-emerald-900/30
          [&::-webkit-scrollbar-thumb]:bg-emerald-600/60
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-emerald-500/70
          [&::-webkit-scrollbar-corner]:bg-transparent"
				>
					<LeaderboardAsync />
					<UpgradeShop
						upgrades={upgrades}
						totalFrogs={gameState.totalFrogs}
						onPurchase={purchaseUpgrade}
					/>
					<Spells
						spells={spellList}
						activeSpells={activeSpells}
						totalFrogs={gameState.totalFrogs}
						onCast={castSpell}
					/>
					<Achievements achievements={achievementList} />
				</div>
			</div>
		</div>
	);
}
