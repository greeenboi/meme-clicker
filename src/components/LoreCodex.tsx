import type { InstaQLEntity, InstaQLParams } from "@instantdb/react";
import { useEffect, useMemo, useState } from "react";
import type { AppSchema } from "../instant.schema";
import db from "../lib/db";
import { swampPanel } from "../types/swamp";

type LoreEntry = InstaQLEntity<AppSchema, "loreEntries">;

type UnlockRow = InstaQLEntity<
	AppSchema,
	"loreUnlocks",
	{ loreEntry: Record<string, never> }
>;

type GroupRow = { e: LoreEntry; unlockId: string; readAt?: string };

export default function LoreCodex({ ownerId, anchorId }: { ownerId: string; anchorId?: string }) {
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
		const byGuild = new Map<string, GroupRow[]>();
		for (const u of unlocks) {
			const e = u.loreEntry as LoreEntry | undefined;
			if (!e) continue;
			const guild = (e.guild as string) || "Guild";
			const list = byGuild.get(guild) || [];
			list.push({ e, unlockId: u.id as string, readAt: u.readAt as string | undefined });
			byGuild.set(guild, list);
		}
		for (const [g, list] of byGuild.entries()) {
			list.sort((a, b) => ((a.e.order as number) - (b.e.order as number)));
			byGuild.set(g, list);
		}
		return byGuild;
	}, [data?.loreUnlocks]);

	const [openGuild, setOpenGuild] = useState<string | null>(null);

	// Mark all entries in an opened guild as read
	useEffect(() => {
		if (!openGuild) return;
		const list = groups.get(openGuild);
		if (!list) return;
		(async () => {
			for (const row of list) {
				if (!row.readAt) {
					await db.transact(
						db.tx.loreUnlocks[row.unlockId].update({ readAt: new Date().toISOString() }),
					);
				}
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openGuild]);

	return (
		<div className={`p-4 rounded-xl ${swampPanel}`} id={anchorId}>
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
								{guild} {" "}
								<span className="text-emerald-300 text-xs">({entries.length})</span>
								{entries.some((r) => !r.readAt) && (
									<span className="ml-2 text-amber-300 text-[10px] border border-amber-400/60 px-1 py-0.5 rounded">
										{entries.filter((r) => !r.readAt).length} unread
									</span>
								)}
							</button>
							{openGuild === guild && (
								<div className="p-3 space-y-3">
									{entries.map(({ e, readAt }) => (
										<article key={e.key as string} className="space-y-1">
											<div className="flex items-baseline gap-2">
												<h4 className="text-emerald-100 font-bold">{e.title as string}</h4>
												{!readAt && (
													<span className="text-amber-300 text-[10px] border border-amber-400/60 px-1 py-0.5 rounded">unread</span>
												)}
											</div>
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
