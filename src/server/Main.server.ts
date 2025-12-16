import { Players, DataStoreService } from "@rbxts/services";
import { CurrencyUpdate, RebirthRequest, RebirthResponse, RebirthCountUpdate } from "../shared/RemoteEvents";
import { PlayerSaveData, DEFAULT_PLAYER_DATA, DATA_VERSION, getRebirthCost, getRebirthIncomeMultiplier } from "../shared/DataTypes";

print("AFK Tycoon TypeScript server running");

// Configuration
const INCOME_TICK_INTERVAL = 1; // seconds
const OFFLINE_EARNINGS_CAP_HOURS = 24; // Max 24 hours of offline earnings
const OFFLINE_EARNINGS_MULTIPLIER = 0.5; // 50% of normal income when offline
const BASE_INCOME_PER_SECOND = 1; // Base income per second

// DataStore configuration
const DATASTORE_NAME = "PlayerData";
const MAX_RETRIES = 5;
const RETRY_DELAY = 1; // seconds
const SAVE_INTERVAL = 30; // Auto-save every 30 seconds

// Get DataStore
const dataStore = DataStoreService.GetDataStore(DATASTORE_NAME);

// Track pending saves
const pendingSaves = new Map<number, boolean>();

// Player data interface (in-memory)
interface PlayerData {
	saveData: PlayerSaveData;
	sessionStartTime: number;
	lastSaveTime: number; // Last time we saved to DataStore
}

// Store player data in memory
const playerDataMap = new Map<Player, PlayerData>();

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
	userId: number,
): Promise<T> {
	let lastError: unknown;
	
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		const [success, result] = pcall(operation);
		
		if (success) {
			if (attempt > 1) {
				print(`[DataStore] ${operationName} succeeded on attempt ${attempt} for user ${userId}`);
			}
			return result as T;
		}
		
		lastError = result;
		warn(`[DataStore] ${operationName} failed (attempt ${attempt}/${MAX_RETRIES}) for user ${userId}: ${result}`);
		
		if (attempt < MAX_RETRIES) {
			task.wait(RETRY_DELAY * attempt); // Exponential backoff
		}
	}
	
	error(`[DataStore] ${operationName} failed after ${MAX_RETRIES} attempts for user ${userId}: ${lastError}`);
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
			print(`[DataStore] Migrating data from version ${typedData.version ?? "unknown"} to ${currentVersion}`);
			
			// Return migrated data (for now, just ensure defaults)
			return {
				version: currentVersion,
				currency: typedData.currency ?? DEFAULT_PLAYER_DATA.currency,
				lastSaveTime: typedData.lastSaveTime ?? DEFAULT_PLAYER_DATA.lastSaveTime,
				rebirthCount: typedData.rebirthCount ?? DEFAULT_PLAYER_DATA.rebirthCount,
			};
		}
		
		return typedData as PlayerSaveData;
	}
	
	// Invalid data, return defaults
	return { ...DEFAULT_PLAYER_DATA, version: currentVersion };
}

/**
 * Load player data from DataStore
 */
async function loadPlayerData(userId: number): Promise<PlayerSaveData> {
	const key = getPlayerKey(userId);
	
	return retryDataStoreOperation(() => {
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
	}, "LoadPlayerData", userId);
}

/**
 * Save player data to DataStore
 */
async function savePlayerData(userId: number, data: PlayerSaveData): Promise<void> {
	const key = getPlayerKey(userId);
	
	// Update save time
	data.lastSaveTime = os.time();
	data.version = DATA_VERSION;
	
	// Mark as pending
	pendingSaves.set(userId, true);
	
	try {
		await retryDataStoreOperation(() => {
			const [success] = pcall(() => dataStore.SetAsync(key, data));
			
			if (!success) {
				error(`Failed to save data for ${key}`);
			}
			
			print(`[DataStore] Saved data for user ${userId} (currency: ${data.currency})`);
			return undefined; // Return void
		}, "SavePlayerData", userId);
	} finally {
		// Remove pending flag
		pendingSaves.delete(userId);
	}
}

