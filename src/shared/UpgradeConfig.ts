/**
 * Upgrade configuration
 */
export interface Upgrade {
	id: string;
	name: string;
	description: string;
	baseCost: number;
	costMultiplier: number; // Cost increases by this multiplier per level
	incomeMultiplier: number; // Income multiplier per level (additive)
	maxLevel: number; // -1 for unlimited
	zoneRequired?: string; // Zone ID required to unlock this upgrade
}

/**
 * Zone configuration
 */
export interface Zone {
	id: string;
	name: string;
	description: string;
	unlockCost: number; // Currency cost to unlock
	incomeMultiplier: number; // Base income multiplier for this zone
	isVIP: boolean; // Requires VIP gamepass
}

/**
 * All available upgrades
 */
export const UPGRADES: Upgrade[] = [
	{
		id: "income_boost_1",
		name: "Income Boost I",
		description: "+10% income per level",
		baseCost: 100,
		costMultiplier: 1.5,
		incomeMultiplier: 0.1, // 10% per level
		maxLevel: 10,
	},
	{
		id: "income_boost_2",
		name: "Income Boost II",
		description: "+25% income per level",
		baseCost: 500,
		costMultiplier: 2.0,
		incomeMultiplier: 0.25, // 25% per level
		maxLevel: 5,
		zoneRequired: "zone_2",
	},
	{
		id: "auto_collect",
		name: "Auto Collect",
		description: "Automatically collect currency (cosmetic)",
		baseCost: 1000,
		costMultiplier: 1.0,
		incomeMultiplier: 0,
		maxLevel: 1,
	},
	{
		id: "offline_boost",
		name: "Offline Earnings",
		description: "+10% offline earnings per level",
		baseCost: 200,
		costMultiplier: 1.8,
		incomeMultiplier: 0, // Doesn't affect active income
		maxLevel: 5,
	},
];

/**
 * All available zones
 */
export const ZONES: Zone[] = [
	{
		id: "zone_1",
		name: "Starter Zone",
		description: "Your starting area",
		unlockCost: 0, // Free, starting zone
		incomeMultiplier: 1.0,
		isVIP: false,
	},
	{
		id: "zone_2",
		name: "Forest Zone",
		description: "A peaceful forest with better rewards",
		unlockCost: 5000,
		incomeMultiplier: 1.5,
		isVIP: false,
	},
	{
		id: "zone_3",
		name: "Mountain Zone",
		description: "High altitude, high rewards",
		unlockCost: 25000,
		incomeMultiplier: 2.0,
		isVIP: false,
	},
	{
		id: "zone_vip",
		name: "VIP Zone",
		description: "Exclusive zone for VIP members",
		unlockCost: 0, // Free if you have VIP
		incomeMultiplier: 3.0,
		isVIP: true,
	},
];

/**
 * Get upgrade by ID
 */
export function getUpgrade(id: string): Upgrade | undefined {
	return UPGRADES.find((upgrade) => upgrade.id === id);
}

/**
 * Get zone by ID
 */
export function getZone(id: string): Zone | undefined {
	return ZONES.find((zone) => zone.id === id);
}

/**
 * Calculate upgrade cost for a specific level
 */
export function getUpgradeCost(upgrade: Upgrade, level: number): number {
	return math.floor(upgrade.baseCost * math.pow(upgrade.costMultiplier, level));
}

