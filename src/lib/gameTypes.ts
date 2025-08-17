export interface GameState {
	totalFrogs: number;
	frogsPerSecond: number;
	totalClicks: number;
	prestige: number;
	// optional crit metadata (used for transient UI)
	lastCritAt?: number;
}

export interface Upgrade {
	id: string;
	name: string;
	description: string;
	cost: number;
	multiplier: number;
	quantity: number;
	type: "click" | "auto";
	unlocked: boolean;
	emoji: string;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	requirement: number;
	unlocked: boolean;
	emoji: string;
}

export interface Spell {
	id: string;
	name: string;
	description: string;
	cost: number;
	duration: number;
	effect: string;
	multiplier: number;
	cooldown: number;
	emoji: string;
}

export const initialUpgrades: Upgrade[] = [
	{
		id: "lily-pad",
		name: "Lily Pad",
		description: "A comfy spot for more frogs",
		cost: 15,
		multiplier: 1,
		quantity: 0,
		type: "auto",
		unlocked: true,
		emoji: "🪷",
	},
	{
		id: "magic-wand",
		name: "Magic Wand",
		description: "Increases clicking power",
		cost: 100,
		multiplier: 2,
		quantity: 0,
		type: "click",
		unlocked: true,
		emoji: "🪄",
	},
	{
		id: "crystal-ball",
		name: "Crystal Ball",
		description: "Automatically generates frogs",
		cost: 500,
		multiplier: 5,
		quantity: 0,
		type: "auto",
		unlocked: true,
		emoji: "🔮",
	},
	{
		id: "wizard-hat",
		name: "Wizard Hat",
		description: "Boosts all frog production",
		cost: 2000,
		multiplier: 10,
		quantity: 0,
		type: "auto",
		unlocked: true,
		emoji: "🧙‍♂️",
	},
	{
		id: "enchanted-pond",
		name: "Enchanted Pond",
		description: "A magical breeding ground",
		cost: 10000,
		multiplier: 50,
		quantity: 0,
		type: "auto",
		unlocked: true,
		emoji: "🌊",
	},
	{
		id: "frog-portal",
		name: "Frog Portal",
		description: "Summons frogs from other dimensions",
		cost: 100000,
		multiplier: 200,
		quantity: 0,
		type: "auto",
		unlocked: false,
		emoji: "🌀",
	},
];

export const achievements: Achievement[] = [
	{
		id: "first-frog",
		name: "First Frog",
		description: "Click your first frog",
		requirement: 1,
		unlocked: false,
		emoji: "🐸",
	},
	{
		id: "hundred-frogs",
		name: "Frog Collector",
		description: "Collect 100 frogs",
		requirement: 100,
		unlocked: false,
		emoji: "💯",
	},
	{
		id: "thousand-frogs",
		name: "Frog Master",
		description: "Collect 1,000 frogs",
		requirement: 1000,
		unlocked: false,
		emoji: "🏆",
	},
	{
		id: "ten-thousand-frogs",
		name: "Frog Wizard",
		description: "Collect 10,000 frogs",
		requirement: 10000,
		unlocked: false,
		emoji: "🧙‍♂️",
	},
	{
		id: "million-frogs",
		name: "Frog God",
		description: "Collect 1,000,000 frogs",
		requirement: 1000000,
		unlocked: false,
		emoji: "⚡",
	},
];

export const spells: Spell[] = [
	{
		id: "frog-rain",
		name: "Frog Rain",
		description: "10x click power for 30 seconds",
		cost: 1000,
		duration: 30000,
		effect: "click_multiplier",
		multiplier: 10,
		cooldown: 120000,
		emoji: "🌧️",
	},
	{
		id: "time-warp",
		name: "Time Warp",
		description: "5x auto production for 60 seconds",
		cost: 5000,
		duration: 60000,
		effect: "auto_multiplier",
		multiplier: 5,
		cooldown: 300000,
		emoji: "⏰",
	},
	{
		id: "golden-touch",
		name: "Golden Touch",
		description: "Next 50 clicks give 100x frogs",
		cost: 10000,
		duration: 0,
		effect: "golden_clicks",
		multiplier: 100,
		cooldown: 600000,
		emoji: "✨",
	},
];
