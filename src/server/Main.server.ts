import { Players, DataStoreService, MarketplaceService } from "@rbxts/services";
import { CurrencyUpdate, RebirthRequest, RebirthResponse, RebirthCountUpdate, UpgradePurchaseRequest, UpgradePurchaseResponse, ZoneUnlockRequest, ZoneUnlockResponse, PlayerDataUpdate, AFKRewardClaimRequest, AFKRewardClaimResponse, DailyLoginClaimRequest, DailyLoginClaimResponse, LeaderboardRequest, LeaderboardResponse, AchievementUnlocked, AchievementsUpdate, AchievementProgressUpdate } from "../shared/RemoteEvents";
import { PlayerSaveData, DEFAULT_PLAYER_DATA, DATA_VERSION, getRebirthCost, getRebirthIncomeMultiplier } from "../shared/DataTypes";
import { UPGRADES, ZONES, getUpgrade, getZone, getUpgradeCost } from "../shared/UpgradeConfig";
import { GAMEPASS_IDS, PRODUCT_IDS, BOOST_DURATION_1HOUR, BOOST_MULTIPLIER_2X, BOOST_MULTIPLIER_5X } from "../shared/MonetizationConfig";
import { getCurrentDateString, isYesterday, getIdleStreakMultiplier, getDailyLoginReward, getAFKReward, AFK_REWARD_INTERVAL, PREMIUM_SESSION_MULTIPLIER, PREMIUM_REWARD_MULTIPLIER } from "../shared/RetentionConfig";
import { ACHIEVEMENTS, getAchievement } from "../shared/AchievementsConfig";

print("AFK Tycoon TypeScript server running");

// Configuration
const INCOME_TICK_INTERVAL = 1; // seconds
const OFFLINE_EARNINGS_CAP_HOURS = 24; // Max 24 hours of offline earnings
const OFFLINE_EARNINGS_MULTIPLIER = 0.5; // 50% of normal income when offline
const BASE_INCOME_PER_SECOND = 1; // Base income per second

// DataStore configuration
const DATASTORE_NAME = "PlayerData";
const LEADERBOARD_DATASTORE_NAME = "Leaderboards";
const MAX_RETRIES = 5;
const RETRY_DELAY = 1; // seconds
const SAVE_INTERVAL = 30; // Auto-save every 30 seconds
const LEADERBOARD_UPDATE_INTERVAL = 60; // Update leaderboards every 60 seconds

// Get DataStores
const dataStore = DataStoreService.GetDataStore(DATASTORE_NAME);
const leaderboardDataStore = DataStoreService.GetDataStore(LEADERBOARD_DATASTORE_NAME);

// Track pending saves
const pendingSaves = new Map<number, boolean>();

// Player data interface (in-memory)
interface PlayerData {
	saveData: PlayerSaveData;
	sessionStartTime: number;
	lastSaveTime: number; // Last time we saved to DataStore
	idleStreakStartTime: number; // When current idle streak started
	lastActivityTime: number; // Last time player was active (for AFK detection)
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
		upgradeLevels: typedData.upgradeLevels ?? DEFAULT_PLAYER_DATA.upgradeLevels,
		unlockedZones: typedData.unlockedZones ?? DEFAULT_PLAYER_DATA.unlockedZones,
		hasVIP: typedData.hasVIP ?? DEFAULT_PLAYER_DATA.hasVIP,
		hasDoubleCash: typedData.hasDoubleCash ?? DEFAULT_PLAYER_DATA.hasDoubleCash,
		hasAutoCollect: typedData.hasAutoCollect ?? DEFAULT_PLAYER_DATA.hasAutoCollect,
		activeBoosts: typedData.activeBoosts ?? DEFAULT_PLAYER_DATA.activeBoosts,
		lastLoginDate: typedData.lastLoginDate ?? DEFAULT_PLAYER_DATA.lastLoginDate,
		loginStreak: typedData.loginStreak ?? DEFAULT_PLAYER_DATA.loginStreak,
		idleStreak: typedData.idleStreak ?? DEFAULT_PLAYER_DATA.idleStreak,
		totalSessionTime: typedData.totalSessionTime ?? DEFAULT_PLAYER_DATA.totalSessionTime,
		afkRewardCooldown: typedData.afkRewardCooldown ?? DEFAULT_PLAYER_DATA.afkRewardCooldown,
		unlockedAchievements: typedData.unlockedAchievements ?? DEFAULT_PLAYER_DATA.unlockedAchievements,
		dailyRewardsClaimed: typedData.dailyRewardsClaimed ?? DEFAULT_PLAYER_DATA.dailyRewardsClaimed,
	};
	}
	
	// Ensure all fields exist even if version is current
	const migrated: PlayerSaveData = {
		version: currentVersion,
		currency: typedData.currency ?? DEFAULT_PLAYER_DATA.currency,
		lastSaveTime: typedData.lastSaveTime ?? DEFAULT_PLAYER_DATA.lastSaveTime,
		rebirthCount: typedData.rebirthCount ?? DEFAULT_PLAYER_DATA.rebirthCount,
		upgradeLevels: typedData.upgradeLevels ?? DEFAULT_PLAYER_DATA.upgradeLevels,
		unlockedZones: typedData.unlockedZones ?? DEFAULT_PLAYER_DATA.unlockedZones,
		hasVIP: typedData.hasVIP ?? DEFAULT_PLAYER_DATA.hasVIP,
		hasDoubleCash: typedData.hasDoubleCash ?? DEFAULT_PLAYER_DATA.hasDoubleCash,
		hasAutoCollect: typedData.hasAutoCollect ?? DEFAULT_PLAYER_DATA.hasAutoCollect,
		activeBoosts: typedData.activeBoosts ?? DEFAULT_PLAYER_DATA.activeBoosts,
		lastLoginDate: typedData.lastLoginDate ?? DEFAULT_PLAYER_DATA.lastLoginDate,
		loginStreak: typedData.loginStreak ?? DEFAULT_PLAYER_DATA.loginStreak,
		idleStreak: typedData.idleStreak ?? DEFAULT_PLAYER_DATA.idleStreak,
		totalSessionTime: typedData.totalSessionTime ?? DEFAULT_PLAYER_DATA.totalSessionTime,
		afkRewardCooldown: typedData.afkRewardCooldown ?? DEFAULT_PLAYER_DATA.afkRewardCooldown,
		unlockedAchievements: typedData.unlockedAchievements ?? DEFAULT_PLAYER_DATA.unlockedAchievements,
		dailyRewardsClaimed: typedData.dailyRewardsClaimed ?? DEFAULT_PLAYER_DATA.dailyRewardsClaimed,
	};
		
		return migrated;
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
 * Calculate total upgrade income multiplier
 */