/**
 * Check if a player has a pending save
 */
function hasPendingSave(userId: number): boolean {
	return pendingSaves.has(userId);
}

/**
 * Calculate offline earnings based on time difference
 */
function calculateOfflineEarnings(lastSaveTime: number): number {
	if (lastSaveTime === 0) {
		return 0; // New player, no offline earnings
	}

	const currentTime = os.time();
	const timeDiff = currentTime - lastSaveTime;
	
	// Cap offline earnings (convert hours to seconds)
	const maxOfflineSeconds = OFFLINE_EARNINGS_CAP_HOURS * 3600;
	const cappedTimeDiff = math.min(timeDiff, maxOfflineSeconds);
	
	// Calculate earnings (50% of normal income rate)
	const offlineEarnings = math.floor(cappedTimeDiff * BASE_INCOME_PER_SECOND * OFFLINE_EARNINGS_MULTIPLIER);
	
	if (offlineEarnings > 0) {
		const hoursOffline = math.floor(timeDiff / 3600);
		print(`[CurrencyManager] Player was offline for ${hoursOffline} hours, earning ${offlineEarnings} currency`);
	}
	
	return offlineEarnings;
}

/**
 * Initialize player data when they join (async - loads from DataStore)
 */
async function initializePlayer(player: Player): Promise<void> {
	try {
		// Load data from DataStore
		const saveData = await loadPlayerData(player.UserId);
		
		// Calculate offline earnings
		const offlineEarnings = calculateOfflineEarnings(saveData.lastSaveTime);
		if (offlineEarnings > 0) {
			saveData.currency += offlineEarnings;
		}
		
		// Create in-memory player data
		const playerData: PlayerData = {
			saveData: saveData,
			sessionStartTime: os.time(),
			lastSaveTime: os.time(),
		};
		
		playerDataMap.set(player, playerData);
		
		// Send initial currency and rebirth count to client
		CurrencyUpdate.FireClient(player, saveData.currency);
		RebirthCountUpdate.FireClient(player, saveData.rebirthCount);
		
		if (offlineEarnings > 0) {
			print(`[CurrencyManager] Loaded player ${player.Name}: ${saveData.currency} currency (${offlineEarnings} from offline), ${saveData.rebirthCount} rebirths`);
		} else {
			print(`[CurrencyManager] Loaded player ${player.Name}: ${saveData.currency} currency, ${saveData.rebirthCount} rebirths`);
		}
	} catch (error) {
		warn(`[CurrencyManager] Failed to load data for ${player.Name}, using defaults: ${error}`);
		
		// Use default data on error
		const defaultData: PlayerData = {
			saveData: {
				version: DATA_VERSION,
				currency: 0,
				lastSaveTime: 0,
				rebirthCount: 0,
			},
			sessionStartTime: os.time(),
			lastSaveTime: os.time(),
		};
		
		playerDataMap.set(player, defaultData);
		CurrencyUpdate.FireClient(player, 0);
	}
}

/**
 * Save player data to DataStore
 */
async function savePlayer(player: Player): Promise<void> {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[CurrencyManager] Attempted to save data for ${player.Name} but they have no data`);
		return;
	}
	
	// Don't save if there's already a pending save
	if (hasPendingSave(player.UserId)) {
		warn(`[CurrencyManager] Save already pending for ${player.Name}, skipping`);
		return;
	}
	
	try {
		await savePlayerData(player.UserId, playerData.saveData);
		playerData.lastSaveTime = os.time();
	} catch (error) {
		warn(`[CurrencyManager] Failed to save data for ${player.Name}: ${error}`);
	}
}

/**
 * Remove player data when they leave (save first)
 */
async function removePlayer(player: Player): Promise<void> {
	// Save data before removing
	await savePlayer(player);
	
	playerDataMap.delete(player);
	print(`[CurrencyManager] Removed player ${player.Name} from currency system`);
}

/**
 * Add currency to a player (server-authoritative)
 */
function addCurrency(player: Player, amount: number): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[CurrencyManager] Attempted to add currency to player ${player.Name} but they have no data`);
		return;
	}

	// Server-authoritative: only server can modify currency
	playerData.saveData.currency += amount;

	// Update client
	CurrencyUpdate.FireClient(player, playerData.saveData.currency);

	print(`[CurrencyManager] Added ${amount} currency to ${player.Name}. New total: ${playerData.saveData.currency}`);
}

