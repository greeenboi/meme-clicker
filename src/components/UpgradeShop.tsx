import type { Upgrade } from "../lib/gameTypes";

interface UpgradeShopProps {
	upgrades: Upgrade[];
	totalFrogs: number;
	onPurchase: (upgradeId: string) => void;
}

export const UpgradeShop = ({
	upgrades,
	totalFrogs,
	onPurchase,
}: UpgradeShopProps) => {
	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return Math.floor(num).toLocaleString();
	};

	const canAfford = (cost: number) => totalFrogs >= cost;

	return (
		<div className="rounded-xl bg-emerald-800/70 backdrop-blur border border-emerald-600/50 shadow-xl p-4 md:p-5">
			<h2 className="text-xl md:text-2xl font-bold text-emerald-100 mb-3 text-center">
				🛒 Swamp Shop
			</h2>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
				{upgrades
					.filter((upgrade) => upgrade.unlocked)
					.map((upgrade) => (
						<button
							key={upgrade.id}
							type="button"
							className={`w-full p-3 rounded-lg border transition-all duration-150 text-center group ${
								canAfford(upgrade.cost)
									? "bg-emerald-900/30 border-emerald-600 hover:border-emerald-400 hover:shadow"
									: "bg-emerald-900/10 border-emerald-800 opacity-60 cursor-not-allowed"
							}`}
							onClick={() => canAfford(upgrade.cost) && onPurchase(upgrade.id)}
							disabled={!canAfford(upgrade.cost)}
							aria-label={`Purchase ${upgrade.name} for ${formatNumber(upgrade.cost)} frogs`}
						>
							{/* Emoji and Title at top */}
							<div className="flex items-center justify-center gap-2 mb-2">
								<span className="text-lg md:text-xl">{upgrade.emoji}</span>
								<span className="font-semibold text-emerald-100 text-sm md:text-base">
									{upgrade.name}
								</span>
								{upgrade.quantity > 0 && (
									<span className="bg-emerald-700 text-emerald-50 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold">
										{upgrade.quantity}
									</span>
								)}
							</div>

							{/* Price */}
							<div className="mb-2">
								<div
									className={`text-sm md:text-base font-bold ${
										canAfford(upgrade.cost)
											? "text-emerald-100"
											: "text-red-300"
									}`}
								>
									{formatNumber(upgrade.cost)} 🐸
								</div>
								{!canAfford(upgrade.cost) && (
									<div className="text-[10px] md:text-xs text-red-400">
										Need {formatNumber(upgrade.cost - totalFrogs)} more
									</div>
								)}
							</div>

							{/* Details */}
							<div className="space-y-1">
								<p className="text-xs md:text-sm text-emerald-200/90">
									{upgrade.description}
								</p>
								<div className="text-xs md:text-sm">
									<span
										className={`font-medium ${
											upgrade.type === "click"
												? "text-emerald-200"
												: "text-emerald-300"
										}`}
									>
										{upgrade.type === "click"
											? `+${upgrade.multiplier} click power`
											: `+${upgrade.multiplier}/sec`}
									</span>
								</div>
							</div>
						</button>
					))}
			</div>

			{upgrades.filter((upgrade) => !upgrade.unlocked).length > 0 && (
				<div className="mt-3 p-2.5 bg-emerald-900/20 rounded-lg border border-emerald-700 text-center text-emerald-300 text-xs md:text-sm">
					🔒 More upgrades unlock as you collect more frogs!
				</div>
			)}
		</div>
	);
};
