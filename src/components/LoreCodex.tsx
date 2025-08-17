import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import { useMemo, useState } from "react";
import type { AppSchema } from "../instant.schema";
import db from "../lib/db";
import { swampPanel } from "../types/swamp";

type LoreEntry = InstaQLEntity<AppSchema, "loreEntries">;

type UnlockRow = InstaQLEntity<
	AppSchema,
	"loreUnlocks",
	{ loreEntry: Record<string, never> }
>;

export default function LoreCodex({ ownerId }: { ownerId: string }) {
	// Fetch unlocked lore with link to entry
	const query = useMemo(
		() =>
			({
				loreUnlocks: {
					$: { where: { ownerId } },
					loreEntry: {},
				},
			}) satisfies InstaQLParams<AppSchema>,
		[ownerId],
	);
	const { data } = db.useQuery(query);

	const groups = useMemo(() => {
		const unlocks = (data?.loreUnlocks || []) as UnlockRow[];
		const byGuild = new Map<string, LoreEntry[]>();
		for (const u of unlocks) {
			const e = u.loreEntry as LoreEntry | undefined;
			if (!e) continue;
			const list = byGuild.get(e.guild as string) || [];
			list.push(e);
			byGuild.set(e.guild as string, list);
		}
		for (const [g, list] of byGuild.entries()) {
			list.sort((a, b) => (a.order as number) - (b.order as number));
			byGuild.set(g, list);
		}
		return byGuild;
	}, [data?.loreUnlocks]);

	const [openGuild, setOpenGuild] = useState<string | null>(null);

	return (
		<div className={`p-4 rounded-xl ${swampPanel}`}>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-emerald-100 font-bold">📜 Frog Wizard Codex</h3>
				<span className="text-emerald-300 text-xs">lore</span>
			</div>
			{groups.size === 0 ? (
				<div className="text-emerald-300 text-sm">
					Discover secrets as you progress…
				</div>
			) : (
				<div className="space-y-3">
					{Array.from(groups.entries()).map(([guild, entries]) => (
						<div
							key={guild}
							className="border border-emerald-800/60 rounded-lg"
						>
							<button
								type="button"
								onClick={() =>
									setOpenGuild((g) => (g === guild ? null : guild))
								}
								className="w-full text-left px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/50 text-emerald-100 font-semibold"
							>
								{guild}{" "}
								<span className="text-emerald-300 text-xs">
									({entries.length})
								</span>
							</button>
							{openGuild === guild && (
								<div className="p-3 space-y-3">
									{entries.map((e) => (
										<article key={e.key as string} className="space-y-1">
											<h4 className="text-emerald-100 font-bold">
												{e.title as string}
											</h4>
											<p className="text-emerald-200 whitespace-pre-wrap leading-relaxed text-sm">
												{e.body as string}
											</p>
										</article>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