function getTotalUpgradeMultiplier(playerData: PlayerData): number {
	let totalMultiplier = 0;
	
	for (const [upgradeId, level] of pairs(playerData.saveData.upgradeLevels)) {
		if (typeIs(upgradeId, "string")) {
			const upgrade = getUpgrade(upgradeId);
			if (upgrade && typeIs(level, "number") && level > 0) {
				totalMultiplier += upgrade.incomeMultiplier * level;
			}
		}
	}
	
	return 1 + totalMultiplier; // Additive, then convert to multiplier
}

/**
 * Get active boost multiplier from products
 */
function getActiveBoostMultiplier(playerData: PlayerData): number {
	const currentTime = os.time();
	let maxBoost = 1;
	
	// Clean expired boosts
	for (const [productId, expiration] of pairs(playerData.saveData.activeBoosts)) {
		if (typeIs(productId, "number") && typeIs(expiration, "number")) {
			if (expiration < currentTime) {
				// Boost expired, remove it
				delete playerData.saveData.activeBoosts[productId];
			} else {
				// Check which boost this is
				if (productId === PRODUCT_IDS.BOOST_2X_1HOUR) {
					maxBoost = math.max(maxBoost, BOOST_MULTIPLIER_2X);
				} else if (productId === PRODUCT_IDS.BOOST_5X_1HOUR) {
					maxBoost = math.max(maxBoost, BOOST_MULTIPLIER_5X);
				}
			}
		}
	}
	
	return maxBoost;
}

/**
 * Get current zone income multiplier
 */
function getCurrentZoneMultiplier(playerData: PlayerData): number {
	// Get the highest unlocked zone multiplier
	let maxMultiplier = 1.0;
	
	for (const zoneId of playerData.saveData.unlockedZones) {
		const zone = getZone(zoneId);
		if (zone) {
			// Check VIP requirement
			if (zone.isVIP && !playerData.saveData.hasVIP) {
				continue; // Skip VIP zones if player doesn't have VIP
			}
			maxMultiplier = math.max(maxMultiplier, zone.incomeMultiplier);
		}
	}
	
	return maxMultiplier;
}

/**
 * Send player data update to client
 */
