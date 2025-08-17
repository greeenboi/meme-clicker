import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { swampPanel } from "../types/swamp";
import db from "../lib/db";
import { getCurrentUser, type AuthToken } from "../lib/auth";
import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import type { AppSchema } from "../instant.schema";

type Entry = { ownerId: string; username: string; frogs: number };

export default function LeaderboardAsync() {
	const [user, setUser] = useState<AuthToken | null>(null);

	// Realtime top 5
		const lbQuery = useMemo(
			() =>
				({
					stats: {
						$: { order: { totalFrogs: "desc" as const }, limit: 5 },
						profile: {},
					},
				} satisfies InstaQLParams<AppSchema>),
			[],
		);
	const { data: lbData, isLoading: lbLoading } = db.useQuery(lbQuery);
		type StatWithProfile = InstaQLEntity<AppSchema, "stats", { profile: Record<string, never> }>;
		const entries: Entry[] = useMemo(() => {
			const rows = (lbData?.stats || []) as unknown as StatWithProfile[];
			return rows.map((s) => ({
				ownerId: s.ownerId,
				username: s.profile?.username ?? "frogling",
				frogs: Math.floor(s.totalFrogs ?? 0),
			}));
		}, [lbData]);

	// Current user from cookie
	useEffect(() => {
		getCurrentUser().then(setUser).catch(() => setUser(null));
	}, []);

	// Realtime current user's frogs
		const myStatsQuery = useMemo<InstaQLParams<AppSchema> | undefined>(() => {
			if (!user?.ownerId) return undefined;
			return { stats: { $: { where: { ownerId: user.ownerId } } } } as const;
		}, [user?.ownerId]);
			const { data: myData } = db.useQuery(myStatsQuery ?? null);
		type StatRow = InstaQLEntity<AppSchema, "stats">;
		const myFrogs = useMemo(() => {
			const rows = (myData?.stats || []) as unknown as StatRow[];
			const s = rows[0];
			return s ? Math.floor((s.totalFrogs as number) || 0) : 0;
		}, [myData]);

	const isMeInTop = useMemo(() => {
		if (!user?.ownerId) return false;
		return entries.some((e) => e.ownerId === user.ownerId);
	}, [entries, user?.ownerId]);

	return (
		<div className={`p-4 rounded-xl ${swampPanel}`}>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-emerald-100 font-bold">🏆 Swamp Leaderboard</h3>
				<span className="text-emerald-300 text-xs">live</span>
			</div>
			<ol className="space-y-1">
				{entries.map((e, i) => (
					<li key={`${e.ownerId}-${i}`} className="flex justify-between text-emerald-200">
						<span className="truncate">{i + 1}. {e.username}</span>
						<span className="font-semibold">{e.frogs.toLocaleString()} 🐸</span>
					</li>
				))}
				{entries.length === 0 && !lbLoading && (
					<li className="text-emerald-300 text-sm">No entries yet</li>
				)}
				{user && !isMeInTop && (
					<>
						<li className="flex justify-center text-emerald-400"><MoreVertical size={16} /></li>
						<li className="flex justify-between text-emerald-200">
							<span className="truncate">You ({user.username})</span>
							<span className="font-semibold">{myFrogs.toLocaleString()} 🐸</span>
						</li>
					</>
				)}
			</ol>
		</div>
	);
}