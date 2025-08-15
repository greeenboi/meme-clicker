import type { Spell } from "../lib/gameTypes";

interface SpellsProps {
	spells: Spell[];
	activeSpells: Map<
		string,
		{ endTime: number; effect: string; multiplier: number }
	>;
	totalFrogs: number;
	onCast: (spellId: string) => void;
}

export const Spells = ({
	spells,
	activeSpells,
	totalFrogs,
	onCast,
}: SpellsProps) => {
	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return Math.floor(num).toLocaleString();
	};

	const formatTime = (ms: number) => {
		const seconds = Math.ceil(ms / 1000);
		if (seconds >= 60) {
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = seconds % 60;
			return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
		}
		return `${seconds}s`;
	};

	const canAfford = (cost: number) => totalFrogs >= cost;
	const isActive = (spellId: string) => activeSpells.has(spellId);

	const getRemainingTime = (spellId: string) => {
		const spell = activeSpells.get(spellId);
		if (!spell) return 0;
		return Math.max(0, spell.endTime - Date.now());
	};

	return (
		<div className="rounded-xl bg-emerald-800/70 backdrop-blur border border-emerald-600/50 shadow-xl p-4 md:p-5">
			<h2 className="text-xl md:text-2xl font-bold text-emerald-100 mb-3 text-center">
				✨ Wizard Spells
			</h2>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
				{spells.map((spell) => {
					const active = isActive(spell.id);
					const remainingTime = getRemainingTime(spell.id);

					return (
						<button
							key={spell.id}
							type="button"
							className={`w-full p-3 rounded-lg border transition-all duration-150 text-center ${
								active
									? "bg-gradient-to-r from-emerald-700 to-emerald-600 border-emerald-400 animate-pulse"
									: canAfford(spell.cost)
										? "bg-emerald-900/30 border-emerald-600 hover:border-emerald-400 hover:shadow"
										: "bg-emerald-900/10 border-emerald-800 opacity-60 cursor-not-allowed"
							}`}
							onClick={() =>
								!active && canAfford(spell.cost) && onCast(spell.id)
							}
							disabled={active || !canAfford(spell.cost)}
							aria-label={`Cast ${spell.name} spell for ${formatNumber(spell.cost)} frogs`}
						>
							{/* Emoji and Title at top */}
							<div className="flex items-center justify-center gap-2 mb-2">
								<span className="text-lg md:text-xl">{spell.emoji}</span>
								<span className="font-semibold text-emerald-100 text-sm md:text-base">
									{spell.name}
								</span>
								{active && (
									<span className="bg-emerald-700 text-emerald-50 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold">
										ACTIVE
									</span>
								)}
							</div>

							{/* Cost/Timer */}
							<div className="mb-2">
								{active ? (
									<div className="text-sm md:text-base font-bold text-emerald-100">
										{formatTime(remainingTime)} left
									</div>
								) : (
									<>
										<div
											className={`text-sm md:text-base font-bold ${
												canAfford(spell.cost)
													? "text-emerald-100"
													: "text-red-300"
											}`}
										>
											{formatNumber(spell.cost)} 🐸
										</div>
										{!canAfford(spell.cost) && (
											<div className="text-[10px] md:text-xs text-red-400">
												Need {formatNumber(spell.cost - totalFrogs)} more
											</div>
										)}
									</>
								)}
							</div>

							{/* Details */}
							<div className="space-y-1">
								<p className="text-xs md:text-sm text-emerald-200/90">
									{spell.description}
								</p>
								<div className="flex items-center justify-center gap-3 text-xs md:text-sm">
									<span className="font-medium text-emerald-200">
										{spell.duration > 0
											? formatTime(spell.duration)
											: "Instant"}
									</span>
									<span className="font-medium text-emerald-100">
										{spell.multiplier}x power
									</span>
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{activeSpells.size > 0 && (
				<div className="mt-3 p-2.5 bg-emerald-900/20 rounded-lg border border-emerald-700 text-center text-emerald-200 text-xs md:text-sm">
					⚡ {activeSpells.size} spell{activeSpells.size === 1 ? "" : "s"}{" "}
					active!
				</div>
			)}
		</div>
	);
};
