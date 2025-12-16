import { Players } from "@rbxts/services";
import { CurrencyUpdate } from "../shared/RemoteEvents";

// Configuration
const BASE_INCOME_PER_SECOND = 1;
const INCOME_TICK_INTERVAL = 1; // seconds

// Player data interface
interface PlayerData {
  currency: number;
  sessionStartTime: number;
}

// Store player data in memory (Phase 2 will move to DataStore)
const playerDataMap = new Map<Player, PlayerData>();

/**
 * Initialize player data when they join
 */
function initializePlayer(player: Player): void {
  const playerData: PlayerData = {
    currency: 0,
    sessionStartTime: os.time(),
  };

  playerDataMap.set(player, playerData);

  // Send initial currency to client
  CurrencyUpdate.FireClient(player, playerData.currency);

  print(
    `[CurrencyManager] Initialized player ${player.Name} with ${playerData.currency} currency`
  );
}

/**
 * Remove player data when they leave
 */
function removePlayer(player: Player): void {
  playerDataMap.delete(player);
  print(`[CurrencyManager] Removed player ${player.Name} from currency system`);
}

/**
 * Add currency to a player (server-authoritative)
 */
export function addCurrency(player: Player, amount: number): void {
  const playerData = playerDataMap.get(player);
  if (!playerData) {
    warn(
      `[CurrencyManager] Attempted to add currency to player ${player.Name} but they have no data`
    );
    return;
  }

  // Server-authoritative: only server can modify currency
  playerData.currency += amount;

  // Update client
  CurrencyUpdate.FireClient(player, playerData.currency);

  print(
    `[CurrencyManager] Added ${amount} currency to ${player.Name}. New total: ${playerData.currency}`
  );
}

/**
 * Get player currency (server-only)
 */
export function getCurrency(player: Player): number {
  const playerData = playerDataMap.get(player);
  return playerData?.currency ?? 0;
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

    // Calculate income (base income per second)
    const income = BASE_INCOME_PER_SECOND;

    // Add currency
    addCurrency(player, income);
  }
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

/**
 * Initialize the CurrencyManager service
 */
export function init(): void {
  // Initialize existing players
  for (const player of Players.GetPlayers()) {
    initializePlayer(player);
  }

  // Handle new players
  Players.PlayerAdded.Connect(initializePlayer);

  // Handle leaving players
  Players.PlayerRemoving.Connect(removePlayer);

  // Start AFK income loop
  startIncomeLoop();

  print("[CurrencyManager] Service initialized");
}
