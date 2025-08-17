import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import { useEffect, useState } from "react";
import type { AppSchema } from "./instant.schema";
import { type AuthToken, getCurrentUser, logout } from "./lib/auth";
import db from "./lib/db";
import "./index.css";
import { LogOut, Volume2, VolumeX } from "lucide-react";
import { Achievements } from "./components/Achievements";
import AuthPanel from "./components/AuthPanel";
import { GameStats } from "./components/GameStats";
import LeaderboardAsync from "./components/LeaderboardAsync";
import { Spells } from "./components/Spells";
import { UpgradeShop } from "./components/UpgradeShop";
import { getSfxEnabled, playClickSfx, playCritSfx, setSfxEnabled } from "./lib/sfx";
import { useGameLogic } from "./lib/useGameLogic";
import { swampBg, swampPanel } from "./types/swamp";
import ZenPlayer from "./components/ZenPlayer";
import { startZenMusic, stopZenMusic } from "./lib/zen";

export default function App() {
	const [user, setUser] = useState<AuthToken | null>(null);
	const [clicking, setClicking] = useState(false);
	const [crit, setCrit] = useState<{ show: boolean; mult: number }>({
		show: false,
		mult: 1,
	});
	const [sfxOn, setSfxOn] = useState<boolean>(() => getSfxEnabled());
	const [zenMode, setZenMode] = useState(false);
	const [prevSfx, setPrevSfx] = useState<boolean | null>(null);
	const [streamOk, setStreamOk] = useState<boolean | null>(null);

	useEffect(() => {
		setSfxEnabled(sfxOn);
	}, [sfxOn]);

			// Zen Mode: mute SFX; restore on exit; also ensure streams stop when exiting
	useEffect(() => {
		if (zenMode) {
			setPrevSfx((p) => (p === null ? sfxOn : p));
			if (sfxOn) setSfxOn(false);
		} else {
					// Stop any active radio stream and clear fallback marker
					stopZenMusic();
					setStreamOk(null);
			if (prevSfx !== null) {
				setSfxOn(prevSfx);
				setPrevSfx(null);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [zenMode]);

	// Auth bootstrap
	useEffect(() => {
		(async () => setUser(await getCurrentUser()))();
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
	const profile = statsData?.profiles?.[0] as unknown as ProfileWith | undefined;
	const stats = profile?.stats as InstaQLEntity<AppSchema, "stats"> | undefined;

	// Game logic
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
		// Update local game logic first and get applied power (handles crits)
		const applied = clickFrog();
		if (applied && applied > power) {
			const mult = Math.max(1, Math.round((applied / power) * 10) / 10);
			setCrit({ show: true, mult });
			setTimeout(() => setCrit((c) => ({ ...c, show: false })), 650);
			// Play crit-specific SFX
			playCritSfx();
		}
		try {
			if (stats) {
				await db.transact(
					db.tx.stats[stats.id].merge({
						totalClicks: (stats.totalClicks ?? 0) + 1,
						totalFrogs: (stats.totalFrogs ?? 0) + (applied ?? power),
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
					{/* Left panel with looping background video */}
					<div className="relative overflow-hidden rounded-2xl">
						<video
							className="absolute inset-0 w-full h-full object-cover opacity-35 [filter:saturate(0.95)] pointer-events-none motion-reduce:hidden"
							autoPlay
							muted
							loop
							playsInline
							aria-hidden
						>
							<source src="/media/frog-wizard-loop.mp4" type="video/mp4" />
							{/* Put your generated loop at public/media/frog-wizard-loop.mp4 */}
						</video>
						<div className="absolute inset-0 bg-emerald-950/40" aria-hidden />
						<div className="relative p-4 md:p-5 space-y-4">
							<h1 className="text-3xl md:text-4xl font-extrabold text-emerald-100 drop-shadow">
								Frog Wizard Clicker
							</h1>
							<p className="text-emerald-100/90 max-w-prose">
								Conjure frogs, trade trinkets, and rise on the swamp leaderboard.
							</p>
							<div className="backdrop-blur-[1px]">
								<LeaderboardAsync />
							</div>
						</div>
					</div>
					<AuthPanel onAuthed={setUser} />
				</div>
			</main>
		);
	}

	return (
		<div className={`min-h-screen ${swampBg} text-emerald-50 p-4 md:p-6`}>
			<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				{/* Left: main clicker area (expands to full width in Zen Mode) */}
				<div className={`space-y-4 md:space-y-6 ${zenMode ? "lg:col-span-3" : "lg:col-span-2"}`}>
					<div
						className={`rounded-2xl ${swampPanel} relative overflow-hidden ${zenMode ? "p-6 md:p-8 min-h-[420px]" : "p-4 md:p-5"}`}
					>
						{/* Inset background video for the main click area */}
						<video
							className="absolute inset-0 w-full h-full object-cover opacity-30 [filter:saturate(0.9)] pointer-events-none motion-reduce:hidden"
							autoPlay
							muted
							loop
							playsInline
							aria-hidden
						>
							<source src="/media/frog-wizard-loop.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-0 bg-emerald-950/40" aria-hidden />

						<div className="relative z-10">
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
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setSfxOn((v) => !v)}
										aria-label={sfxOn ? "Mute sounds" : "Unmute sounds"}
										className={`px-2 py-1.5 rounded-lg border text-emerald-200 text-sm ${
											zenMode
												? "bg-emerald-900/30 border-emerald-800 opacity-60 cursor-not-allowed"
												: "bg-emerald-900/40 border-emerald-700"
										}`}
										title={
											zenMode
												? "Muted in Zen Mode"
												: sfxOn
												? "Mute sounds"
												: "Unmute sounds"
										}
										disabled={zenMode}
									>
										{sfxOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
									</button>
									<button
										type="button"
										onClick={() => {
											logout();
											location.reload();
										}}
										className="px-1.5 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-200 text-sm"
									>
										<LogOut size={16} />
									</button>
								</div>
							</div>

							<div className="relative flex flex-col items-center py-6 md:py-8">
								{crit.show && (
									<div
										className="absolute -top-2 md:-top-3 translate-y-[-100%] select-none text-amber-300 font-extrabold text-lg md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] animate-bounce"
										aria-hidden
									>
										✨ CRIT! x{crit.mult}
									</div>
								)}
								<button
									type="button"
									onClick={addClick}
									className={`${zenMode ? "text-7xl md:text-8xl" : "text-6xl md:text-7xl"} transition-transform ${clicking ? "scale-95" : "hover:scale-105"}`}
									aria-label="Conjure a frog"
								>
									🐸
								</button>
								<div className="mt-3 text-emerald-200 text-sm">
									Clicks: {Math.floor(gameState.totalClicks).toLocaleString()}
								</div>
							</div>
						</div>
					</div>

					{/* Zen Mode toggle button sits below the clicker panel */}
					<div className="pt-1">
						<button
							type="button"
									onClick={async () => {
										setZenMode((z) => {
											const turningOn = !z;
											if (turningOn) {
												// Try SomaFM streams first; fallback to YouTube if it fails
												startZenMusic().then((ok) => setStreamOk(ok)).catch(() => setStreamOk(false));
											} else {
												stopZenMusic();
												setStreamOk(null);
											}
											return turningOn;
										});
									}}
							className={`w-full text-center font-semibold tracking-wide rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
								zenMode
									? "bg-gradient-to-r from-emerald-900/60 via-emerald-800/60 to-teal-800/60 border-emerald-700 text-emerald-100 hover:from-emerald-900/70 hover:to-teal-800/70"
									: "bg-gradient-to-r from-emerald-800/50 via-emerald-700/50 to-teal-700/50 border-emerald-600 text-emerald-100 hover:from-emerald-800/60 hover:to-teal-700/60"
							}`}
							style={{ padding: "0.95rem 1rem" }}
							aria-pressed={zenMode}
						>
							{zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
						</button>
					</div>

					<div className={`p-4 md:p-5 rounded-2xl ${swampPanel}`}>
						<GameStats
							gameState={gameState}
							clickPower={clickPower}
							goldenClicks={goldenClicks}
						/>
					</div>
				</div>

				{/* Right: sidebar content (hidden pieces in Zen Mode) */}
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
					{!zenMode && <LeaderboardAsync />}
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
					{!zenMode && <Achievements achievements={achievementList} />}
				</div>
			</div>
			{/* Hidden YouTube lofi player for Zen Mode fallback when streams fail */}
			<ZenPlayer active={zenMode && streamOk === false} />
		</div>
	);
}
