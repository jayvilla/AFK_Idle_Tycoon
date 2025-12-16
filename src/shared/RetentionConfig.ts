/**
 * Retention & AFK Optimization Configuration
 */

// AFK Reward Chest
export const AFK_REWARD_INTERVAL = 300; // 5 minutes in seconds
export const AFK_REWARD_BASE = 50; // Base currency reward
export const AFK_REWARD_MULTIPLIER = 1.1; // Multiplier per streak level

// Idle Streak Bonuses
export const IDLE_STREAK_INTERVALS = [5, 15, 30, 60, 120]; // Minutes for streak bonuses
export const IDLE_STREAK_MULTIPLIERS = [1.1, 1.2, 1.3, 1.5, 2.0]; // Income multipliers per streak

// Daily Login Rewards
export const DAILY_REWARD_BASE = 100; // Base daily reward
export const DAILY_REWARD_STREAK_MULTIPLIER = 1.2; // Multiplier per day of streak
export const MAX_LOGIN_STREAK_BONUS = 7; // Max streak bonus (caps at 7 days)

// Premium Player Multipliers (for VIP/hasDoubleCash)
export const PREMIUM_SESSION_MULTIPLIER = 1.25; // 25% bonus session time tracking
export const PREMIUM_REWARD_MULTIPLIER = 1.5; // 50% bonus on all rewards

// AFK-Safe Zones (players won't be kicked for inactivity)
export const AFK_SAFE_ZONES = ["zone_1", "zone_2", "zone_3", "zone_vip"];

/**
 * Get current date string (YYYY-MM-DD)
 */
export function getCurrentDateString(): string {
	const date = os.date("*t");
	return `${date.year}-${string.format("%02d", date.month)}-${string.format("%02d", date.day)}`;
}

/**
 * Check if date is yesterday (for streak continuation)
 */
export function isYesterday(dateString: string): boolean {
	const today = getCurrentDateString();
	// Simple check - in production, use proper date parsing
	const todayParts = today.split("-");
	const dateParts = dateString.split("-");
	
	if (todayParts[0] === dateParts[0] && todayParts[1] === dateParts[1]) {
		return tonumber(todayParts[2]) === (tonumber(dateParts[2]) ?? 0) + 1;
	}
	return false;
}

/**
 * Calculate idle streak income multiplier
 */
export function getIdleStreakMultiplier(idleStreakMinutes: number): number {
	for (let i = IDLE_STREAK_INTERVALS.size() - 1; i >= 0; i--) {
		if (idleStreakMinutes >= IDLE_STREAK_INTERVALS[i]) {
			return IDLE_STREAK_MULTIPLIERS[i];
		}
	}
	return 1.0;
}

/**
 * Calculate daily login reward
 */
export function getDailyLoginReward(loginStreak: number): number {
	const streakBonus = math.min(loginStreak, MAX_LOGIN_STREAK_BONUS);
	return math.floor(DAILY_REWARD_BASE * math.pow(DAILY_REWARD_STREAK_MULTIPLIER, streakBonus - 1));
}

/**
 * Calculate AFK reward amount
 */
export function getAFKReward(idleStreakMinutes: number): number {
	const streakLevel = math.floor(idleStreakMinutes / 5); // Every 5 minutes = 1 level
	return math.floor(AFK_REWARD_BASE * math.pow(AFK_REWARD_MULTIPLIER, streakLevel));
}

