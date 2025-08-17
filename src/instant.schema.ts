// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
	entities: {
		// System buckets (leave as-is if you plan to use Instant Auth later)
		$files: i.entity({
			path: i.string().unique().indexed(),
			url: i.string(),
		}),
		$users: i.entity({
			email: i.string().unique().indexed().optional(),
		}),

		// Custom auth store (for prototype-only; stores credential hash)
		auths: i.entity({
			email: i.string().unique().indexed(),
			passwordHash: i.string(),
			passwordSalt: i.string(),
			// Owner identifier for client-side auth prototype
			ownerId: i.string().indexed(),
			createdAt: i.date(),
			lastLoginAt: i.date().optional(),
		}),

		// Public profile (leaderboard uses username only)
		profiles: i.entity({
			username: i.string().unique().indexed(),
			// Linkage for ownership in prototype
			ownerId: i.string().indexed(),
			createdAt: i.date(),
			avatarEmoji: i.string().optional(),
			theme: i.string().optional(),
		}),

		// Game stats tracked per profile
		stats: i.entity({
			ownerId: i.string().indexed(),
			totalFrogs: i.number().indexed(),
			totalClicks: i.number().indexed(),
			frogsPerSecond: i.number(),
			prestige: i.number(),
			lastActiveAt: i.date(),
			createdAt: i.date(),
		}),

		// Purchases (items bought)
		purchases: i.entity({
			ownerId: i.string().indexed(),
			itemId: i.string().indexed(),
			name: i.string(),
			quantity: i.number(),
			totalSpent: i.number(),
			createdAt: i.date(),
		}),

		// Optional catalog of upgrades (static, but typed here for future)
		upgrades: i.entity({
			key: i.string().unique().indexed(),
			name: i.string(),
			description: i.string(),
			baseCost: i.number(),
			type: i.string(), // 'click' | 'auto'
			multiplier: i.number(),
		}),

		// Lore: static entries of in-world fiction
		loreEntries: i.entity({
			key: i.string().unique().indexed(),
			title: i.string(),
			guild: i.string().indexed(),
			order: i.number().indexed(),
			body: i.string(),
			conditionType: i.string().optional(), // 'threshold' | 'prestige' | 'achievement' | 'upgrade' | 'time'
			conditionValue: i.string().optional(), // e.g., '5000', '1', 'first-frog', 'fish-net', 'night'
		}),

		// Lore unlocks per player
		loreUnlocks: i.entity({
			ownerId: i.string().indexed(),
			loreKey: i.string().indexed(),
			unlockedAt: i.date(),
			readAt: i.date().optional(),
		}),
	},
	links: {
		// If you enable Instant Auth later, you can use these links safely
		profileUser: {
			forward: { on: "profiles", has: "one", label: "$user" },
			reverse: { on: "$users", has: "one", label: "profile" },
		},
		statsProfile: {
			forward: { on: "stats", has: "one", label: "profile" },
			reverse: { on: "profiles", has: "one", label: "stats" },
		},
		purchaseOwner: {
			forward: { on: "purchases", has: "one", label: "profile" },
			reverse: { on: "profiles", has: "many", label: "purchases" },
		},
		loreUnlockOwner: {
			forward: { on: "loreUnlocks", has: "one", label: "profile" },
			reverse: { on: "profiles", has: "many", label: "loreUnlocks" },
		},
		loreUnlockEntry: {
			forward: { on: "loreUnlocks", has: "one", label: "loreEntry" },
			reverse: { on: "loreEntries", has: "many", label: "unlocks" },
		},
	},
	rooms: {},
});

// This helps Typescript display nicer intellisense
type AppSchema = typeof _schema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