function sendPlayerDataUpdate(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return;
	}
	
	PlayerDataUpdate.FireClient(player, {
		upgradeLevels: playerData.saveData.upgradeLevels,
		unlockedZones: playerData.saveData.unlockedZones,
		hasVIP: playerData.saveData.hasVIP,
		hasDoubleCash: playerData.saveData.hasDoubleCash,
		hasAutoCollect: playerData.saveData.hasAutoCollect,
		activeBoosts: playerData.saveData.activeBoosts,
		idleStreak: playerData.saveData.idleStreak,
		totalSessionTime: playerData.saveData.totalSessionTime,
		loginStreak: playerData.saveData.loginStreak,
		unlockedAchievements: playerData.saveData.unlockedAchievements,
	});
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
		
		// Process daily login reward
		const currentDate = getCurrentDateString();
		const hasClaimedToday = saveData.lastLoginDate === currentDate;
		const isStreakContinuing = isYesterday(saveData.lastLoginDate);
		
		if (!hasClaimedToday) {
			if (isStreakContinuing) {
				// Continue streak
				saveData.loginStreak += 1;
			} else if (saveData.lastLoginDate !== "") {
				// Streak broken, reset to 1
				saveData.loginStreak = 1;
			} else {
				// First login
				saveData.loginStreak = 1;
			}
			saveData.lastLoginDate = currentDate;
		}
		
		// Create in-memory player data
		const currentTime = os.time();
		const playerData: PlayerData = {
			saveData: saveData,
			sessionStartTime: currentTime,
			lastSaveTime: currentTime,
			idleStreakStartTime: currentTime,
			lastActivityTime: currentTime,
		};
		
		playerDataMap.set(player, playerData);
		
		// Check gamepass ownership
		checkGamepassOwnership(player);
		
		// Notify client about daily login reward availability
		if (!hasClaimedToday) {
			const dailyReward = getDailyLoginReward(saveData.loginStreak);
			DailyLoginClaimResponse.FireClient(player, true, `Daily Login Reward: $${dailyReward} (Day ${saveData.loginStreak})`);
		}
		
		// Send initial currency, rebirth count, and player data to client
		CurrencyUpdate.FireClient(player, saveData.currency);
		RebirthCountUpdate.FireClient(player, saveData.rebirthCount);
		sendPlayerDataUpdate(player);
		sendAchievementsUpdate(player);
		
		// Update leaderboard DataStore on join
		task.spawn(async () => {
			await updateLeaderboardDataStore(
				player.UserId,
				player.Name,
				saveData.currency,
				saveData.rebirthCount,
				saveData.totalSessionTime
			);
		});
		
		// Check achievements on join
		checkAchievements(player);
		
		if (offlineEarnings > 0) {
			print(`[CurrencyManager] Loaded player ${player.Name}: ${saveData.currency} currency (${offlineEarnings} from offline), ${saveData.rebirthCount} rebirths`);
		} else {
			print(`[CurrencyManager] Loaded player ${player.Name}: ${saveData.currency} currency, ${saveData.rebirthCount} rebirths`);
		}
	} catch (error) {
		warn(`[CurrencyManager] Failed to load data for ${player.Name}, using defaults: ${error}`);
		
		// Use default data on error
		const currentTime = os.time();
		const defaultData: PlayerData = {
			saveData: {
				version: DATA_VERSION,
				currency: 0,
				lastSaveTime: 0,
				rebirthCount: 0,
				upgradeLevels: {},
				unlockedZones: ["zone_1"],
				hasVIP: false,
				hasDoubleCash: false,
				hasAutoCollect: false,
				activeBoosts: {},
				lastLoginDate: "",
				loginStreak: 0,
				idleStreak: 0,
				totalSessionTime: 0,
				afkRewardCooldown: 0,
				unlockedAchievements: [],
				dailyRewardsClaimed: 0,
			},
			sessionStartTime: currentTime,
			lastSaveTime: currentTime,
			idleStreakStartTime: currentTime,
			lastActivityTime: currentTime,
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
		
		// Update leaderboard DataStore
		task.spawn(async () => {
			await updateLeaderboardDataStore(
				player.UserId,
				player.Name,
				playerData.saveData.currency,
				playerData.saveData.rebirthCount,
				playerData.saveData.totalSessionTime
			);
		});
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
	
	// Check achievements when currency changes significantly (every 100 currency)
	if (playerData.saveData.currency % 100 === 0) {
		checkAchievements(player);
	}

	print(`[CurrencyManager] Added ${amount} currency to ${player.Name}. New total: ${playerData.saveData.currency}`);
}

/**
 * AFK Income Loop - runs every second
 */
function processAFKIncome(): void {
	const currentTime = os.time();
	
	for (const [player, playerData] of playerDataMap) {
		// Only process if player is still in game
		if (!player.Parent) {
			continue;
		}

		// Update idle streak (in minutes)
		const idleStreakMinutes = math.floor((currentTime - playerData.idleStreakStartTime) / 60);
		playerData.saveData.idleStreak = idleStreakMinutes;
		
		// Update session time tracking (accumulate every minute)
		const sessionElapsed = currentTime - playerData.sessionStartTime;
		if (sessionElapsed >= 60) {
			const minutesToAdd = math.floor(sessionElapsed / 60);
			playerData.saveData.totalSessionTime += minutesToAdd;
			playerData.sessionStartTime += minutesToAdd * 60; // Add minutes, not reset
			// Send update to client every 5 minutes
			if (playerData.saveData.totalSessionTime % 5 === 0) {
				sendPlayerDataUpdate(player);
			}
		}

		// Calculate income with all multipliers
		const rebirthMultiplier = getRebirthIncomeMultiplier(playerData.saveData.rebirthCount);
		const upgradeMultiplier = getTotalUpgradeMultiplier(playerData);
		const zoneMultiplier = getCurrentZoneMultiplier(playerData);
		const boostMultiplier = getActiveBoostMultiplier(playerData);
		const idleStreakMultiplier = getIdleStreakMultiplier(idleStreakMinutes);
		
		// Gamepass multipliers
		let gamepassMultiplier = 1;
		if (playerData.saveData.hasDoubleCash) {
			gamepassMultiplier *= 2; // 2× Cash gamepass
		}
		
		// Premium player session multiplier
		let premiumMultiplier = 1;
		if (playerData.saveData.hasVIP || playerData.saveData.hasDoubleCash) {
			premiumMultiplier = PREMIUM_SESSION_MULTIPLIER;
		}
		
		const totalMultiplier = rebirthMultiplier * upgradeMultiplier * zoneMultiplier * boostMultiplier * gamepassMultiplier * idleStreakMultiplier * premiumMultiplier;
		const income = BASE_INCOME_PER_SECOND * totalMultiplier;

		// Add currency
		addCurrency(player, income);
		
		// Update achievement progress periodically (every 30 seconds)
		if (currentTime % 30 === 0) {
			sendAchievementsUpdate(player);
		}
	}
}

/**
 * Handle upgrade purchase request
 */
function handleUpgradePurchase(player: Player, upgradeId: string): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[Upgrade] Player ${player.Name} has no data`);
		UpgradePurchaseResponse.FireClient(player, false, "No player data found");
		return;
	}

	const upgrade = getUpgrade(upgradeId);
	if (!upgrade) {
		warn(`[Upgrade] Invalid upgrade ID: ${upgradeId}`);
		UpgradePurchaseResponse.FireClient(player, false, "Invalid upgrade");
		return;
	}

	// Check zone requirement
	if (upgrade.zoneRequired) {
		if (!playerData.saveData.unlockedZones.includes(upgrade.zoneRequired)) {
			UpgradePurchaseResponse.FireClient(player, false, `Requires ${getZone(upgrade.zoneRequired)?.name ?? upgrade.zoneRequired} zone`);
			return;
		}
	}

	// Get current level
	const currentLevel = playerData.saveData.upgradeLevels[upgradeId] ?? 0;

	// Check max level
	if (upgrade.maxLevel !== -1 && currentLevel >= upgrade.maxLevel) {
		UpgradePurchaseResponse.FireClient(player, false, "Upgrade is at max level");
		return;
	}

	// Calculate cost for next level
	const cost = getUpgradeCost(upgrade, currentLevel);

	// Check if player has enough currency
	if (playerData.saveData.currency < cost) {
		const shortfall = cost - playerData.saveData.currency;
		UpgradePurchaseResponse.FireClient(player, false, `Need ${shortfall} more currency`);
		return;
	}

	// Purchase upgrade
	playerData.saveData.currency -= cost;
	playerData.saveData.upgradeLevels[upgradeId] = currentLevel + 1;

	// Update client
	CurrencyUpdate.FireClient(player, playerData.saveData.currency);
	sendPlayerDataUpdate(player);

	UpgradePurchaseResponse.FireClient(player, true, `${upgrade.name} upgraded to level ${currentLevel + 1}`);
	
	// Check achievements
	checkAchievements(player);
	
	print(`[Upgrade] ${player.Name} purchased ${upgrade.name} level ${currentLevel + 1} for ${cost} currency`);
}

/**
 * Handle zone unlock request
 */
function handleZoneUnlock(player: Player, zoneId: string): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[Zone] Player ${player.Name} has no data`);
		ZoneUnlockResponse.FireClient(player, false, "No player data found");
		return;
	}

	const zone = getZone(zoneId);
	if (!zone) {
		warn(`[Zone] Invalid zone ID: ${zoneId}`);
		ZoneUnlockResponse.FireClient(player, false, "Invalid zone");
		return;
	}

	// Check if already unlocked
	if (playerData.saveData.unlockedZones.includes(zoneId)) {
		ZoneUnlockResponse.FireClient(player, false, "Zone already unlocked");
		return;
	}

	// Check VIP requirement
	if (zone.isVIP && !playerData.saveData.hasVIP) {
		ZoneUnlockResponse.FireClient(player, false, "VIP zone requires VIP gamepass");
		return;
	}

	// Check cost
	if (playerData.saveData.currency < zone.unlockCost) {
		const shortfall = zone.unlockCost - playerData.saveData.currency;
		ZoneUnlockResponse.FireClient(player, false, `Need ${shortfall} more currency`);
		return;
	}

	// Unlock zone
	playerData.saveData.currency -= zone.unlockCost;
	playerData.saveData.unlockedZones.push(zoneId);

	// Update client
	CurrencyUpdate.FireClient(player, playerData.saveData.currency);
	sendPlayerDataUpdate(player);

	ZoneUnlockResponse.FireClient(player, true, `${zone.name} unlocked!`);
	
	// Check achievements
	checkAchievements(player);
	
	print(`[Zone] ${player.Name} unlocked ${zone.name} for ${zone.unlockCost} currency`);
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

	// Check achievements
	checkAchievements(player);
	
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

