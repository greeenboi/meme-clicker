import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { AppSchema } from "./instant.schema";
import {
	type AuthToken,
	getCurrentUser,
	login,
	logout,
	signUp,
} from "./lib/auth";
import db from "./lib/db";
import "./index.css";
import { RefreshCcw } from "lucide-react";
import { Achievements } from "./components/Achievements";
import { GameStats } from "./components/GameStats";
import { Spells } from "./components/Spells";
import { UpgradeShop } from "./components/UpgradeShop";
import { playClickSfx } from "./lib/sfx";
import { useGameLogic } from "./lib/useGameLogic";

// Simple swamp theme helpers
const swampBg =
	"bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900";
const swampPanel =
	"bg-emerald-800/70 backdrop-blur border border-emerald-600/50 shadow-xl";

function AuthPanel({ onAuthed }: { onAuthed: (u: AuthToken) => void }) {
	const [mode, setMode] = useState<"login" | "signup">("signup");
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		try {
			setLoading(true);
			setError(null);
			const user =
				mode === "signup"
					? await signUp(email.trim(), username.trim(), password)
					: await login(email.trim(), password);
			onAuthed(user);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`max-w-md mx-auto p-6 rounded-2xl ${swampPanel}`}>
			<h2 className="text-2xl font-extrabold text-emerald-100 mb-4 flex items-center gap-2">
				🐸 Frog Wizard Guild
			</h2>
			<form className="space-y-3" onSubmit={submit}>
				<div>
					<label className="block text-emerald-200 text-sm mb-1">Email</label>
					<input
						className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@swamp.com"
					/>
				</div>
				{mode === "signup" && (
					<div>
						<label className="block text-emerald-200 text-sm mb-1">
							Username
						</label>
						<input
							className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="frog_wizard"
						/>
					</div>
				)}
				<div>
					<label className="block text-emerald-200 text-sm mb-1">
						Password
					</label>
					<input
						type="password"
						className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
					/>
				</div>
				{error && <div className="text-red-300 text-sm">{error}</div>}
				<button
					type="submit"
					disabled={loading}
					className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-emerald-50 font-semibold"
				>
					{loading
						? "Working..."
						: mode === "signup"
							? "Create Guild Account"
							: "Enter the Swamp"}
				</button>
				<button
					type="button"
					onClick={() => setMode(mode === "signup" ? "login" : "signup")}
					className="w-full py-2 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-200"
				>
					{mode === "signup"
						? "Already have an account? Login"
						: "Need an account? Sign up"}
				</button>
			</form>
		</div>
	);
}

// Async Leaderboard using one-off queries and manual refresh
function LeaderboardAsync() {
	const [entries, setEntries] = useState<
		Array<{ username: string; frogs: number }>
	>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const query = {
				stats: {
					$: { order: { totalFrogs: "desc" as const }, limit: 10 },
					profile: {},
				},
			} satisfies InstaQLParams<AppSchema>;
			const { data } = await db.queryOnce(query);
			type StatWithProfile = InstaQLEntity<
				AppSchema,
				"stats",
				{ profile: Record<string, never> }
			>;
			const mapped = (data?.stats || [])
				.map((s) => s as StatWithProfile)
				.map((s) => ({
					username: s.profile?.username ?? "frogling",
					frogs: s.totalFrogs ?? 0,
				}))
				.slice(0, 10);
			setEntries(mapped);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div className={`p-4 rounded-xl ${swampPanel}`}>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-emerald-100 font-bold">🏆 Swamp Leaderboard</h3>
				<button
					type="button"
					onClick={load}
					disabled={loading}
					className="px-2 py-1 rounded bg-emerald-700 text-emerald-50 text-sm border border-emerald-500"
				>
					<RefreshCcw className={loading ? "animate-spin" : "text-sm"} />
				</button>
			</div>
			<ol className="space-y-1">
				{entries.map((e, i) => (
					<li
						key={`${e.username}-${i}`}
						className="flex justify-between text-emerald-200"
					>
						<span className="truncate">
							{i + 1}. {e.username}
						</span>
						<span className="font-semibold">
							{Math.floor(e.frogs).toLocaleString()} 🐸
						</span>
					</li>
				))}
				{entries.length === 0 && !loading && (
					<li className="text-emerald-300 text-sm">No entries yet</li>
				)}
			</ol>
		</div>
	);
}

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
