/**
 * Player data schema stored in DataStore
 */
export interface PlayerSaveData {
	version: number; // Data version for migrations
	currency: number;
	lastSaveTime: number; // Unix timestamp
	rebirthCount: number; // For Phase 3
}

/**
 * Default player data
 */
export const DEFAULT_PLAYER_DATA: PlayerSaveData = {
	version: 1,
	currency: 0,
	lastSaveTime: 0,
	rebirthCount: 0,
};

/**
 * Current data version - increment when schema changes
 */
export const DATA_VERSION = 1;

/**
 * Base income per second (moved here for shared access)
 */
export const BASE_INCOME_PER_SECOND = 1;