// Handle upgrade purchase requests
UpgradePurchaseRequest.OnServerEvent.Connect((player, ...args) => {
	const upgradeId = args[0] as string;
	if (typeIs(upgradeId, "string")) {
		handleUpgradePurchase(player, upgradeId);
	}
});

// Handle zone unlock requests
ZoneUnlockRequest.OnServerEvent.Connect((player, ...args) => {
	const zoneId = args[0] as string;
	if (typeIs(zoneId, "string")) {
		handleZoneUnlock(player, zoneId);
	}
});

// Handle AFK reward claim requests
AFKRewardClaimRequest.OnServerEvent.Connect((player) => {
	handleAFKRewardClaim(player);
});

// Handle daily login reward claim requests
DailyLoginClaimRequest.OnServerEvent.Connect((player) => {
	handleDailyLoginClaim(player);
});

// Handle leaderboard requests
LeaderboardRequest.OnServerEvent.Connect((player, ...args) => {
	const leaderboardType = args[0] as "currency" | "rebirths" | "playtime";
	if (typeIs(leaderboardType, "string") && (leaderboardType === "currency" || leaderboardType === "rebirths" || leaderboardType === "playtime")) {
		task.spawn(async () => {
			await handleLeaderboardRequest(player, leaderboardType);
		});
	}
});

