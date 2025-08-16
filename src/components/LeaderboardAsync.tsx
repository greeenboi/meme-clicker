import { RefreshCcw } from "lucide-react";
import { swampPanel } from "../types/swamp";
import { useCallback, useEffect, useState } from "react";
import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import db from "../lib/db";
import type { AppSchema } from "../instant.schema";

export default function LeaderboardAsync() {
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