/**
 * Achievements System Configuration
 */

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string; // Emoji or icon identifier
	category: "currency" | "rebirth" | "upgrade" | "zone" | "time" | "streak" | "milestone";
	requirement: number; // Value needed to unlock
	reward?: number; // Optional currency reward
}

/**
 * All achievements in the game
 */
export const ACHIEVEMENTS: Achievement[] = [
	// Currency achievements
	{
		id: "first_dollar",
		name: "First Dollar",
		description: "Earn your first dollar",
		icon: "💰",
		category: "currency",
		requirement: 1,
		reward: 10,
	},
	{
		id: "hundred_dollars",
		name: "Hundredaire",
		description: "Earn $100",
		icon: "💵",
		category: "currency",
		requirement: 100,
		reward: 50,
	},
	{
		id: "thousand_dollars",
		name: "Thousandaire",
		description: "Earn $1,000",
		icon: "💴",
		category: "currency",
		requirement: 1000,
		reward: 200,
	},
	{
		id: "million_dollars",
		name: "Millionaire",
		description: "Earn $1,000,000",
		icon: "💶",
		category: "currency",
		requirement: 1000000,
		reward: 10000,
	},
	
	// Rebirth achievements
	{
		id: "first_rebirth",
		name: "Reborn",
		description: "Complete your first rebirth",
		icon: "🔄",
		category: "rebirth",
		requirement: 1,
		reward: 500,
	},
	{
		id: "ten_rebirths",
		name: "Rebirth Master",
		description: "Complete 10 rebirths",
		icon: "⭐",
		category: "rebirth",
		requirement: 10,
		reward: 5000,
	},
	{
		id: "hundred_rebirths",
		name: "Rebirth Legend",
		description: "Complete 100 rebirths",
		icon: "👑",
		category: "rebirth",
		requirement: 100,
		reward: 100000,
	},
	
	// Upgrade achievements
	{
		id: "first_upgrade",
		name: "Upgrade Novice",
		description: "Purchase your first upgrade",
		icon: "⬆️",
		category: "upgrade",
		requirement: 1,
		reward: 100,
	},
	{
		id: "ten_upgrades",
		name: "Upgrade Enthusiast",
		description: "Purchase 10 upgrades total",
		icon: "📈",
		category: "upgrade",
		requirement: 10,
		reward: 1000,
	},
	{
		id: "max_upgrade",
		name: "Maxed Out",
		description: "Max out any upgrade",
		icon: "🏆",
		category: "upgrade",
		requirement: 1, // Special - checked differently
		reward: 5000,
	},
	
	// Zone achievements
	{
		id: "unlock_zone",
		name: "Explorer",
		description: "Unlock your first zone",
		icon: "🗺️",
		category: "zone",
		requirement: 1,
		reward: 200,
	},
	{
		id: "all_zones",
		name: "World Traveler",
		description: "Unlock all zones",
		icon: "🌍",
		category: "zone",
		requirement: 4, // Adjust based on total zones
		reward: 10000,
	},
	
	// Time achievements
	{
		id: "play_hour",
		name: "Dedicated",
		description: "Play for 1 hour total",
		icon: "⏰",
		category: "time",
		requirement: 60, // minutes
		reward: 500,
	},
	{
		id: "play_day",
		name: "Marathon",
		description: "Play for 24 hours total",
		icon: "🎯",
		category: "time",
		requirement: 1440, // minutes (24 hours)
		reward: 50000,
	},
	
	// Streak achievements
	{
		id: "idle_30min",
		name: "Idle Master",
		description: "Idle for 30 minutes straight",
		icon: "😴",
		category: "streak",
		requirement: 30,
		reward: 300,
	},
	{
		id: "idle_2hours",
		name: "AFK Champion",
		description: "Idle for 2 hours straight",
		icon: "💤",
		category: "streak",
		requirement: 120,
		reward: 2000,
	},
	{
		id: "login_7days",
		name: "Loyal Player",
		description: "Login for 7 days straight",
		icon: "🔥",
		category: "streak",
		requirement: 7,
		reward: 5000,
	},
	
	// Milestone achievements
	{
		id: "first_vip",
		name: "VIP Status",
		description: "Purchase VIP Zone access",
		icon: "💎",
		category: "milestone",
		requirement: 1,
		reward: 1000,
	},
	{
		id: "claim_daily",
		name: "Daily Grinder",
		description: "Claim 10 daily rewards",
		icon: "📅",
		category: "milestone",
		requirement: 10,
		reward: 2000,
	},
];

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
	return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement["category"]): Achievement[] {
	return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get all achievement IDs
 */
export function getAllAchievementIds(): string[] {
	return ACHIEVEMENTS.map((a) => a.id);
}

