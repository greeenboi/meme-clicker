import type { GameState } from "../lib/gameTypes";

interface GameStatsProps {
	gameState: GameState;
	clickPower: number;
	goldenClicks: number;
}

export const GameStats = ({
	gameState,
	clickPower,
	goldenClicks,
}: GameStatsProps) => {
	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return Math.floor(num).toLocaleString();
	};

	return (
		<div className="rounded-xl bg-emerald-800/70 backdrop-blur border border-emerald-600/50 shadow-xl p-4 md:p-5">
			<div className="text-center mb-3 md:mb-4">
				<h1 className="text-2xl md:text-3xl font-extrabold text-emerald-100 mb-1 md:mb-2">
					🐸 Frog Wizard Clicker
				</h1>
				<p className="text-emerald-200 text-sm md:text-base">
					Conjure magical frogs and build your amphibian empire!
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 text-center">
				<div className="bg-emerald-900/30 p-3 rounded-lg shadow-md border border-emerald-700">
					<div className="text-xl md:text-2xl font-bold text-emerald-50">
						{formatNumber(gameState.totalFrogs)}
					</div>
					<div className="text-xs md:text-sm text-emerald-200">Total Frogs</div>
				</div>

				<div className="bg-emerald-900/30 p-3 rounded-lg shadow-md border border-emerald-700">
					<div className="text-xl md:text-2xl font-bold text-emerald-50">
						{formatNumber(gameState.frogsPerSecond)}/s
					</div>
					<div className="text-xs md:text-sm text-emerald-200">
						Frogs per Second
					</div>
				</div>

				<div className="bg-emerald-900/30 p-3 rounded-lg shadow-md border border-emerald-700">
					<div className="text-xl md:text-2xl font-bold text-emerald-50">
						{formatNumber(clickPower)}
					</div>
					<div className="text-xs md:text-sm text-emerald-200">Click Power</div>
				</div>

				<div className="bg-emerald-900/30 p-3 rounded-lg shadow-md border border-emerald-700">
					<div className="text-xl md:text-2xl font-bold text-emerald-50">
						{formatNumber(gameState.totalClicks)}
					</div>
					<div className="text-xs md:text-sm text-emerald-200">
						Total Clicks
					</div>
				</div>
			</div>

			{goldenClicks > 0 && (
				<div className="mt-3 md:mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 p-2.5 md:p-3 rounded-lg shadow-lg animate-pulse">
					<div className="text-center text-emerald-50 font-bold text-sm md:text-base">
						✨ Golden Touch Active! ✨
					</div>
					<div className="text-center text-emerald-100 text-xs md:text-sm">
						{goldenClicks} clicks remaining (100x power!)
					</div>
				</div>
			)}
		</div>
	);
};