// Auto-refresh leaderboards periodically
task.spawn(() => {
	while (true) {
		task.wait(LEADERBOARD_UPDATE_INTERVAL);
		
		// Update leaderboard DataStore for all in-game players
		for (const [player, playerData] of playerDataMap) {
			if (player.Parent) {
				task.spawn(async () => {
					await updateLeaderboardDataStore(
						player.UserId,
						player.Name,
						playerData.saveData.currency,
						playerData.saveData.rebirthCount,
						playerData.saveData.totalSessionTime
					);
				});
			}
		}
	}
});

/**
 * Process gamepass purchase
 */
function processGamepassPurchase(player: Player, gamepassId: number): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[Monetization] Player ${player.Name} has no data for gamepass purchase`);
		return;
	}

	if (gamepassId === GAMEPASS_IDS.DOUBLE_CASH) {
		playerData.saveData.hasDoubleCash = true;
		print(`[Monetization] ${player.Name} purchased 2× Cash gamepass`);
		sendPlayerDataUpdate(player);
		savePlayer(player);
	} else if (gamepassId === GAMEPASS_IDS.AUTO_COLLECT) {
		playerData.saveData.hasAutoCollect = true;
		print(`[Monetization] ${player.Name} purchased Auto-Collect gamepass`);
		sendPlayerDataUpdate(player);
		savePlayer(player);
	} else if (gamepassId === GAMEPASS_IDS.VIP_ZONE) {
		playerData.saveData.hasVIP = true;
		// Auto-unlock VIP zone if not already unlocked
		if (!playerData.saveData.unlockedZones.includes("zone_vip")) {
			playerData.saveData.unlockedZones.push("zone_vip");
		}
		print(`[Monetization] ${player.Name} purchased VIP Zone gamepass`);
		sendPlayerDataUpdate(player);
		savePlayer(player);
	} else {
		warn(`[Monetization] Unknown gamepass ID: ${gamepassId}`);
	}
}

/**
 * Process developer product purchase
 */
function processProductPurchase(player: Player, productId: number): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		warn(`[Monetization] Player ${player.Name} has no data for product purchase`);
		return;
	}

	if (productId === PRODUCT_IDS.BOOST_2X_1HOUR) {
		const expiration = os.time() + BOOST_DURATION_1HOUR;
		playerData.saveData.activeBoosts[productId] = expiration;
		print(`[Monetization] ${player.Name} purchased 2× Boost (1 hour)`);
		sendPlayerDataUpdate(player);
		savePlayer(player);
	} else if (productId === PRODUCT_IDS.BOOST_5X_1HOUR) {
		const expiration = os.time() + BOOST_DURATION_1HOUR;
		playerData.saveData.activeBoosts[productId] = expiration;
		print(`[Monetization] ${player.Name} purchased 5× Boost (1 hour)`);
		sendPlayerDataUpdate(player);
		savePlayer(player);
	} else if (productId === PRODUCT_IDS.REBIRTH_SKIP) {
		// Skip current rebirth cost - give player enough currency for next rebirth
		const currentRebirthCount = playerData.saveData.rebirthCount;
		const nextRebirthCost = getRebirthCost(currentRebirthCount);
		playerData.saveData.currency += nextRebirthCost;
		CurrencyUpdate.FireClient(player, playerData.saveData.currency);
		print(`[Monetization] ${player.Name} purchased Rebirth Skip, granted ${nextRebirthCost} currency`);
		savePlayer(player);
	} else {
		warn(`[Monetization] Unknown product ID: ${productId}`);
	}
}

/**
 * Handle MarketplaceService purchase
 */
function handlePurchase(player: Player, receiptInfo: ReceiptInfo): Enum.ProductPurchaseDecision {
	try {
		// Process the purchase
		if (receiptInfo.ProductId > 0) {
			// Developer product
			processProductPurchase(player, receiptInfo.ProductId);
		} else {
			// Gamepass (negative ID)
			processGamepassPurchase(player, receiptInfo.ProductId);
		}
		
		return Enum.ProductPurchaseDecision.PurchaseGranted;
	} catch (error) {
		warn(`[Monetization] Failed to process purchase for ${player.Name}: ${error}`);
		return Enum.ProductPurchaseDecision.NotProcessedYet;
	}
}

// Set up MarketplaceService purchase handler
MarketplaceService.PromptGamePassPurchaseFinished.Connect((player: Player, gamePassId: number, wasPurchased: boolean) => {
	// Gamepass purchases are handled automatically, but we need to check ownership
	if (wasPurchased) {
		checkGamepassOwnership(player);
	}
});

MarketplaceService.PromptProductPurchaseFinished.Connect((userId: number, productId: number, isPurchased: boolean) => {
	if (isPurchased) {
		// Product was purchased, but we need to wait for ProcessReceipt callback
		// The actual processing happens in handlePurchase
		const player = Players.GetPlayerByUserId(userId);
		if (player) {
			print(`[Monetization] ${player.Name} purchased product ${productId}`);
		}
	}
});

// Process receipts (this is called by Roblox when a purchase is made)
MarketplaceService.ProcessReceipt = (receiptInfo: ReceiptInfo): Enum.ProductPurchaseDecision => {
	const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);
	if (!player) {
		// Player not in game, grant purchase when they join
		warn(`[Monetization] Player ${receiptInfo.PlayerId} not in game, purchase will be granted on join`);
		return Enum.ProductPurchaseDecision.NotProcessedYet;
	}
	
	return handlePurchase(player, receiptInfo);
};

// Check gamepass ownership on player join
async function checkGamepassOwnership(player: Player): Promise<void> {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return;
	}

	// Check each gamepass
	const [hasDoubleCash] = pcall(() => MarketplaceService.UserOwnsGamePassAsync(player.UserId, GAMEPASS_IDS.DOUBLE_CASH));
	const [hasAutoCollect] = pcall(() => MarketplaceService.UserOwnsGamePassAsync(player.UserId, GAMEPASS_IDS.AUTO_COLLECT));
	const [hasVIP] = pcall(() => MarketplaceService.UserOwnsGamePassAsync(player.UserId, GAMEPASS_IDS.VIP_ZONE));

	if (hasDoubleCash && !playerData.saveData.hasDoubleCash) {
		playerData.saveData.hasDoubleCash = true;
		print(`[Monetization] ${player.Name} owns 2× Cash gamepass`);
	}
	
	if (hasAutoCollect && !playerData.saveData.hasAutoCollect) {
		playerData.saveData.hasAutoCollect = true;
		print(`[Monetization] ${player.Name} owns Auto-Collect gamepass`);
	}
	
	if (hasVIP && !playerData.saveData.hasVIP) {
		playerData.saveData.hasVIP = true;
		if (!playerData.saveData.unlockedZones.includes("zone_vip")) {
			playerData.saveData.unlockedZones.push("zone_vip");
		}
		print(`[Monetization] ${player.Name} owns VIP Zone gamepass`);
	}
	
	sendPlayerDataUpdate(player);
}

/**
 * Handle AFK reward claim request
 */
function handleAFKRewardClaim(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		AFKRewardClaimResponse.FireClient(player, false, "No player data found");
		return;
	}
	
	const currentTime = os.time();
	const idleStreakMinutes = math.floor((currentTime - playerData.idleStreakStartTime) / 60);
	
	// Check if reward is available
	if (currentTime < playerData.saveData.afkRewardCooldown) {
		const timeRemaining = playerData.saveData.afkRewardCooldown - currentTime;
		AFKRewardClaimResponse.FireClient(player, false, `Reward available in ${math.ceil(timeRemaining / 60)} minutes`);
		return;
	}
	
	// Calculate reward
	const reward = getAFKReward(idleStreakMinutes);
	
	// Apply premium multiplier if applicable
	let finalReward = reward;
	if (playerData.saveData.hasVIP || playerData.saveData.hasDoubleCash) {
		finalReward = math.floor(reward * PREMIUM_REWARD_MULTIPLIER);
	}
	
	// Grant reward
	addCurrency(player, finalReward);
	
	// Set cooldown
	playerData.saveData.afkRewardCooldown = currentTime + AFK_REWARD_INTERVAL;
	
	AFKRewardClaimResponse.FireClient(player, true, `Claimed $${finalReward} AFK Reward!`);
	print(`[Retention] ${player.Name} claimed AFK reward: $${finalReward} (${idleStreakMinutes} min streak)`);
}

/**
 * Handle daily login reward claim request
 */
function handleDailyLoginClaim(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		DailyLoginClaimResponse.FireClient(player, false, "No player data found");
		return;
	}
	
	const currentDate = getCurrentDateString();
	
	// Check if already claimed today
	if (playerData.saveData.lastLoginDate === currentDate) {
		DailyLoginClaimResponse.FireClient(player, false, "Daily reward already claimed today");
		return;
	}
	
	// Calculate reward
	const reward = getDailyLoginReward(playerData.saveData.loginStreak);
	
	// Apply premium multiplier if applicable
	let finalReward = reward;
	if (playerData.saveData.hasVIP || playerData.saveData.hasDoubleCash) {
		finalReward = math.floor(reward * PREMIUM_REWARD_MULTIPLIER);
	}
	
	// Grant reward
	addCurrency(player, finalReward);
	
	// Update login date (already updated in initializePlayer, but ensure it's set)
	playerData.saveData.lastLoginDate = currentDate;
	
	// Update daily rewards claimed count
	playerData.saveData.dailyRewardsClaimed += 1;
	
	DailyLoginClaimResponse.FireClient(player, true, `Daily Login Reward: $${finalReward} (Day ${playerData.saveData.loginStreak})`);
	print(`[Retention] ${player.Name} claimed daily login reward: $${finalReward} (Day ${playerData.saveData.loginStreak})`);
	
	// Check achievements
	checkAchievements(player);
	
	// Update daily rewards claimed count
	playerData.saveData.dailyRewardsClaimed += 1;
	
	// Check achievements
	checkAchievements(player);
}

/**
 * Check and unlock achievements for a player
 */
function checkAchievements(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return;
	}
	
	const saveData = playerData.saveData;
	
	// Check each achievement
	for (const achievement of ACHIEVEMENTS) {
		// Skip if already unlocked
		if (saveData.unlockedAchievements.includes(achievement.id)) {
			continue;
		}
		
		let shouldUnlock = false;
		
		// Check achievement based on category
		switch (achievement.category) {
			case "currency":
				shouldUnlock = saveData.currency >= achievement.requirement;
				break;
				
			case "rebirth":
				shouldUnlock = saveData.rebirthCount >= achievement.requirement;
				break;
				
			case "upgrade":
				if (achievement.id === "max_upgrade") {
					// Check if any upgrade is maxed
					for (const upgrade of UPGRADES) {
						const level = saveData.upgradeLevels[upgrade.id] ?? 0;
						if (upgrade.maxLevel !== -1 && level >= upgrade.maxLevel) {
							shouldUnlock = true;
							break;
						}
					}
				} else {
					// Count total upgrades purchased
					let totalUpgrades = 0;
					for (const [_, level] of pairs(saveData.upgradeLevels)) {
						totalUpgrades += level;
					}
					shouldUnlock = totalUpgrades >= achievement.requirement;
				}
				break;
				
			case "zone":
				shouldUnlock = saveData.unlockedZones.size() >= achievement.requirement;
				break;
				
			case "time":
				shouldUnlock = saveData.totalSessionTime >= achievement.requirement;
				break;
				
			case "streak":
				if (string.find(achievement.id, "idle")[0] !== undefined) {
					shouldUnlock = saveData.idleStreak >= achievement.requirement;
				} else if (string.find(achievement.id, "login")[0] !== undefined) {
					shouldUnlock = saveData.loginStreak >= achievement.requirement;
				}
				break;
				
			case "milestone":
				if (achievement.id === "first_vip") {
					shouldUnlock = saveData.hasVIP;
				} else if (achievement.id === "claim_daily") {
					shouldUnlock = saveData.dailyRewardsClaimed >= achievement.requirement;
				}
				break;
		}
		
		// Unlock achievement if requirement met
		if (shouldUnlock) {
			unlockAchievement(player, achievement.id);
		}
	}
}

/**
 * Unlock an achievement for a player
 */
function unlockAchievement(player: Player, achievementId: string): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return;
	}
	
	const achievement = getAchievement(achievementId);
	if (!achievement) {
		return;
	}
	
	// Add to unlocked list
	if (!playerData.saveData.unlockedAchievements.includes(achievementId)) {
		playerData.saveData.unlockedAchievements.push(achievementId);
		
		// Grant reward if applicable
		if (achievement.reward) {
			addCurrency(player, achievement.reward);
		}
		
		// Notify client
		AchievementUnlocked.FireClient(player, achievementId, achievement.name, achievement.description, achievement.icon, achievement.reward ?? 0);
		
		// Send updated achievements list
		sendAchievementsUpdate(player);
		
		print(`[Achievements] ${player.Name} unlocked: ${achievement.name}`);
	}
}

/**
 * Calculate achievement progress
 */
function calculateAchievementProgress(player: Player, achievementId: string): number {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return 0;
	}
	
	const achievement = getAchievement(achievementId);
	if (!achievement) {
		return 0;
	}
	
	const saveData = playerData.saveData;
	
	// If already unlocked, return 100%
	if (saveData.unlockedAchievements.includes(achievementId)) {
		return 100;
	}
	
	let currentValue = 0;
	
	switch (achievement.category) {
		case "currency":
			currentValue = saveData.currency;
			break;
		case "rebirth":
			currentValue = saveData.rebirthCount;
			break;
		case "upgrade":
			if (achievement.id === "max_upgrade") {
				// Check if any upgrade is maxed
				for (const upgrade of UPGRADES) {
					const level = saveData.upgradeLevels[upgrade.id] ?? 0;
					if (upgrade.maxLevel !== -1 && level >= upgrade.maxLevel) {
						currentValue = 1;
						break;
					}
				}
			} else {
				// Count total upgrades purchased
				for (const [_, level] of pairs(saveData.upgradeLevels)) {
					currentValue += level;
				}
			}
			break;
		case "zone":
			currentValue = saveData.unlockedZones.size();
			break;
		case "time":
			currentValue = saveData.totalSessionTime;
			break;
		case "streak":
			if (string.find(achievement.id, "idle")[0] !== undefined) {
				currentValue = saveData.idleStreak;
			} else if (string.find(achievement.id, "login")[0] !== undefined) {
				currentValue = saveData.loginStreak;
			}
			break;
		case "milestone":
			if (achievement.id === "first_vip") {
				currentValue = saveData.hasVIP ? 1 : 0;
			} else if (achievement.id === "claim_daily") {
				currentValue = saveData.dailyRewardsClaimed;
			}
			break;
	}
	
	// Calculate percentage (cap at 100%)
	const progress = math.min(100, math.floor((currentValue / achievement.requirement) * 100));
	return progress;
}

/**
 * Send achievements update to client
 */
function sendAchievementsUpdate(player: Player): void {
	const playerData = playerDataMap.get(player);
	if (!playerData) {
		return;
	}
	
	AchievementsUpdate.FireClient(player, playerData.saveData.unlockedAchievements);
	
	// Send progress data for all achievements
	const progressData: { [achievementId: string]: number } = {};
	for (const achievement of ACHIEVEMENTS) {
		progressData[achievement.id] = calculateAchievementProgress(player, achievement.id);
	}
	AchievementProgressUpdate.FireClient(player, progressData);
}

/**
 * Update leaderboard DataStore with player's current stats
 */
async function updateLeaderboardDataStore(userId: number, username: string, currency: number, rebirths: number, playtime: number): Promise<void> {
	const key = `player_${userId}`;
	const data = {
		userId: userId,
		username: username,
		currency: currency,
		rebirths: rebirths,
		playtime: playtime,
		lastUpdate: os.time(),
	};
	
	await retryDataStoreOperation(
		() => {
			leaderboardDataStore.SetAsync(key, data);
			return undefined;
		},
		`UpdateLeaderboard_${userId}`,
		userId
	);
}

/**
 * Get leaderboard from DataStore
 * Note: DataStore doesn't support listing all keys efficiently, so this shows in-game players
 * For a full persistent leaderboard, consider using OrderedDataStore or maintaining a separate leaderboard cache
 */
async function getLeaderboardFromDataStore(leaderboardType: "currency" | "rebirths" | "playtime"): Promise<Array<{ userId: number; username: string; value: number }>> {
	const leaderboardData: Array<{ userId: number; username: string; value: number }> = [];
	
	// Add current in-game players (their data is always up-to-date)
	for (const [p, playerData] of playerDataMap) {
		if (!p.Parent) {
			continue;
		}
		
		let value = 0;
		switch (leaderboardType) {
			case "currency":
				value = playerData.saveData.currency;
				break;
			case "rebirths":
				value = playerData.saveData.rebirthCount;
				break;
			case "playtime":
				value = playerData.saveData.totalSessionTime;
				break;
		}
		
		leaderboardData.push({
			userId: p.UserId,
			username: p.Name,
			value: value,
		});
	}
	
	// Sort by value (descending)
	table.sort(leaderboardData, (a, b) => a.value < b.value);
	
	// Take top 10
	const top10: Array<{ userId: number; username: string; value: number }> = [];
	for (let i = 0; i < math.min(10, leaderboardData.size()); i++) {
		top10.push(leaderboardData[i]);
	}
	
	return top10;
}

/**
 * Handle leaderboard request
 */
async function handleLeaderboardRequest(player: Player, leaderboardType: "currency" | "rebirths" | "playtime"): Promise<void> {
	// Get leaderboard from DataStore (includes in-game players)
	const leaderboardData = await getLeaderboardFromDataStore(leaderboardType);
	
	// Send to client
	LeaderboardResponse.FireClient(player, leaderboardType, leaderboardData);
}

print("[CurrencyManager] Service initialized");