/**
 * AFK Income Loop - runs every second
 */
function processAFKIncome(): void {
	for (const [player, playerData] of playerDataMap) {
		// Only process if player is still in game
		if (!player.Parent) {
			continue;
		}

		// Calculate income with rebirth multiplier
		const rebirthMultiplier = getRebirthIncomeMultiplier(playerData.saveData.rebirthCount);
		const income = BASE_INCOME_PER_SECOND * rebirthMultiplier;

		// Add currency
		addCurrency(player, income);
	}
}

/**
 * Handle rebirth request from client
 */
function handleRebirth(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[Rebirth] Player ${player.Name} has no data`);
		RebirthResponse.FireClient(player, false, "No player data found");
		return;
	}

	const currentRebirthCount = playerData.saveData.rebirthCount;
	const rebirthCost = getRebirthCost(currentRebirthCount);
	const currentCurrency = playerData.saveData.currency;

	// Validate player has enough currency
	if (currentCurrency < rebirthCost) {
		const shortfall = rebirthCost - currentCurrency;
		RebirthResponse.FireClient(player, false, `Need ${shortfall} more currency to rebirth!`);
		print(`[Rebirth] ${player.Name} attempted rebirth but only has ${currentCurrency}/${rebirthCost} currency`);
		return;
	}

	// Perform rebirth
	playerData.saveData.rebirthCount += 1;
	playerData.saveData.currency = 0; // Reset currency
	playerData.sessionStartTime = os.time(); // Reset session time

	// Update client with new currency
	CurrencyUpdate.FireClient(player, 0);

	// Send success response and update rebirth count
	RebirthResponse.FireClient(player, true, `Rebirth ${playerData.saveData.rebirthCount} complete! Income multiplier: ${getRebirthIncomeMultiplier(playerData.saveData.rebirthCount)}x`);
	RebirthCountUpdate.FireClient(player, playerData.saveData.rebirthCount);

	print(`[Rebirth] ${player.Name} performed rebirth #${playerData.saveData.rebirthCount}. New income multiplier: ${getRebirthIncomeMultiplier(playerData.saveData.rebirthCount)}x`);

	// Save immediately after rebirth
	savePlayer(player);
}

/**
 * Auto-save loop - saves player data periodically
 */
function startAutoSaveLoop(): void {
	task.spawn(() => {
		while (true) {
			task.wait(SAVE_INTERVAL);
			
			// Save all players
			for (const [player] of playerDataMap) {
				if (player.Parent) {
					savePlayer(player);
				}
			}
		}
	});
	
	print("[CurrencyManager] Auto-save loop started");
}

/**
 * Start the AFK income loop
 */
function startIncomeLoop(): void {
	// Spawn a coroutine that runs every second
	task.spawn(() => {
		while (true) {
			processAFKIncome();
			task.wait(INCOME_TICK_INTERVAL);
		}
	});

	print("[CurrencyManager] AFK income loop started");
}

// Initialize existing players
for (const player of Players.GetPlayers()) {
	initializePlayer(player);
}

// Handle new players
Players.PlayerAdded.Connect((player) => {
	initializePlayer(player);
});

// Handle leaving players
Players.PlayerRemoving.Connect((player) => {
	removePlayer(player);
});

// Start AFK income loop
startIncomeLoop();

// Start auto-save loop
startAutoSaveLoop();

// Handle rebirth requests
RebirthRequest.OnServerEvent.Connect((player) => {
	handleRebirth(player);
});

print("[CurrencyManager] Service initialized");
