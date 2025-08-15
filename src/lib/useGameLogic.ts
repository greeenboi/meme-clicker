import { useCallback, useEffect, useState } from "react";
import type { Achievement, GameState, Spell, Upgrade } from "./gameTypes";
import { achievements, initialUpgrades, spells } from "./gameTypes";

export const useGameLogic = (initial?: {
	initialFrogs?: number;
	initialClicks?: number;
}) => {
	const [gameState, setGameState] = useState<GameState>({
		totalFrogs: initial?.initialFrogs ?? 0,
		frogsPerSecond: 0,
		totalClicks: initial?.initialClicks ?? 0,
		prestige: 0,
	});

	const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);
	const [playerAchievements, setPlayerAchievements] =
		useState<Achievement[]>(achievements);
	const [availableSpells] = useState<Spell[]>(spells);
	const [activeSpells, setActiveSpells] = useState<
		Map<string, { endTime: number; effect: string; multiplier: number }>
	>(new Map());
	const [goldenClicks, setGoldenClicks] = useState(0);

	// NEW: hydrate totals from persisted storage (InstantDB)
	const hydrateFromPersisted = useCallback(
		(totalFrogs: number, totalClicks: number) => {
			setGameState((prev) => ({ ...prev, totalFrogs, totalClicks }));
		},
		[],
	);

	// Check achievements
	const checkAchievements = useCallback(
		(totalFrogs: number, totalClicks: number) => {
			setPlayerAchievements((prev) =>
				prev.map((achievement) => {
					if (!achievement.unlocked) {
						if (achievement.id === "first-frog" && totalClicks >= 1) {
							return { ...achievement, unlocked: true };
						}
						if (totalFrogs >= achievement.requirement) {
							return { ...achievement, unlocked: true };
						}
					}
					return achievement;
				}),
			);
		},
		[],
	);

	// Calculate frogs per second based on upgrades
	const calculateFrogsPerSecond = useCallback((currentUpgrades: Upgrade[]) => {
		return currentUpgrades.reduce((total, upgrade) => {
			if (upgrade.type === "auto") {
				return total + upgrade.quantity * upgrade.multiplier;
			}
			return total;
		}, 0);
	}, []);

	// Calculate click power based on upgrades and active spells
	const calculateClickPower = useCallback(() => {
		let basePower = 1;

		// Add click upgrade bonuses
		for (const upgrade of upgrades) {
			if (upgrade.type === "click") {
				basePower += upgrade.quantity * upgrade.multiplier;
			}
		}

		// Apply active spell multipliers
		let spellMultiplier = 1;
		for (const spell of activeSpells.values()) {
			if (spell.effect === "click_multiplier") {
				spellMultiplier *= spell.multiplier;
			}
		}

		// Golden clicks bonus
		if (goldenClicks > 0) {
			spellMultiplier *= 100;
		}

		return Math.floor(basePower * spellMultiplier);
	}, [upgrades, activeSpells, goldenClicks]);

	// Handle frog clicking
	const clickFrog = useCallback(() => {
		const clickPower = calculateClickPower();

		setGameState((prev) => ({
			...prev,
			totalFrogs: prev.totalFrogs + clickPower,
			totalClicks: prev.totalClicks + 1,
		}));

		if (goldenClicks > 0) {
			setGoldenClicks((prev) => prev - 1);
		}

		// Check achievements
		// Note: using functional update above, so compute next values explicitly
		checkAchievements(
			gameState.totalFrogs + clickPower,
			gameState.totalClicks + 1,
		);
	}, [gameState, goldenClicks, calculateClickPower, checkAchievements]);

	// Purchase upgrade
	const purchaseUpgrade = useCallback(
		(upgradeId: string) => {
			const upgrade = upgrades.find((u) => u.id === upgradeId);
			if (!upgrade || gameState.totalFrogs < upgrade.cost) return false;

			setGameState((prev) => ({
				...prev,
				totalFrogs: prev.totalFrogs - upgrade.cost,
			}));

			setUpgrades((prev) =>
				prev.map((u) => {
					if (u.id === upgradeId) {
						const newQuantity = u.quantity + 1;
						const newCost = Math.floor(u.cost * 1.15); // 15% cost increase
						return { ...u, quantity: newQuantity, cost: newCost };
					}
					return u;
				}),
			);

			return true;
		},
		[gameState.totalFrogs, upgrades],
	);

	// Cast spell
	const castSpell = useCallback(
		(spellId: string) => {
			const spell = availableSpells.find((s) => s.id === spellId);
			if (!spell || gameState.totalFrogs < spell.cost) return false;

			setGameState((prev) => ({
				...prev,
				totalFrogs: prev.totalFrogs - spell.cost,
			}));

			if (spell.effect === "golden_clicks") {
				setGoldenClicks(50);
			} else {
				const endTime = Date.now() + spell.duration;
				setActiveSpells(
					(prev) =>
						new Map(
							prev.set(spellId, {
								endTime,
								effect: spell.effect,
								multiplier: spell.multiplier,
							}),
						),
				);
			}

			return true;
		},
		[gameState.totalFrogs, availableSpells],
	);

	// Auto-generate frogs
	useEffect(() => {
		const interval = setInterval(() => {
			const fps = calculateFrogsPerSecond(upgrades);
			if (fps > 0) {
				let autoMultiplier = 1;
				for (const spell of activeSpells.values()) {
					if (spell.effect === "auto_multiplier") {
						autoMultiplier *= spell.multiplier;
					}
				}

				setGameState((prev) => ({
					...prev,
					totalFrogs: prev.totalFrogs + Math.floor((fps * autoMultiplier) / 10),
					frogsPerSecond: fps * autoMultiplier,
				}));
			}
		}, 100); // Update 10 times per second for smooth animation

		return () => clearInterval(interval);
	}, [upgrades, activeSpells, calculateFrogsPerSecond]);

	// Clean up expired spells
	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			setActiveSpells((prev) => {
				const newMap = new Map(prev);
				for (const [spellId, spell] of newMap.entries()) {
					if (now > spell.endTime) {
						newMap.delete(spellId);
					}
				}
				return newMap;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Unlock upgrades based on total frogs
	useEffect(() => {
		setUpgrades((prev) =>
			prev.map((upgrade) => {
				if (!upgrade.unlocked && gameState.totalFrogs >= upgrade.cost / 2) {
					return { ...upgrade, unlocked: true };
				}
				return upgrade;
			}),
		);
	}, [gameState.totalFrogs]);

	return {
		gameState,
		upgrades,
		achievements: playerAchievements,
		spells: availableSpells,
		activeSpells,
		goldenClicks,
		clickFrog,
		purchaseUpgrade,
		castSpell,
		clickPower: calculateClickPower(),
		hydrateFromPersisted,
	};
};
