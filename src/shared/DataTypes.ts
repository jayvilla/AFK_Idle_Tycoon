/**
 * Player data schema stored in DataStore
 */
export interface PlayerSaveData {
	version: number; // Data version for migrations
	currency: number;
	lastSaveTime: number; // Unix timestamp
	rebirthCount: number; // For Phase 3
	upgradeLevels: { [upgradeId: string]: number }; // Upgrade ID -> Level
	unlockedZones: string[]; // Array of unlocked zone IDs
	hasVIP: boolean; // VIP gamepass status (Phase 5)
}

/**
 * Default player data
 */
export const DEFAULT_PLAYER_DATA: PlayerSaveData = {
	version: 1,
	currency: 0,
	lastSaveTime: 0,
	rebirthCount: 0,
	upgradeLevels: {},
	unlockedZones: ["zone_1"], // Start with zone_1 unlocked
	hasVIP: false,
};

/**
 * Current data version - increment when schema changes
 */
export const DATA_VERSION = 1;

/**
 * Base income per second (moved here for shared access)
 */
export const BASE_INCOME_PER_SECOND = 1;

/**
 * Rebirth system configuration
 */
export const REBIRTH_BASE_COST = 1000; // Base cost for first rebirth
export const REBIRTH_COST_MULTIPLIER = 2.5; // Cost multiplier per rebirth
export const REBIRTH_INCOME_MULTIPLIER = 1.5; // Income multiplier per rebirth

/**
 * Calculate rebirth requirement based on rebirth count
 * Formula: baseCost * (multiplier ^ rebirthCount)
 */
export function getRebirthCost(rebirthCount: number): number {
	return math.floor(REBIRTH_BASE_COST * math.pow(REBIRTH_COST_MULTIPLIER, rebirthCount));
}

/**
 * Calculate total income multiplier from rebirths
 * Formula: (incomeMultiplier ^ rebirthCount)
 */
export function getRebirthIncomeMultiplier(rebirthCount: number): number {
	if (rebirthCount === 0) {
		return 1;
	}
	return math.pow(REBIRTH_INCOME_MULTIPLIER, rebirthCount);
}

