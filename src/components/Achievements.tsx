import { Check } from "lucide-react";
import type { Achievement } from "../lib/gameTypes";

interface AchievementsProps {
	achievements: Achievement[];
}

export const Achievements = ({ achievements }: AchievementsProps) => {
	const unlockedCount = achievements.filter((a) => a.unlocked).length;
	const totalCount = achievements.length;

	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return Math.floor(num).toLocaleString();
	};

	return (
		<div className="rounded-xl bg-emerald-800/70 backdrop-blur border border-emerald-600/50 shadow-xl p-4 md:p-5">
			<div className="text-center mb-3">
				<h2 className="text-xl md:text-2xl font-bold text-emerald-100 mb-2">
					🏆 Achievements
				</h2>
				<div className="bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-700 inline-block text-sm md:text-base">
					<span className="font-bold text-emerald-50">
						{unlockedCount} / {totalCount}
					</span>
					<span className="text-emerald-200 ml-1">completed</span>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
				{achievements.map((achievement) => (
					<div
						key={achievement.id}
						className={`p-3 rounded-lg border transition-all duration-150 relative ${
							achievement.unlocked
								? "bg-gradient-to-r from-emerald-700 to-emerald-600 border-emerald-400 shadow"
								: "bg-emerald-900/10 border-emerald-800"
						}`}
					>
						{achievement.unlocked && (
							<Check className=" absolute z-10 top-0.5 right-0.5 text-[10px] md:text-xs bg-emerald-700 text-emerald-50 px-2 py-0.5 rounded-full" />
						)}
						<div className="flex flex-col items-center gap-3">
							<span
								className={`text-2xl ${
									achievement.unlocked ? "" : "opacity-60 grayscale"
								}`}
							>
								{achievement.emoji}
							</span>
							<div className="flex-1">
								<div className="font-semibold text-emerald-100 mb-0.5 flex flex-nowrap items-center gap-2 text-sm md:text-base">
									{achievement.name}
								</div>
								<p className="text-xs md:text-sm text-emerald-200/90 mb-1">
									{achievement.description}
								</p>
								<div className="text-xs md:text-sm text-balance font-medium text-emerald-200">
									Target: {formatNumber(achievement.requirement)} frogs
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{unlockedCount === totalCount && totalCount > 0 && (
				<div className="mt-3 p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg shadow text-center">
					<div className="text-sm md:text-base font-bold text-emerald-50">
						🎉 MASTER FROG WIZARD! 🎉
					</div>
					<div className="text-emerald-100 text-xs md:text-sm">
						You've unlocked all achievements!
					</div>
				</div>
			)}
		</div>
	);
};
