/**
 * Events & Limited-Time Content Configuration
 */

export interface GameEvent {
	id: string;
	name: string;
	description: string;
	icon: string; // Emoji or icon identifier
	startTime: number; // Unix timestamp
	endTime: number; // Unix timestamp
	incomeMultiplier: number; // Income multiplier during event (e.g., 2.0 for 2x income)
	currencyBonus: number; // Bonus currency per tick (added on top of income)
	rewardMultiplier: number; // Multiplier for all rewards (achievements, daily login, etc.)
	isActive: boolean; // Whether event is currently active
}

/**
 * All game events
 */
export const GAME_EVENTS: GameEvent[] = [
	// Example: Double Income Weekend
	{
		id: "double_income_weekend",
		name: "Double Income Weekend",
		description: "2× income for all players!",
		icon: "🎉",
		startTime: 0, // Set dynamically
		endTime: 0, // Set dynamically
		incomeMultiplier: 2.0,
		currencyBonus: 0,
		rewardMultiplier: 1.0,
		isActive: false,
	},
	
	// Example: Lucky Hour
	{
		id: "lucky_hour",
		name: "Lucky Hour",
		description: "3× income + bonus currency!",
		icon: "🍀",
		startTime: 0,
		endTime: 0,
		incomeMultiplier: 3.0,
		currencyBonus: 10, // Extra 10 currency per second
		rewardMultiplier: 1.5,
		isActive: false,
	},
	
	// Example: Rebirth Festival
	{
		id: "rebirth_festival",
		name: "Rebirth Festival",
		description: "50% off rebirth costs!",
		icon: "🔄",
		startTime: 0,
		endTime: 0,
		incomeMultiplier: 1.0,
		currencyBonus: 0,
		rewardMultiplier: 1.0,
		isActive: false,
	},
];

/**
 * Get active events
 */
export function getActiveEvents(): GameEvent[] {
	const currentTime = os.time();
	return GAME_EVENTS.filter((event) => {
		return event.isActive && currentTime >= event.startTime && currentTime <= event.endTime;
	});
}

/**
 * Get event by ID
 */
export function getEvent(id: string): GameEvent | undefined {
	return GAME_EVENTS.find((e) => e.id === id);
}

/**
 * Calculate total income multiplier from all active events
 */
export function getEventIncomeMultiplier(): number {
	const activeEvents = getActiveEvents();
	let multiplier = 1.0;
	for (const event of activeEvents) {
		multiplier *= event.incomeMultiplier;
	}
	return multiplier;
}

/**
 * Calculate total currency bonus from all active events
 */
export function getEventCurrencyBonus(): number {
	const activeEvents = getActiveEvents();
	let bonus = 0;
	for (const event of activeEvents) {
		bonus += event.currencyBonus;
	}
	return bonus;
}

/**
 * Calculate total reward multiplier from all active events
 */
export function getEventRewardMultiplier(): number {
	const activeEvents = getActiveEvents();
	let multiplier = 1.0;
	for (const event of activeEvents) {
		multiplier *= event.rewardMultiplier;
	}
	return multiplier;
}

/**
 * Check if rebirth discount event is active
 */
export function isRebirthDiscountActive(): boolean {
	const event = getEvent("rebirth_festival");
	if (!event) return false;
	return event.isActive && os.time() >= event.startTime && os.time() <= event.endTime;
}

/**
 * Get rebirth cost discount (0.5 = 50% off)
 */
export function getRebirthDiscount(): number {
	if (isRebirthDiscountActive()) {
		return 0.5; // 50% off
	}
	return 1.0; // No discount
}

