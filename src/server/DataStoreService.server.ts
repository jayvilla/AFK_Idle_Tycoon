import { DataStoreService } from "@rbxts/services";
import {
  PlayerSaveData,
  DEFAULT_PLAYER_DATA,
  DATA_VERSION,
} from "../shared/DataTypes";

// Configuration
const DATASTORE_NAME = "PlayerData";
const MAX_RETRIES = 5;
const RETRY_DELAY = 1; // seconds
const SAVE_INTERVAL = 30; // Auto-save every 30 seconds

// Get DataStore
const dataStore = DataStoreService.GetDataStore(DATASTORE_NAME);

// Track pending saves
const pendingSaves = new Map<number, boolean>();

/**
 * Get player's UserId as a key
 */
function getPlayerKey(userId: number): string {
  return `Player_${userId}`;
}

/**
 * Retry wrapper for DataStore operations
 */
async function retryDataStoreOperation<T>(
  operation: () => T,
  operationName: string,
  userId: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const [success, result] = pcall(operation);

    if (success) {
      if (attempt > 1) {
        print(
          `[DataStore] ${operationName} succeeded on attempt ${attempt} for user ${userId}`
        );
      }
      return result as T;
    }

    lastError = result;
    warn(
      `[DataStore] ${operationName} failed (attempt ${attempt}/${MAX_RETRIES}) for user ${userId}: ${result}`
    );

    if (attempt < MAX_RETRIES) {
      task.wait(RETRY_DELAY * attempt); // Exponential backoff
    }
  }

  error(
    `[DataStore] ${operationName} failed after ${MAX_RETRIES} attempts for user ${userId}: ${lastError}`
  );
}

/**
 * Migrate old data format to current version
 */
function migrateData(data: unknown, currentVersion: number): PlayerSaveData {
  // For now, just ensure version is set
  // In future phases, add migration logic here
  if (typeIs(data, "table")) {
    const typedData = data as Partial<PlayerSaveData>;

    // If data exists but version is missing/old, migrate it
    if (!typedData.version || typedData.version < currentVersion) {
      print(
        `[DataStore] Migrating data from version ${
          typedData.version ?? "unknown"
        } to ${currentVersion}`
      );

      // Return migrated data (for now, just ensure defaults)
      return {
        version: currentVersion,
        currency: typedData.currency ?? DEFAULT_PLAYER_DATA.currency,
        lastSaveTime:
          typedData.lastSaveTime ?? DEFAULT_PLAYER_DATA.lastSaveTime,
        rebirthCount:
          typedData.rebirthCount ?? DEFAULT_PLAYER_DATA.rebirthCount,
        upgradeLevels:
          typedData.upgradeLevels ?? DEFAULT_PLAYER_DATA.upgradeLevels,
        unlockedZones:
          typedData.unlockedZones ?? DEFAULT_PLAYER_DATA.unlockedZones,
        hasVIP: typedData.hasVIP ?? DEFAULT_PLAYER_DATA.hasVIP,
        hasDoubleCash:
          typedData.hasDoubleCash ?? DEFAULT_PLAYER_DATA.hasDoubleCash,
        hasAutoCollect:
          typedData.hasAutoCollect ?? DEFAULT_PLAYER_DATA.hasAutoCollect,
        activeBoosts:
          typedData.activeBoosts ?? DEFAULT_PLAYER_DATA.activeBoosts,
      };
    }

    // Ensure all fields exist even if version is current
    const migrated: PlayerSaveData = {
      version: currentVersion,
      currency: typedData.currency ?? DEFAULT_PLAYER_DATA.currency,
      lastSaveTime: typedData.lastSaveTime ?? DEFAULT_PLAYER_DATA.lastSaveTime,
      rebirthCount: typedData.rebirthCount ?? DEFAULT_PLAYER_DATA.rebirthCount,
      upgradeLevels:
        typedData.upgradeLevels ?? DEFAULT_PLAYER_DATA.upgradeLevels,
      unlockedZones:
        typedData.unlockedZones ?? DEFAULT_PLAYER_DATA.unlockedZones,
      hasVIP: typedData.hasVIP ?? DEFAULT_PLAYER_DATA.hasVIP,
      hasDoubleCash:
        typedData.hasDoubleCash ?? DEFAULT_PLAYER_DATA.hasDoubleCash,
      hasAutoCollect:
        typedData.hasAutoCollect ?? DEFAULT_PLAYER_DATA.hasAutoCollect,
      activeBoosts: typedData.activeBoosts ?? DEFAULT_PLAYER_DATA.activeBoosts,
    };

    return migrated;
  }

  // Invalid data, return defaults
  return { ...DEFAULT_PLAYER_DATA, version: currentVersion };
}

/**
 * Load player data from DataStore
 */
export async function loadPlayerData(userId: number): Promise<PlayerSaveData> {
  const key = getPlayerKey(userId);

  return retryDataStoreOperation(
    () => {
      const [success, data] = pcall(() => dataStore.GetAsync(key));

      if (!success) {
        error(`Failed to get data for ${key}: ${data}`);
      }

      if (data === undefined) {
        // New player, return default data
        print(`[DataStore] New player detected: ${userId}`);
        return { ...DEFAULT_PLAYER_DATA, version: DATA_VERSION };
      }

      // Migrate and return data
      return migrateData(data, DATA_VERSION);
    },
    "LoadPlayerData",
    userId
  );
}

/**
 * Save player data to DataStore
 */
export async function savePlayerData(
  userId: number,
  data: PlayerSaveData
): Promise<void> {
  const key = getPlayerKey(userId);

  // Update save time
  data.lastSaveTime = os.time();
  data.version = DATA_VERSION;

  // Mark as pending
  pendingSaves.set(userId, true);

  try {
    await retryDataStoreOperation(
      () => {
        const [success, result] = pcall(() => dataStore.SetAsync(key, data));

        if (!success) {
          error(`Failed to save data for ${key}: ${result}`);
        }

        print(
          `[DataStore] Saved data for user ${userId} (currency: ${data.currency})`
        );
        return undefined; // Return void
      },
      "SavePlayerData",
      userId
    );
  } finally {
    // Remove pending flag
    pendingSaves.delete(userId);
  }
}

/**
 * Check if a player has a pending save
 */
export function hasPendingSave(userId: number): boolean {
  return pendingSaves.has(userId);
}

/**
 * Get save interval for auto-save
 */
export function getSaveInterval(): number {
  return SAVE_INTERVAL;
}
