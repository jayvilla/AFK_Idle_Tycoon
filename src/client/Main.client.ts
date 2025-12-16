import {
  Players,
  ReplicatedStorage,
  MarketplaceService,
} from "@rbxts/services";
import { GAMEPASS_IDS, PRODUCT_IDS } from "../shared/MonetizationConfig";
import { ACHIEVEMENTS, getAchievement } from "../shared/AchievementsConfig";

// Get the local player
const player = Players.LocalPlayer;
print("[Client] Script starting...");
print(`[Client] Player: ${player.Name}`);

const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
print(`[Client] PlayerGui found: ${playerGui.Name}`);

// Create ScreenGui for UI FIRST (before waiting for RemoteEvents)
print("[Client] Creating ScreenGui...");
const screenGui = new Instance("ScreenGui");
screenGui.Name = "CurrencyUI";
screenGui.ResetOnSpawn = false;
screenGui.Enabled = true;
screenGui.Parent = playerGui;
print(
  `[Client] ScreenGui created and parented. Enabled: ${screenGui.Enabled}, Parent: ${screenGui.Parent?.Name}`
);

// Wait for RemoteEvents to be created by server
print("[Client] Waiting for RemoteEvents...");
const remoteEventsFolder = ReplicatedStorage.WaitForChild(
  "RemoteEvents"
) as Folder;
print("[Client] RemoteEvents folder found");

const CurrencyUpdate = remoteEventsFolder.WaitForChild(
  "CurrencyUpdate"
) as RemoteEvent;
const RebirthRequest = remoteEventsFolder.WaitForChild(
  "RebirthRequest"
) as RemoteEvent;
const RebirthResponse = remoteEventsFolder.WaitForChild(
  "RebirthResponse"
) as RemoteEvent;
const RebirthCountUpdate = remoteEventsFolder.WaitForChild(
  "RebirthCountUpdate"
) as RemoteEvent;
const UpgradePurchaseRequest = remoteEventsFolder.WaitForChild(
  "UpgradePurchaseRequest"
) as RemoteEvent;
const UpgradePurchaseResponse = remoteEventsFolder.WaitForChild(
  "UpgradePurchaseResponse"
) as RemoteEvent;
const ZoneUnlockRequest = remoteEventsFolder.WaitForChild(
  "ZoneUnlockRequest"
) as RemoteEvent;
const ZoneUnlockResponse = remoteEventsFolder.WaitForChild(
  "ZoneUnlockResponse"
) as RemoteEvent;
const PlayerDataUpdate = remoteEventsFolder.WaitForChild(
  "PlayerDataUpdate"
) as RemoteEvent;
const AFKRewardClaimRequest = remoteEventsFolder.WaitForChild(
  "AFKRewardClaimRequest"
) as RemoteEvent;
const AFKRewardClaimResponse = remoteEventsFolder.WaitForChild(
  "AFKRewardClaimResponse"
) as RemoteEvent;
const DailyLoginClaimRequest = remoteEventsFolder.WaitForChild(
  "DailyLoginClaimRequest"
) as RemoteEvent;
const DailyLoginClaimResponse = remoteEventsFolder.WaitForChild(
  "DailyLoginClaimResponse"
) as RemoteEvent;
const LeaderboardRequest = remoteEventsFolder.WaitForChild(
  "LeaderboardRequest"
) as RemoteEvent;
const LeaderboardResponse = remoteEventsFolder.WaitForChild(
  "LeaderboardResponse"
) as RemoteEvent;
const AchievementUnlocked = remoteEventsFolder.WaitForChild(
  "AchievementUnlocked"
) as RemoteEvent;
const AchievementsUpdate = remoteEventsFolder.WaitForChild(
  "AchievementsUpdate"
) as RemoteEvent;
const AchievementProgressUpdate = remoteEventsFolder.WaitForChild(
  "AchievementProgressUpdate"
) as RemoteEvent;
const EventUpdate = remoteEventsFolder.WaitForChild(
  "EventUpdate"
) as RemoteEvent;
// Settings and Friends removed - buttons don't work

print("[Client] All RemoteEvents loaded");

// Menu toggle button (always visible)
print("[Client] Creating menu toggle button...");
const menuToggleButton = new Instance("TextButton");
menuToggleButton.Name = "MenuToggle";
menuToggleButton.Size = new UDim2(0, 50, 0, 50);
menuToggleButton.Position = new UDim2(0, 20, 0, 20);
menuToggleButton.BackgroundColor3 = new Color3(0.2, 0.2, 0.2);
menuToggleButton.Text = "☰";
menuToggleButton.TextColor3 = new Color3(1, 1, 1);
menuToggleButton.TextSize = 24;
menuToggleButton.Font = Enum.Font.GothamBold;
menuToggleButton.Visible = true;
menuToggleButton.Parent = screenGui;
print(
  `[Client] Menu toggle button created. Visible: ${menuToggleButton.Visible}`
);

const menuToggleCorner = new Instance("UICorner");
menuToggleCorner.CornerRadius = new UDim(0, 8);
menuToggleCorner.Parent = menuToggleButton;

// Track menu state
let menusVisible = true;

// Create currency display frame (always visible)
print("[Client] Creating currency frame...");
const currencyFrame = new Instance("Frame");
currencyFrame.Name = "CurrencyFrame";
currencyFrame.Size = new UDim2(0, 300, 0, 60);
currencyFrame.Position = new UDim2(0, 80, 0, 20); // Moved right to make room for toggle button
currencyFrame.BackgroundColor3 = new Color3(0.1, 0.1, 0.1);
currencyFrame.BorderSizePixel = 0;
currencyFrame.Visible = true;
currencyFrame.Parent = screenGui;
print(
  `[Client] Currency frame created. Visible: ${currencyFrame.Visible}, Parent: ${currencyFrame.Parent?.Name}`
);

// Add corner radius
const corner = new Instance("UICorner");
corner.CornerRadius = new UDim(0, 8);
corner.Parent = currencyFrame;

// Currency label
const currencyLabel = new Instance("TextLabel");
currencyLabel.Name = "CurrencyLabel";
currencyLabel.Size = new UDim2(1, 0, 1, 0);
currencyLabel.BackgroundTransparency = 1;
currencyLabel.Text = "💰 $0";
currencyLabel.TextColor3 = new Color3(1, 1, 1);
currencyLabel.TextSize = 24;
currencyLabel.Font = Enum.Font.GothamBold;
currencyLabel.TextXAlignment = Enum.TextXAlignment.Left;
currencyLabel.Parent = currencyFrame;

// Add padding
const padding = new Instance("UIPadding");
padding.PaddingLeft = new UDim(0, 15);
padding.Parent = currencyLabel;

// Track current currency and rebirth count
let currentCurrency = 0;
let rebirthCount = 0;

// Listen for currency updates from server
CurrencyUpdate.OnClientEvent.Connect((newCurrency: number) => {
  currentCurrency = newCurrency;
  currencyLabel.Text = `💰 $${formatNumber(newCurrency)}`;
  updateRebirthButton();
});

// Create rebirth button
const rebirthButton = new Instance("TextButton");
rebirthButton.Name = "RebirthButton";
rebirthButton.Size = new UDim2(0, 200, 0, 50);
rebirthButton.Position = new UDim2(0, 20, 0, 90);
rebirthButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
rebirthButton.BorderSizePixel = 0;
rebirthButton.Text = "Rebirth";
rebirthButton.TextColor3 = new Color3(1, 1, 1);
rebirthButton.TextSize = 18;
rebirthButton.Font = Enum.Font.GothamBold;
rebirthButton.Parent = screenGui;

// Add corner radius to button
const buttonCorner = new Instance("UICorner");
buttonCorner.CornerRadius = new UDim(0, 8);
buttonCorner.Parent = rebirthButton;

// Rebirth cost label
const rebirthCostLabel = new Instance("TextLabel");
rebirthCostLabel.Name = "RebirthCostLabel";
rebirthCostLabel.Size = new UDim2(1, 0, 0, 20);
rebirthCostLabel.Position = new UDim2(0, 0, 1, 5);
rebirthCostLabel.BackgroundTransparency = 1;
rebirthCostLabel.Text = "Cost: $0";
rebirthCostLabel.TextColor3 = new Color3(1, 1, 0.5);
rebirthCostLabel.TextSize = 14;
rebirthCostLabel.Font = Enum.Font.Gotham;
rebirthCostLabel.Parent = rebirthButton;

// Rebirth count label
const rebirthCountLabel = new Instance("TextLabel");
rebirthCountLabel.Name = "RebirthCountLabel";
rebirthCountLabel.Size = new UDim2(0, 200, 0, 30);
rebirthCountLabel.Position = new UDim2(0, 20, 0, 150); // Below rebirth button
rebirthCountLabel.BackgroundTransparency = 1;
rebirthCountLabel.Text = "Rebirths: 0";
rebirthCountLabel.TextColor3 = new Color3(0.8, 0.8, 0.8);
rebirthCountLabel.TextSize = 16;
rebirthCountLabel.Font = Enum.Font.Gotham;
rebirthCountLabel.TextXAlignment = Enum.TextXAlignment.Left;
rebirthCountLabel.Parent = screenGui;

// Update rebirth button state
function updateRebirthButton(): void {
  const cost = getRebirthCost(rebirthCount);
  rebirthCostLabel.Text = `Cost: $${formatNumber(cost)}`;

  if (currentCurrency >= cost) {
    rebirthButton.BackgroundColor3 = new Color3(0.2, 0.8, 0.2);
    rebirthButton.Text = "REBIRTH";
  } else {
    rebirthButton.BackgroundColor3 = new Color3(0.4, 0.4, 0.4);
    rebirthButton.Text = "Rebirth";
  }
}

// Handle rebirth button click
rebirthButton.MouseButton1Click.Connect(() => {
  RebirthRequest.FireServer();
});

// Listen for rebirth count updates
RebirthCountUpdate.OnClientEvent.Connect((count: number) => {
  rebirthCount = count;
  rebirthCountLabel.Text = `Rebirths: ${rebirthCount}`;
  updateRebirthButton();
});

// Handle rebirth response
RebirthResponse.OnClientEvent.Connect((success: boolean, message: string) => {
  if (success) {
    // Success feedback - rebirth count will be updated via RebirthCountUpdate
    // Simple animation feedback
    task.spawn(() => {
      rebirthButton.BackgroundColor3 = new Color3(0, 1, 0);
      task.wait(0.3);
      updateRebirthButton();
    });

    print(`[Client] ${message}`);
  } else {
    // Error feedback
    task.spawn(() => {
      rebirthButton.BackgroundColor3 = new Color3(1, 0.2, 0.2);
      task.wait(0.3);
      updateRebirthButton();
    });

    warn(`[Client] Rebirth failed: ${message}`);
  }
});

// Import rebirth cost function
function getRebirthCost(count: number): number {
  const BASE_COST = 1000;
  const MULTIPLIER = 2.5;
  return math.floor(BASE_COST * math.pow(MULTIPLIER, count));
}

// Phase 6 - Retention/Rewards UI - On screen, smaller
const retentionFrame = new Instance("Frame");
retentionFrame.Name = "RetentionFrame";
retentionFrame.Size = new UDim2(0, 180, 0, 200); // Smaller
retentionFrame.Position = new UDim2(0, 20, 0, 300); // Left side, below gamepass
retentionFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
retentionFrame.BorderSizePixel = 0;
retentionFrame.Visible = menusVisible; // Controlled by toggle
retentionFrame.Parent = screenGui;

const retentionCorner = new Instance("UICorner");
retentionCorner.CornerRadius = new UDim(0, 8);
retentionCorner.Parent = retentionFrame;

const retentionTitle = new Instance("TextLabel");
retentionTitle.Name = "Title";
retentionTitle.Size = new UDim2(1, 0, 0, 25);
retentionTitle.Position = new UDim2(0, 0, 0, 0);
retentionTitle.BackgroundTransparency = 1;
retentionTitle.Text = "🎁 Rewards";
retentionTitle.TextColor3 = new Color3(1, 1, 1);
retentionTitle.TextSize = 14;
retentionTitle.Font = Enum.Font.GothamBold;
retentionTitle.Parent = retentionFrame;

const retentionPadding = new Instance("UIPadding");
retentionPadding.PaddingLeft = new UDim(0, 10);
retentionPadding.PaddingTop = new UDim(0, 5);
retentionPadding.Parent = retentionTitle;

// Daily login reward button
const dailyLoginButton = new Instance("TextButton");
dailyLoginButton.Name = "DailyLoginButton";
dailyLoginButton.Size = new UDim2(1, -10, 0, 28); // Smaller
dailyLoginButton.Position = new UDim2(0, 5, 0, 30); // Below title
dailyLoginButton.BackgroundColor3 = new Color3(0.2, 0.6, 1);
dailyLoginButton.Text = "📅 Claim Daily Reward";
dailyLoginButton.TextColor3 = new Color3(1, 1, 1);
dailyLoginButton.TextSize = 14;
dailyLoginButton.Font = Enum.Font.Gotham;
dailyLoginButton.Parent = retentionFrame;

const dailyLoginCorner = new Instance("UICorner");
dailyLoginCorner.CornerRadius = new UDim(0, 6);
dailyLoginCorner.Parent = dailyLoginButton;

// AFK reward button
const afkRewardButton = new Instance("TextButton");
afkRewardButton.Name = "AFKRewardButton";
afkRewardButton.Size = new UDim2(1, -10, 0, 28); // Smaller
afkRewardButton.Position = new UDim2(0, 5, 0, 63); // Below daily login
afkRewardButton.BackgroundColor3 = new Color3(0.8, 0.4, 0.2);
afkRewardButton.Text = "⏰ Claim AFK Reward";
afkRewardButton.TextColor3 = new Color3(1, 1, 1);
afkRewardButton.TextSize = 14;
afkRewardButton.Font = Enum.Font.Gotham;
afkRewardButton.Parent = retentionFrame;

const afkRewardCorner = new Instance("UICorner");
afkRewardCorner.CornerRadius = new UDim(0, 6);
afkRewardCorner.Parent = afkRewardButton;

// Idle streak display
const idleStreakLabel = new Instance("TextLabel");
idleStreakLabel.Name = "IdleStreakLabel";
idleStreakLabel.Size = new UDim2(1, -10, 0, 18); // Smaller
idleStreakLabel.Position = new UDim2(0, 5, 0, 96); // Below AFK button
idleStreakLabel.BackgroundTransparency = 1;
idleStreakLabel.Text = "⏱️ Idle Streak: 0 min";
idleStreakLabel.TextColor3 = new Color3(0.8, 0.8, 0.8);
idleStreakLabel.TextSize = 12;
idleStreakLabel.Font = Enum.Font.Gotham;
idleStreakLabel.TextXAlignment = Enum.TextXAlignment.Left;
idleStreakLabel.Parent = retentionFrame;

// Session time display
const sessionTimeLabel = new Instance("TextLabel");
sessionTimeLabel.Name = "SessionTimeLabel";
sessionTimeLabel.Size = new UDim2(1, -10, 0, 18); // Smaller
sessionTimeLabel.Position = new UDim2(0, 5, 0, 114); // Below idle streak
sessionTimeLabel.BackgroundTransparency = 1;
sessionTimeLabel.Text = "📊 Total Playtime: 0 min";
sessionTimeLabel.TextColor3 = new Color3(0.8, 0.8, 0.8);
sessionTimeLabel.TextSize = 12;
sessionTimeLabel.Font = Enum.Font.Gotham;
sessionTimeLabel.TextXAlignment = Enum.TextXAlignment.Left;
sessionTimeLabel.Parent = retentionFrame;

// Login streak display
const loginStreakLabel = new Instance("TextLabel");
loginStreakLabel.Name = "LoginStreakLabel";
loginStreakLabel.Size = new UDim2(1, -10, 0, 18); // Smaller
loginStreakLabel.Position = new UDim2(0, 5, 0, 132); // Below session time
loginStreakLabel.BackgroundTransparency = 1;
loginStreakLabel.Text = "🔥 Login Streak: Day 0";
loginStreakLabel.TextColor3 = new Color3(0.8, 0.8, 0.8);
loginStreakLabel.TextSize = 12;
loginStreakLabel.Font = Enum.Font.Gotham;
loginStreakLabel.TextXAlignment = Enum.TextXAlignment.Left;
loginStreakLabel.Parent = retentionFrame;

// Track retention data
let idleStreak = 0;
let totalSessionTime = 0;
let loginStreak = 0;

// Handle daily login button click
dailyLoginButton.MouseButton1Click.Connect(() => {
  DailyLoginClaimRequest.FireServer();
});

// Handle AFK reward button click
afkRewardButton.MouseButton1Click.Connect(() => {
  AFKRewardClaimRequest.FireServer();
});

// Listen for daily login response
DailyLoginClaimResponse.OnClientEvent.Connect(
  (success: boolean, message: string) => {
    if (success) {
      task.spawn(() => {
        dailyLoginButton.BackgroundColor3 = new Color3(0, 1, 0);
        task.wait(0.5);
        dailyLoginButton.BackgroundColor3 = new Color3(0.2, 0.6, 1);
      });
      print(`[Client] ${message}`);
    } else {
      task.spawn(() => {
        dailyLoginButton.BackgroundColor3 = new Color3(1, 0.2, 0.2);
        task.wait(0.5);
        dailyLoginButton.BackgroundColor3 = new Color3(0.2, 0.6, 1);
      });
      warn(`[Client] Daily login failed: ${message}`);
    }
  }
);

// Listen for AFK reward response
AFKRewardClaimResponse.OnClientEvent.Connect(
  (success: boolean, message: string) => {
    if (success) {
      task.spawn(() => {
        afkRewardButton.BackgroundColor3 = new Color3(0, 1, 0);
        task.wait(0.5);
        afkRewardButton.BackgroundColor3 = new Color3(0.8, 0.4, 0.2);
      });
      print(`[Client] ${message}`);
    } else {
      task.spawn(() => {
        afkRewardButton.BackgroundColor3 = new Color3(1, 0.2, 0.2);
        task.wait(0.5);
        afkRewardButton.BackgroundColor3 = new Color3(0.8, 0.4, 0.2);
      });
      warn(`[Client] AFK reward failed: ${message}`);
    }
  }
);

// Update retention UI
function updateRetentionUI() {
  idleStreakLabel.Text = `⏱️ Idle Streak: ${idleStreak} min`;
  sessionTimeLabel.Text = `📊 Total Playtime: ${formatNumber(
    totalSessionTime
  )} min`;
  loginStreakLabel.Text = `🔥 Login Streak: Day ${loginStreak}`;
}

// Track player data
let upgradeLevels: { [id: string]: number } = {};
let unlockedZones: string[] = ["zone_1"];
let hasVIP = false;
let hasDoubleCash = false;
let hasAutoCollect = false;
let activeBoosts: { [productId: number]: number } = {};

// Listen for player data updates
PlayerDataUpdate.OnClientEvent.Connect(
  (data: {
    upgradeLevels: { [id: string]: number };
    unlockedZones: string[];
    hasVIP: boolean;
    hasDoubleCash: boolean;
    hasAutoCollect: boolean;
    activeBoosts: { [productId: number]: number };
  }) => {
    upgradeLevels = data.upgradeLevels;
    unlockedZones = data.unlockedZones;
    hasVIP = data.hasVIP;
    hasDoubleCash = data.hasDoubleCash;
    hasAutoCollect = data.hasAutoCollect;
    activeBoosts = data.activeBoosts;
    updateUpgradeUI();
    updateZoneUI();
    updateGamepassUI();
  }
);

// Create upgrades/scrolling frame - TOP RIGHT
const upgradesFrame = new Instance("ScrollingFrame");
upgradesFrame.Name = "UpgradesFrame";
upgradesFrame.Size = new UDim2(0, 280, 0, 450); // Bigger vertically to see last item
upgradesFrame.Position = new UDim2(1, -20, 0, -25); // Aligned to right edge, moved up 25px
upgradesFrame.AnchorPoint = new Vector2(1, 0); // Anchor to top right
upgradesFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
upgradesFrame.BorderSizePixel = 0;
upgradesFrame.ScrollBarThickness = 8;
upgradesFrame.CanvasSize = new UDim2(0, 0, 0, 0);
upgradesFrame.Visible = menusVisible; // Controlled by toggle
upgradesFrame.Parent = screenGui;

const upgradesCorner = new Instance("UICorner");
upgradesCorner.CornerRadius = new UDim(0, 8);
upgradesCorner.Parent = upgradesFrame;

const upgradesTitle = new Instance("TextLabel");
upgradesTitle.Name = "Title";
upgradesTitle.Size = new UDim2(1, 0, 0, 40);
upgradesTitle.BackgroundTransparency = 1;
upgradesTitle.Text = "Upgrades & Zones";
upgradesTitle.TextColor3 = new Color3(1, 1, 1);
upgradesTitle.TextSize = 20;
upgradesTitle.Font = Enum.Font.GothamBold;
upgradesTitle.Parent = upgradesFrame;

const upgradesList = new Instance("Frame");
upgradesList.Name = "UpgradesList";
upgradesList.Size = new UDim2(1, -20, 1, -50);
upgradesList.Position = new UDim2(0, 10, 0, 45);
upgradesList.BackgroundTransparency = 1;
upgradesList.Parent = upgradesFrame;

const upgradesLayout = new Instance("UIListLayout");
upgradesLayout.Padding = new UDim(0, 5);
upgradesLayout.SortOrder = Enum.SortOrder.LayoutOrder;
upgradesLayout.Parent = upgradesList;

// Listen for layout changes to update canvas size (after layout is created)
upgradesLayout.GetPropertyChangedSignal("AbsoluteContentSize").Connect(() => {
  upgradesFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    upgradesLayout.AbsoluteContentSize.Y + 30 // Extra padding to ensure last item is fully visible
  );
});

// Upgrade config (simplified - in production, import from shared)
const UPGRADES = [
  {
    id: "income_boost_1",
    name: "Income Boost I",
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 10,
  },
  {
    id: "income_boost_2",
    name: "Income Boost II",
    baseCost: 500,
    costMultiplier: 2.0,
    maxLevel: 5,
    zoneRequired: "zone_2",
  },
  {
    id: "auto_collect",
    name: "Auto Collect",
    baseCost: 1000,
    costMultiplier: 1.0,
    maxLevel: 1,
  },
  {
    id: "offline_boost",
    name: "Offline Earnings",
    baseCost: 200,
    costMultiplier: 1.8,
    maxLevel: 5,
  },
];

const ZONES = [
  { id: "zone_1", name: "Starter Zone", unlockCost: 0 },
  { id: "zone_2", name: "Forest Zone", unlockCost: 5000 },
  { id: "zone_3", name: "Mountain Zone", unlockCost: 25000 },
  { id: "zone_vip", name: "VIP Zone", unlockCost: 0, isVIP: true },
];

const upgradeButtons: { [id: string]: TextButton } = {};
const zoneButtons: { [id: string]: TextButton } = {};

function getUpgradeCost(upgrade: (typeof UPGRADES)[0], level: number): number {
  return math.floor(upgrade.baseCost * math.pow(upgrade.costMultiplier, level));
}

function updateUpgradeUI(): void {
  for (const upgrade of UPGRADES) {
    if (!upgradeButtons[upgrade.id]) {
      // Create upgrade button
      const button = new Instance("TextButton");
      button.Name = upgrade.id;
      button.Size = new UDim2(1, 0, 0, 60);
      button.BackgroundColor3 = new Color3(0.2, 0.2, 0.2);
      button.BorderSizePixel = 0;
      button.Text = "";
      button.Parent = upgradesList;

      const btnCorner = new Instance("UICorner");
      btnCorner.CornerRadius = new UDim(0, 6);
      btnCorner.Parent = button;

      const nameLabel = new Instance("TextLabel");
      nameLabel.Size = new UDim2(1, -10, 0, 25);
      nameLabel.Position = new UDim2(0, 5, 0, 5);
      nameLabel.BackgroundTransparency = 1;
      nameLabel.Text = upgrade.name;
      nameLabel.TextColor3 = new Color3(1, 1, 1);
      nameLabel.TextSize = 16;
      nameLabel.Font = Enum.Font.GothamBold;
      nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
      nameLabel.Parent = button;

      const costLabel = new Instance("TextLabel");
      costLabel.Name = "Cost";
      costLabel.Size = new UDim2(1, -10, 0, 20);
      costLabel.Position = new UDim2(0, 5, 0, 30);
      costLabel.BackgroundTransparency = 1;
      costLabel.Text = "Cost: $0";
      costLabel.TextColor3 = new Color3(1, 1, 0.5);
      costLabel.TextSize = 14;
      costLabel.Font = Enum.Font.Gotham;
      costLabel.TextXAlignment = Enum.TextXAlignment.Left;
      costLabel.Parent = button;

      const levelLabel = new Instance("TextLabel");
      levelLabel.Name = "Level";
      levelLabel.Size = new UDim2(0, 80, 1, 0);
      levelLabel.Position = new UDim2(1, -85, 0, 0);
      levelLabel.BackgroundTransparency = 1;
      levelLabel.Text = "Lv. 0";
      levelLabel.TextColor3 = new Color3(0.7, 0.7, 0.7);
      levelLabel.TextSize = 14;
      levelLabel.Font = Enum.Font.Gotham;
      levelLabel.Parent = button;

      button.MouseButton1Click.Connect(() => {
        UpgradePurchaseRequest.FireServer(upgrade.id);
      });

      upgradeButtons[upgrade.id] = button;
    }

    const button = upgradeButtons[upgrade.id];
    const level = upgradeLevels[upgrade.id] ?? 0;
    const cost = getUpgradeCost(upgrade, level);
    const canAfford = currentCurrency >= cost;
    const canUpgrade = upgrade.maxLevel === -1 || level < upgrade.maxLevel;
    const zoneOk =
      !upgrade.zoneRequired || unlockedZones.includes(upgrade.zoneRequired);

    const costLabel = button.FindFirstChild("Cost") as TextLabel;
    if (costLabel) {
      costLabel.Text = canUpgrade
        ? `Cost: $${formatNumber(cost)}`
        : "MAX LEVEL";
    }

    const levelLabel = button.FindFirstChild("Level") as TextLabel;
    if (levelLabel) {
      levelLabel.Text = `Lv. ${level}${
        upgrade.maxLevel !== -1 ? `/${upgrade.maxLevel}` : ""
      }`;
    }

    if (canAfford && canUpgrade && zoneOk) {
      button.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
    } else {
      button.BackgroundColor3 = new Color3(0.2, 0.2, 0.2);
    }
  }

  // Update canvas size with padding to ensure last item is visible
  upgradesFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    upgradesLayout.AbsoluteContentSize.Y + 30 // Extra padding to ensure last item is fully visible
  );
}

function updateZoneUI(): void {
  for (const zone of ZONES) {
    if (!zoneButtons[zone.id]) {
      const button = new Instance("TextButton");
      button.Name = zone.id;
      button.Size = new UDim2(1, 0, 0, 50);
      button.BackgroundColor3 = new Color3(0.25, 0.25, 0.4);
      button.BorderSizePixel = 0;
      button.Text = zone.name;
      button.TextColor3 = new Color3(1, 1, 1);
      button.TextSize = 16;
      button.Font = Enum.Font.GothamBold;
      button.Parent = upgradesList;

      const btnCorner = new Instance("UICorner");
      btnCorner.CornerRadius = new UDim(0, 6);
      btnCorner.Parent = button;

      button.MouseButton1Click.Connect(() => {
        ZoneUnlockRequest.FireServer(zone.id);
      });

      zoneButtons[zone.id] = button;
    }

    const button = zoneButtons[zone.id];
    const isUnlocked = unlockedZones.includes(zone.id);
    const canUnlock =
      !isUnlocked &&
      (zone.unlockCost === 0 || currentCurrency >= zone.unlockCost);
    const vipOk = !zone.isVIP || hasVIP;

    if (isUnlocked) {
      button.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
      button.Text = `✓ ${zone.name}`;
    } else if (canUnlock && vipOk) {
      button.BackgroundColor3 = new Color3(0.4, 0.4, 0.6);
      button.Text = `${zone.name} ($${formatNumber(zone.unlockCost)})`;
    } else {
      button.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
      if (zone.isVIP && !hasVIP) {
        button.Text = `${zone.name} (VIP Only)`;
      } else {
        button.Text = `${zone.name} ($${formatNumber(zone.unlockCost)})`;
      }
    }
  }

  // Update canvas size with padding to ensure last item is visible
  upgradesFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    upgradesLayout.AbsoluteContentSize.Y + 30 // Extra padding to ensure last item is fully visible
  );
}

// Handle upgrade purchase response
UpgradePurchaseResponse.OnClientEvent.Connect(
  (success: boolean, message: string) => {
    if (success) {
      print(`[Client] ${message}`);
    } else {
      warn(`[Client] Upgrade failed: ${message}`);
    }
  }
);

// Handle zone unlock response
ZoneUnlockResponse.OnClientEvent.Connect(
  (success: boolean, message: string) => {
    if (success) {
      print(`[Client] ${message}`);
    } else {
      warn(`[Client] Zone unlock failed: ${message}`);
    }
  }
);

// Update UI when currency changes
CurrencyUpdate.OnClientEvent.Connect((newCurrency: number) => {
  currentCurrency = newCurrency;
  currencyLabel.Text = `💰 $${formatNumber(newCurrency)}`;
  updateRebirthButton();
  updateUpgradeUI();
  updateZoneUI();
});

// Gamepass UI - On screen, smaller
const gamepassUI = (() => {
  const frame = new Instance("Frame");
  frame.Name = "GamepassFrame";
  frame.Size = new UDim2(0, 180, 0, 140); // Smaller
  frame.Position = new UDim2(0, 20, 0, 150); // Left side, below currency
  frame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
  frame.BorderSizePixel = 0;
  frame.Visible = menusVisible; // Controlled by toggle
  frame.Parent = screenGui;

  const corner = new Instance("UICorner");
  corner.CornerRadius = new UDim(0, 8);
  corner.Parent = frame;

  const title = new Instance("TextLabel");
  title.Name = "Title";
  title.Size = new UDim2(1, 0, 0, 25);
  title.BackgroundTransparency = 1;
  title.Text = "🎮 Gamepasses";
  title.TextColor3 = new Color3(1, 1, 1);
  title.TextSize = 14;
  title.Font = Enum.Font.GothamBold;
  title.Parent = frame;

  // No close button needed - menu is always visible on screen

  // Simple Frame with UIListLayout
  const list = new Instance("Frame");
  list.Name = "GamepassList";
  list.Size = new UDim2(1, -10, 1, -30);
  list.Position = new UDim2(0, 5, 0, 30);
  list.BackgroundTransparency = 1;
  list.Parent = frame;

  const layout = new Instance("UIListLayout");
  layout.Padding = new UDim(0, 5);
  layout.SortOrder = Enum.SortOrder.LayoutOrder;
  layout.Parent = list;

  return { frame, list, layout };
})();

const gamepassFrame = gamepassUI.frame;
const gamepassList = gamepassUI.list;
const gamepassLayout = gamepassUI.layout;

// No canvas size updates needed - using simple Frame

// Gamepass buttons
const doubleCashButton = new Instance("TextButton");
doubleCashButton.Name = "DoubleCash";
doubleCashButton.Size = new UDim2(1, 0, 0, 30); // Smaller
doubleCashButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
doubleCashButton.BorderSizePixel = 0;
doubleCashButton.Text = "2× Cash";
doubleCashButton.TextColor3 = new Color3(1, 1, 1);
doubleCashButton.TextSize = 12;
doubleCashButton.Font = Enum.Font.Gotham;
doubleCashButton.Parent = gamepassList;

const autoCollectButton = new Instance("TextButton");
autoCollectButton.Name = "AutoCollect";
autoCollectButton.Size = new UDim2(1, 0, 0, 30); // Smaller
autoCollectButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
autoCollectButton.BorderSizePixel = 0;
autoCollectButton.Text = "Auto Collect";
autoCollectButton.TextColor3 = new Color3(1, 1, 1);
autoCollectButton.TextSize = 12;
autoCollectButton.Font = Enum.Font.Gotham;
autoCollectButton.Parent = gamepassList; // Directly to ScrollingFrame

const vipButton = new Instance("TextButton");
vipButton.Name = "VIP";
vipButton.Size = new UDim2(1, 0, 0, 30); // Smaller
vipButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
vipButton.BorderSizePixel = 0;
vipButton.Text = "VIP Zone";
vipButton.TextColor3 = new Color3(1, 1, 1);
vipButton.TextSize = 12;
vipButton.Font = Enum.Font.Gotham;
vipButton.Parent = gamepassList;

// Add corners to buttons
[doubleCashButton, autoCollectButton, vipButton].forEach((btn) => {
  const corner = new Instance("UICorner");
  corner.CornerRadius = new UDim(0, 6);
  corner.Parent = btn;
});

// Gamepass purchase handlers
doubleCashButton.MouseButton1Click.Connect(() => {
  if (GAMEPASS_IDS.DOUBLE_CASH > 0) {
    MarketplaceService.PromptGamePassPurchase(player, GAMEPASS_IDS.DOUBLE_CASH);
  } else {
    warn("[Client] 2× Cash gamepass ID not set in MonetizationConfig");
  }
});

autoCollectButton.MouseButton1Click.Connect(() => {
  if (GAMEPASS_IDS.AUTO_COLLECT > 0) {
    MarketplaceService.PromptGamePassPurchase(
      player,
      GAMEPASS_IDS.AUTO_COLLECT
    );
  } else {
    warn("[Client] Auto-Collect gamepass ID not set in MonetizationConfig");
  }
});

vipButton.MouseButton1Click.Connect(() => {
  if (GAMEPASS_IDS.VIP_ZONE > 0) {
    MarketplaceService.PromptGamePassPurchase(player, GAMEPASS_IDS.VIP_ZONE);
  } else {
    warn("[Client] VIP Zone gamepass ID not set in MonetizationConfig");
  }
});

function updateGamepassUI(): void {
  // Update button states based on ownership
  if (hasDoubleCash) {
    doubleCashButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
    doubleCashButton.Text = "✓ 2× Cash";
  } else {
    doubleCashButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
    doubleCashButton.Text = "2× Cash";
  }

  if (hasAutoCollect) {
    autoCollectButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
    autoCollectButton.Text = "✓ Auto Collect";
  } else {
    autoCollectButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
    autoCollectButton.Text = "Auto Collect";
  }

  if (hasVIP) {
    vipButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
    vipButton.Text = "✓ VIP Zone";
  } else {
    vipButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
    vipButton.Text = "VIP Zone";
  }

  // Boost display is handled separately
}

// Developer Products UI - On screen, smaller
const productsUI = (() => {
  const frame = new Instance("Frame");
  frame.Name = "ProductsFrame";
  frame.Size = new UDim2(0, 180, 0, 130); // Smaller
  frame.Position = new UDim2(1, -220, 1, -300); // Right side, above boost display (boost is at -160, products is 130 tall, so -300 gives 10px spacing to match boost-events spacing)
  frame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
  frame.BorderSizePixel = 0;
  frame.Visible = menusVisible; // Controlled by toggle
  frame.Parent = screenGui;

  const corner = new Instance("UICorner");
  corner.CornerRadius = new UDim(0, 8);
  corner.Parent = frame;

  const title = new Instance("TextLabel");
  title.Name = "Title";
  title.Size = new UDim2(1, 0, 0, 25);
  title.BackgroundTransparency = 1;
  title.Text = "🛒 Products";
  title.TextColor3 = new Color3(1, 1, 1);
  title.TextSize = 14;
  title.Font = Enum.Font.GothamBold;
  title.Parent = frame;

  // Simple Frame with UIListLayout
  const list = new Instance("Frame");
  list.Name = "ProductsList";
  list.Size = new UDim2(1, -10, 1, -30);
  list.Position = new UDim2(0, 5, 0, 30);
  list.BackgroundTransparency = 1;
  list.Parent = frame;

  const layout = new Instance("UIListLayout");
  layout.Padding = new UDim(0, 5);
  layout.SortOrder = Enum.SortOrder.LayoutOrder;
  layout.Parent = list;

  return { frame, list, layout };
})();

const productsFrame = productsUI.frame;
const productsList = productsUI.list;
const productsLayout = productsUI.layout;

// Product buttons
const boost2xButton = new Instance("TextButton");
boost2xButton.Name = "Boost2X";
boost2xButton.Size = new UDim2(1, 0, 0, 28); // Smaller
boost2xButton.BackgroundColor3 = new Color3(0.3, 0.5, 0.3);
boost2xButton.BorderSizePixel = 0;
boost2xButton.Text = "2× Boost (1h)";
boost2xButton.TextColor3 = new Color3(1, 1, 1);
boost2xButton.TextSize = 11;
boost2xButton.Font = Enum.Font.Gotham;
boost2xButton.Parent = productsList;

const boost5xButton = new Instance("TextButton");
boost5xButton.Name = "Boost5X";
boost5xButton.Size = new UDim2(1, 0, 0, 28); // Smaller
boost5xButton.BackgroundColor3 = new Color3(0.5, 0.3, 0.3);
boost5xButton.BorderSizePixel = 0;
boost5xButton.Text = "5× Boost (1h)";
boost5xButton.TextColor3 = new Color3(1, 1, 1);
boost5xButton.TextSize = 11;
boost5xButton.Font = Enum.Font.Gotham;
boost5xButton.Parent = productsList;

const rebirthSkipButton = new Instance("TextButton");
rebirthSkipButton.Name = "RebirthSkip";
rebirthSkipButton.Size = new UDim2(1, 0, 0, 28); // Smaller
rebirthSkipButton.BackgroundColor3 = new Color3(0.4, 0.3, 0.5);
rebirthSkipButton.BorderSizePixel = 0;
rebirthSkipButton.Text = "Rebirth Skip";
rebirthSkipButton.TextColor3 = new Color3(1, 1, 1);
rebirthSkipButton.TextSize = 11;
rebirthSkipButton.Font = Enum.Font.Gotham;
rebirthSkipButton.Parent = productsList;

// Add corners to product buttons
[boost2xButton, boost5xButton, rebirthSkipButton].forEach((btn) => {
  const corner = new Instance("UICorner");
  corner.CornerRadius = new UDim(0, 6);
  corner.Parent = btn;
});

// No canvas size updates needed - using simple Frame

// Product purchase handlers
boost2xButton.MouseButton1Click.Connect(() => {
  if (PRODUCT_IDS.BOOST_2X_1HOUR > 0) {
    MarketplaceService.PromptProductPurchase(
      player,
      PRODUCT_IDS.BOOST_2X_1HOUR
    );
  } else {
    warn("[Client] 2× Boost product ID not set in MonetizationConfig");
  }
});

boost5xButton.MouseButton1Click.Connect(() => {
  if (PRODUCT_IDS.BOOST_5X_1HOUR > 0) {
    MarketplaceService.PromptProductPurchase(
      player,
      PRODUCT_IDS.BOOST_5X_1HOUR
    );
  } else {
    warn("[Client] 5× Boost product ID not set in MonetizationConfig");
  }
});

rebirthSkipButton.MouseButton1Click.Connect(() => {
  if (PRODUCT_IDS.REBIRTH_SKIP > 0) {
    MarketplaceService.PromptProductPurchase(player, PRODUCT_IDS.REBIRTH_SKIP);
  } else {
    warn("[Client] Rebirth Skip product ID not set in MonetizationConfig");
  }
});

// Boost display - BOTTOM RIGHT (above events)
const boostDisplayFrame = new Instance("Frame");
boostDisplayFrame.Name = "BoostDisplay";
boostDisplayFrame.Size = new UDim2(0, 200, 0, 80); // Smaller
boostDisplayFrame.Position = new UDim2(1, -220, 1, -160); // Bottom right, above events
boostDisplayFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
boostDisplayFrame.BorderSizePixel = 0;
boostDisplayFrame.Visible = true; // Always visible
boostDisplayFrame.Parent = screenGui;

const boostDisplayCorner = new Instance("UICorner");
boostDisplayCorner.CornerRadius = new UDim(0, 8);
boostDisplayCorner.Parent = boostDisplayFrame;

const boostDisplayTitle = new Instance("TextLabel");
boostDisplayTitle.Name = "Title";
boostDisplayTitle.Size = new UDim2(1, 0, 0, 25);
boostDisplayTitle.BackgroundTransparency = 1;
boostDisplayTitle.Text = "Active Boosts";
boostDisplayTitle.TextColor3 = new Color3(1, 1, 1);
boostDisplayTitle.TextSize = 16;
boostDisplayTitle.Font = Enum.Font.GothamBold;
boostDisplayTitle.Parent = boostDisplayFrame;

const boostDisplayLabel = new Instance("TextLabel");
boostDisplayLabel.Name = "BoostText";
boostDisplayLabel.Size = new UDim2(1, -10, 1, -30);
boostDisplayLabel.Position = new UDim2(0, 5, 0, 28);
boostDisplayLabel.BackgroundTransparency = 1;
boostDisplayLabel.Text = "No active boosts";
boostDisplayLabel.TextColor3 = new Color3(0.7, 0.7, 0.7);
boostDisplayLabel.TextSize = 14;
boostDisplayLabel.Font = Enum.Font.Gotham;
boostDisplayLabel.TextXAlignment = Enum.TextXAlignment.Left;
boostDisplayLabel.TextWrapped = true;
boostDisplayLabel.Parent = boostDisplayFrame;

function updateBoostDisplay(): void {
  const currentTime = os.time();
  const activeBoostsList: string[] = [];

  for (const [productId, expiration] of pairs(activeBoosts)) {
    if (
      typeIs(productId, "number") &&
      typeIs(expiration, "number") &&
      expiration > currentTime
    ) {
      const timeLeft = math.floor((expiration - currentTime) / 60); // minutes
      if (productId === PRODUCT_IDS.BOOST_2X_1HOUR) {
        activeBoostsList.push(`2× Boost: ${timeLeft}m`);
      } else if (productId === PRODUCT_IDS.BOOST_5X_1HOUR) {
        activeBoostsList.push(`5× Boost: ${timeLeft}m`);
      }
    }
  }

  if (activeBoostsList.size() > 0) {
    boostDisplayLabel.Text = activeBoostsList.join("\n");
    boostDisplayLabel.TextColor3 = new Color3(0.8, 1, 0.8);
  } else {
    boostDisplayLabel.Text = "No active boosts";
    boostDisplayLabel.TextColor3 = new Color3(0.7, 0.7, 0.7);
  }
}

// Update boost display when data changes
PlayerDataUpdate.OnClientEvent.Connect(
  (data: {
    upgradeLevels: { [id: string]: number };
    unlockedZones: string[];
    hasVIP: boolean;
    hasDoubleCash: boolean;
    hasAutoCollect: boolean;
    activeBoosts: { [productId: number]: number };
    idleStreak?: number;
    totalSessionTime?: number;
    loginStreak?: number;
    unlockedAchievements?: string[];
  }) => {
    upgradeLevels = data.upgradeLevels;
    unlockedZones = data.unlockedZones;
    hasVIP = data.hasVIP;
    hasDoubleCash = data.hasDoubleCash;
    hasAutoCollect = data.hasAutoCollect;
    activeBoosts = data.activeBoosts;
    if (data.idleStreak !== undefined) idleStreak = data.idleStreak;
    if (data.totalSessionTime !== undefined)
      totalSessionTime = data.totalSessionTime;
    if (data.loginStreak !== undefined) loginStreak = data.loginStreak;
    if (data.unlockedAchievements !== undefined)
      unlockedAchievements = data.unlockedAchievements;
    updateUpgradeUI();
    updateZoneUI();
    updateGamepassUI();
    updateBoostDisplay();
    updateRetentionUI();
    if (achievementsFrame.Visible) {
      updateAchievementsUI();
    }
  }
);

// Phase 7 - Achievements & Leaderboards UI

// Track unlocked achievements and progress
let unlockedAchievements: string[] = [];
let achievementProgress: { [achievementId: string]: number } = {};

// Achievements Frame
const achievementsFrame = new Instance("ScrollingFrame");
achievementsFrame.Name = "AchievementsFrame";
achievementsFrame.Size = new UDim2(0, 400, 0, 500);
achievementsFrame.Position = new UDim2(0.5, -200, 0.5, -250);
achievementsFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
achievementsFrame.BorderSizePixel = 0;
achievementsFrame.ScrollBarThickness = 8;
achievementsFrame.CanvasSize = new UDim2(0, 0, 0, 0);
achievementsFrame.Visible = false; // Hidden by default
achievementsFrame.Parent = screenGui;

const achievementsCorner = new Instance("UICorner");
achievementsCorner.CornerRadius = new UDim(0, 8);
achievementsCorner.Parent = achievementsFrame;

const achievementsTitle = new Instance("TextLabel");
achievementsTitle.Name = "Title";
achievementsTitle.Size = new UDim2(1, 0, 0, 40);
achievementsTitle.BackgroundTransparency = 1;
achievementsTitle.Text = "🏆 Achievements";
achievementsTitle.TextColor3 = new Color3(1, 1, 1);
achievementsTitle.TextSize = 24;
achievementsTitle.Font = Enum.Font.GothamBold;
achievementsTitle.Parent = achievementsFrame;

const achievementsList = new Instance("Frame");
achievementsList.Name = "AchievementsList";
achievementsList.Size = new UDim2(1, -20, 1, -50);
achievementsList.Position = new UDim2(0, 10, 0, 45);
achievementsList.BackgroundTransparency = 1;
achievementsList.Parent = achievementsFrame;

const achievementsLayout = new Instance("UIListLayout");
achievementsLayout.Padding = new UDim(0, 8);
achievementsLayout.SortOrder = Enum.SortOrder.LayoutOrder;
achievementsLayout.Parent = achievementsList;

// Close button for achievements
const achievementsCloseButton = new Instance("TextButton");
achievementsCloseButton.Name = "CloseButton";
achievementsCloseButton.Size = new UDim2(0, 30, 0, 30);
achievementsCloseButton.Position = new UDim2(1, -35, 0, 5);
achievementsCloseButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
achievementsCloseButton.Text = "×";
achievementsCloseButton.TextColor3 = new Color3(1, 1, 1);
achievementsCloseButton.TextSize = 20;
achievementsCloseButton.Font = Enum.Font.GothamBold;
achievementsCloseButton.Parent = achievementsFrame;

const achievementsCloseCorner = new Instance("UICorner");
achievementsCloseCorner.CornerRadius = new UDim(0, 6);
achievementsCloseCorner.Parent = achievementsCloseButton;

achievementsCloseButton.MouseButton1Click.Connect(() => {
  achievementsFrame.Visible = false;
});

// Leaderboard Frame
const leaderboardFrame = new Instance("Frame");
leaderboardFrame.Name = "LeaderboardFrame";
leaderboardFrame.Size = new UDim2(0, 400, 0, 500);
leaderboardFrame.Position = new UDim2(0.5, -200, 0.5, -250);
leaderboardFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
leaderboardFrame.BorderSizePixel = 0;
leaderboardFrame.Visible = false; // Hidden by default
leaderboardFrame.Parent = screenGui;

const leaderboardCorner = new Instance("UICorner");
leaderboardCorner.CornerRadius = new UDim(0, 8);
leaderboardCorner.Parent = leaderboardFrame;

const leaderboardTitle = new Instance("TextLabel");
leaderboardTitle.Name = "Title";
leaderboardTitle.Size = new UDim2(1, 0, 0, 40);
leaderboardTitle.BackgroundTransparency = 1;
leaderboardTitle.Text = "📊 Leaderboards";
leaderboardTitle.TextColor3 = new Color3(1, 1, 1);
leaderboardTitle.TextSize = 24;
leaderboardTitle.Font = Enum.Font.GothamBold;
leaderboardTitle.Parent = leaderboardFrame;

// Leaderboard type buttons
const leaderboardButtonFrame = new Instance("Frame");
leaderboardButtonFrame.Name = "ButtonFrame";
leaderboardButtonFrame.Size = new UDim2(1, -20, 0, 40);
leaderboardButtonFrame.Position = new UDim2(0, 10, 0, 45);
leaderboardButtonFrame.BackgroundTransparency = 1;
leaderboardButtonFrame.Parent = leaderboardFrame;

const leaderboardButtonLayout = new Instance("UIListLayout");
leaderboardButtonLayout.FillDirection = Enum.FillDirection.Horizontal;
leaderboardButtonLayout.Padding = new UDim(0, 5);
leaderboardButtonLayout.Parent = leaderboardButtonFrame;

const currencyLeaderboardButton = new Instance("TextButton");
currencyLeaderboardButton.Name = "CurrencyButton";
currencyLeaderboardButton.Size = new UDim2(0, 120, 0, 35);
currencyLeaderboardButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
currencyLeaderboardButton.Text = "💰 Currency";
currencyLeaderboardButton.TextColor3 = new Color3(1, 1, 1);
currencyLeaderboardButton.TextSize = 14;
currencyLeaderboardButton.Font = Enum.Font.Gotham;
currencyLeaderboardButton.Parent = leaderboardButtonFrame;

const rebirthsLeaderboardButton = new Instance("TextButton");
rebirthsLeaderboardButton.Name = "RebirthsButton";
rebirthsLeaderboardButton.Size = new UDim2(0, 120, 0, 35);
rebirthsLeaderboardButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
rebirthsLeaderboardButton.Text = "🔄 Rebirths";
rebirthsLeaderboardButton.TextColor3 = new Color3(1, 1, 1);
rebirthsLeaderboardButton.TextSize = 14;
rebirthsLeaderboardButton.Font = Enum.Font.Gotham;
rebirthsLeaderboardButton.Parent = leaderboardButtonFrame;

const playtimeLeaderboardButton = new Instance("TextButton");
playtimeLeaderboardButton.Name = "PlaytimeButton";
playtimeLeaderboardButton.Size = new UDim2(0, 120, 0, 35);
playtimeLeaderboardButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
playtimeLeaderboardButton.Text = "⏰ Playtime";
playtimeLeaderboardButton.TextColor3 = new Color3(1, 1, 1);
playtimeLeaderboardButton.TextSize = 14;
playtimeLeaderboardButton.Font = Enum.Font.Gotham;
playtimeLeaderboardButton.Parent = leaderboardButtonFrame;

const leaderboardList = new Instance("ScrollingFrame");
leaderboardList.Name = "LeaderboardList";
leaderboardList.Size = new UDim2(1, -20, 1, -100);
leaderboardList.Position = new UDim2(0, 10, 0, 90);
leaderboardList.BackgroundTransparency = 1;
leaderboardList.ScrollBarThickness = 8;
leaderboardList.CanvasSize = new UDim2(0, 0, 0, 0);
leaderboardList.Parent = leaderboardFrame;

const leaderboardListLayout = new Instance("UIListLayout");
leaderboardListLayout.Padding = new UDim(0, 5);
leaderboardListLayout.SortOrder = Enum.SortOrder.LayoutOrder;
leaderboardListLayout.Parent = leaderboardList;

// Close button for leaderboard
const leaderboardCloseButton = new Instance("TextButton");
leaderboardCloseButton.Name = "CloseButton";
leaderboardCloseButton.Size = new UDim2(0, 30, 0, 30);
leaderboardCloseButton.Position = new UDim2(1, -35, 0, 5);
leaderboardCloseButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
leaderboardCloseButton.Text = "×";
leaderboardCloseButton.TextColor3 = new Color3(1, 1, 1);
leaderboardCloseButton.TextSize = 20;
leaderboardCloseButton.Font = Enum.Font.GothamBold;
leaderboardCloseButton.Parent = leaderboardFrame;

const leaderboardCloseCorner = new Instance("UICorner");
leaderboardCloseCorner.CornerRadius = new UDim(0, 6);
leaderboardCloseCorner.Parent = leaderboardCloseButton;

leaderboardCloseButton.MouseButton1Click.Connect(() => {
  leaderboardFrame.Visible = false;
  stopLeaderboardAutoRefresh();
});

// Buttons to open achievements and leaderboards (add to retention frame)
// Position them after the login streak label (which ends at Y: 190)
const achievementsButton = new Instance("TextButton");
achievementsButton.Name = "AchievementsButton";
achievementsButton.Size = new UDim2(1, -20, 0, 30);
achievementsButton.Position = new UDim2(0, 5, 0, 155); // After login streak label
achievementsButton.BackgroundColor3 = new Color3(0.4, 0.2, 0.8);
achievementsButton.Text = "🏆 Achievements";
achievementsButton.TextColor3 = new Color3(1, 1, 1);
achievementsButton.TextSize = 14;
achievementsButton.Font = Enum.Font.Gotham;
achievementsButton.Parent = retentionFrame;

const achievementsButtonCorner = new Instance("UICorner");
achievementsButtonCorner.CornerRadius = new UDim(0, 6);
achievementsButtonCorner.Parent = achievementsButton;

const leaderboardButton = new Instance("TextButton");
leaderboardButton.Name = "LeaderboardButton";
leaderboardButton.Size = new UDim2(1, -20, 0, 30);
leaderboardButton.Position = new UDim2(0, 5, 0, 190); // After achievements button
leaderboardButton.BackgroundColor3 = new Color3(0.2, 0.4, 0.8);
leaderboardButton.Text = "📊 Leaderboards";
leaderboardButton.TextColor3 = new Color3(1, 1, 1);
leaderboardButton.TextSize = 14;
leaderboardButton.Font = Enum.Font.Gotham;
leaderboardButton.Parent = retentionFrame;

const leaderboardButtonCorner = new Instance("UICorner");
leaderboardButtonCorner.CornerRadius = new UDim(0, 6);
leaderboardButtonCorner.Parent = leaderboardButton;

// Update retention frame size to accommodate new buttons
retentionFrame.Size = new UDim2(0, 300, 0, 270); // 195 + 30 + 5 spacing + 30 + 10 padding

// Achievement unlock notification
let achievementNotificationFrame: Frame | undefined = undefined;

function showAchievementNotification(
  achievementId: string,
  name: string,
  description: string,
  icon: string,
  reward: number
): void {
  // Remove existing notification if any
  if (achievementNotificationFrame) {
    achievementNotificationFrame.Destroy();
  }

  const notification = new Instance("Frame");
  notification.Name = "AchievementNotification";
  notification.Size = new UDim2(0, 350, 0, 100);
  notification.Position = new UDim2(1, -370, 0, 20);
  notification.BackgroundColor3 = new Color3(0.2, 0.6, 0.2);
  notification.BorderSizePixel = 0;
  notification.Parent = screenGui;

  const notificationCorner = new Instance("UICorner");
  notificationCorner.CornerRadius = new UDim(0, 8);
  notificationCorner.Parent = notification;

  const iconLabel = new Instance("TextLabel");
  iconLabel.Size = new UDim2(0, 60, 1, 0);
  iconLabel.Position = new UDim2(0, 10, 0, 0);
  iconLabel.BackgroundTransparency = 1;
  iconLabel.Text = icon;
  iconLabel.TextSize = 40;
  iconLabel.Font = Enum.Font.GothamBold;
  iconLabel.Parent = notification;

  const nameLabel = new Instance("TextLabel");
  nameLabel.Size = new UDim2(1, -80, 0, 30);
  nameLabel.Position = new UDim2(0, 70, 0, 10);
  nameLabel.BackgroundTransparency = 1;
  nameLabel.Text = `Achievement Unlocked: ${name}`;
  nameLabel.TextColor3 = new Color3(1, 1, 1);
  nameLabel.TextSize = 16;
  nameLabel.Font = Enum.Font.GothamBold;
  nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
  nameLabel.Parent = notification;

  const descLabel = new Instance("TextLabel");
  descLabel.Size = new UDim2(1, -80, 0, 40);
  descLabel.Position = new UDim2(0, 70, 0, 40);
  descLabel.BackgroundTransparency = 1;
  descLabel.Text = description;
  descLabel.TextColor3 = new Color3(0.9, 0.9, 0.9);
  descLabel.TextSize = 12;
  descLabel.Font = Enum.Font.Gotham;
  descLabel.TextXAlignment = Enum.TextXAlignment.Left;
  descLabel.TextWrapped = true;
  descLabel.Parent = notification;

  if (reward > 0) {
    const rewardLabel = new Instance("TextLabel");
    rewardLabel.Size = new UDim2(1, -80, 0, 20);
    rewardLabel.Position = new UDim2(0, 70, 0, 80);
    rewardLabel.BackgroundTransparency = 1;
    rewardLabel.Text = `Reward: $${formatNumber(reward)}`;
    rewardLabel.TextColor3 = new Color3(1, 1, 0.5);
    rewardLabel.TextSize = 14;
    rewardLabel.Font = Enum.Font.GothamBold;
    rewardLabel.TextXAlignment = Enum.TextXAlignment.Left;
    rewardLabel.Parent = notification;
  }

  achievementNotificationFrame = notification;

  // Auto-hide after 5 seconds
  task.spawn(() => {
    task.wait(5);
    if (notification.Parent) {
      notification.Destroy();
      achievementNotificationFrame = undefined;
    }
  });
}

// Update achievements UI
function updateAchievementsUI(): void {
  // Clear existing achievement items
  for (const child of achievementsList.GetChildren()) {
    if (child.IsA("Frame")) {
      child.Destroy();
    }
  }

  // Create achievement items
  for (const achievement of ACHIEVEMENTS) {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const progress = achievementProgress[achievement.id] ?? 0;

    const achievementItem = new Instance("Frame");
    achievementItem.Name = achievement.id;
    achievementItem.Size = new UDim2(1, 0, 0, 75); // Increased height for progress bar
    achievementItem.BackgroundColor3 = isUnlocked
      ? new Color3(0.2, 0.5, 0.2)
      : new Color3(0.2, 0.2, 0.2);
    achievementItem.BorderSizePixel = 0;
    achievementItem.Parent = achievementsList;

    const itemCorner = new Instance("UICorner");
    itemCorner.CornerRadius = new UDim(0, 6);
    itemCorner.Parent = achievementItem;

    const iconLabel = new Instance("TextLabel");
    iconLabel.Size = new UDim2(0, 50, 1, 0);
    iconLabel.Position = new UDim2(0, 5, 0, 0);
    iconLabel.BackgroundTransparency = 1;
    iconLabel.Text = achievement.icon;
    iconLabel.TextSize = 30;
    iconLabel.Font = Enum.Font.GothamBold;
    iconLabel.Parent = achievementItem;

    const nameLabel = new Instance("TextLabel");
    nameLabel.Size = new UDim2(1, -60, 0, 25);
    nameLabel.Position = new UDim2(0, 55, 0, 5);
    nameLabel.BackgroundTransparency = 1;
    nameLabel.Text = isUnlocked ? `✓ ${achievement.name}` : achievement.name;
    nameLabel.TextColor3 = isUnlocked
      ? new Color3(1, 1, 1)
      : new Color3(0.7, 0.7, 0.7);
    nameLabel.TextSize = 16;
    nameLabel.Font = Enum.Font.GothamBold;
    nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
    nameLabel.Parent = achievementItem;

    const descLabel = new Instance("TextLabel");
    descLabel.Size = new UDim2(1, -60, 0, 20);
    descLabel.Position = new UDim2(0, 55, 0, 30);
    descLabel.BackgroundTransparency = 1;
    descLabel.Text = achievement.description;
    descLabel.TextColor3 = isUnlocked
      ? new Color3(0.9, 0.9, 0.9)
      : new Color3(0.5, 0.5, 0.5);
    descLabel.TextSize = 12;
    descLabel.Font = Enum.Font.Gotham;
    descLabel.TextXAlignment = Enum.TextXAlignment.Left;
    descLabel.TextWrapped = true;
    descLabel.Parent = achievementItem;

    // Progress bar (only show if not unlocked)
    if (!isUnlocked && progress > 0) {
      const progressBarFrame = new Instance("Frame");
      progressBarFrame.Name = "ProgressBar";
      progressBarFrame.Size = new UDim2(1, -60, 0, 8);
      progressBarFrame.Position = new UDim2(0, 55, 0, 55);
      progressBarFrame.BackgroundColor3 = new Color3(0.1, 0.1, 0.1);
      progressBarFrame.BorderSizePixel = 0;
      progressBarFrame.Parent = achievementItem;

      const progressBarCorner = new Instance("UICorner");
      progressBarCorner.CornerRadius = new UDim(0, 4);
      progressBarCorner.Parent = progressBarFrame;

      const progressBarFill = new Instance("Frame");
      progressBarFill.Name = "ProgressFill";
      progressBarFill.Size = new UDim2(progress / 100, 0, 1, 0);
      progressBarFill.Position = new UDim2(0, 0, 0, 0);
      progressBarFill.BackgroundColor3 = new Color3(0.2, 0.6, 1);
      progressBarFill.BorderSizePixel = 0;
      progressBarFill.Parent = progressBarFrame;

      const progressBarFillCorner = new Instance("UICorner");
      progressBarFillCorner.CornerRadius = new UDim(0, 4);
      progressBarFillCorner.Parent = progressBarFill;

      const progressLabel = new Instance("TextLabel");
      progressLabel.Size = new UDim2(1, 0, 1, 0);
      progressLabel.Position = new UDim2(0, 0, 0, 0);
      progressLabel.BackgroundTransparency = 1;
      progressLabel.Text = `${progress}%`;
      progressLabel.TextColor3 = new Color3(1, 1, 1);
      progressLabel.TextSize = 10;
      progressLabel.Font = Enum.Font.GothamBold;
      progressLabel.Parent = progressBarFrame;
    }
  }

  // Update canvas size
  achievementsFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    achievementsLayout.AbsoluteContentSize.Y + 20
  );
}

// Update leaderboard UI
let currentLeaderboardType: "currency" | "rebirths" | "playtime" = "currency";

function updateLeaderboardUI(
  leaderboardType: "currency" | "rebirths" | "playtime",
  data: Array<{ userId: number; username: string; value: number }>
): void {
  // Clear existing leaderboard items
  for (const child of leaderboardList.GetChildren()) {
    if (child.IsA("Frame")) {
      child.Destroy();
    }
  }

  // Update button states
  currencyLeaderboardButton.BackgroundColor3 =
    leaderboardType === "currency"
      ? new Color3(0.2, 0.6, 0.2)
      : new Color3(0.3, 0.3, 0.3);
  rebirthsLeaderboardButton.BackgroundColor3 =
    leaderboardType === "rebirths"
      ? new Color3(0.2, 0.6, 0.2)
      : new Color3(0.3, 0.3, 0.3);
  playtimeLeaderboardButton.BackgroundColor3 =
    leaderboardType === "playtime"
      ? new Color3(0.2, 0.6, 0.2)
      : new Color3(0.3, 0.3, 0.3);

  // Create leaderboard items
  for (let i = 0; i < data.size(); i++) {
    const entry = data[i];
    const rank = i + 1;

    const leaderboardItem = new Instance("Frame");
    leaderboardItem.Name = `Rank${rank}`;
    leaderboardItem.Size = new UDim2(1, 0, 0, 40);
    leaderboardItem.BackgroundColor3 =
      rank <= 3 ? new Color3(0.25, 0.25, 0.35) : new Color3(0.2, 0.2, 0.2);
    leaderboardItem.BorderSizePixel = 0;
    leaderboardItem.Parent = leaderboardList;

    const itemCorner = new Instance("UICorner");
    itemCorner.CornerRadius = new UDim(0, 6);
    itemCorner.Parent = leaderboardItem;

    const rankLabel = new Instance("TextLabel");
    rankLabel.Size = new UDim2(0, 40, 1, 0);
    rankLabel.Position = new UDim2(0, 5, 0, 0);
    rankLabel.BackgroundTransparency = 1;
    rankLabel.Text = `#${rank}`;
    rankLabel.TextColor3 =
      rank === 1
        ? new Color3(1, 0.84, 0)
        : rank === 2
        ? new Color3(0.75, 0.75, 0.75)
        : rank === 3
        ? new Color3(0.8, 0.5, 0.2)
        : new Color3(0.7, 0.7, 0.7);
    rankLabel.TextSize = 18;
    rankLabel.Font = Enum.Font.GothamBold;
    rankLabel.Parent = leaderboardItem;

    const nameLabel = new Instance("TextLabel");
    nameLabel.Size = new UDim2(1, -150, 1, 0);
    nameLabel.Position = new UDim2(0, 50, 0, 0);
    nameLabel.BackgroundTransparency = 1;
    nameLabel.Text = entry.username;
    nameLabel.TextColor3 = new Color3(1, 1, 1);
    nameLabel.TextSize = 16;
    nameLabel.Font = Enum.Font.Gotham;
    nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
    nameLabel.Parent = leaderboardItem;

    const valueLabel = new Instance("TextLabel");
    valueLabel.Size = new UDim2(0, 100, 1, 0);
    valueLabel.Position = new UDim2(1, -105, 0, 0);
    valueLabel.BackgroundTransparency = 1;
    let valueText = "";
    if (leaderboardType === "currency") {
      valueText = `$${formatNumber(entry.value)}`;
    } else if (leaderboardType === "rebirths") {
      valueText = `${entry.value}`;
    } else {
      valueText = `${formatNumber(entry.value)}m`;
    }
    valueLabel.Text = valueText;
    valueLabel.TextColor3 = new Color3(1, 1, 0.5);
    valueLabel.TextSize = 14;
    valueLabel.Font = Enum.Font.GothamBold;
    valueLabel.TextXAlignment = Enum.TextXAlignment.Right;
    valueLabel.Parent = leaderboardItem;
  }

  // Update canvas size
  leaderboardList.CanvasSize = new UDim2(
    0,
    0,
    0,
    leaderboardListLayout.AbsoluteContentSize.Y + 20
  );
}

// Button click handlers
achievementsButton.MouseButton1Click.Connect(() => {
  achievementsFrame.Visible = true;
  updateAchievementsUI();
});

leaderboardButton.MouseButton1Click.Connect(() => {
  leaderboardFrame.Visible = true;
  currentLeaderboardType = "currency";
  LeaderboardRequest.FireServer("currency");
  startLeaderboardAutoRefresh();
});

currencyLeaderboardButton.MouseButton1Click.Connect(() => {
  currentLeaderboardType = "currency";
  LeaderboardRequest.FireServer("currency");
  // Auto-refresh will continue with new type
});

rebirthsLeaderboardButton.MouseButton1Click.Connect(() => {
  currentLeaderboardType = "rebirths";
  LeaderboardRequest.FireServer("rebirths");
  // Auto-refresh will continue with new type
});

playtimeLeaderboardButton.MouseButton1Click.Connect(() => {
  currentLeaderboardType = "playtime";
  LeaderboardRequest.FireServer("playtime");
  // Auto-refresh will continue with new type
});

// Listen for achievement unlock
AchievementUnlocked.OnClientEvent.Connect(
  (
    achievementId: string,
    name: string,
    description: string,
    icon: string,
    reward: number
  ) => {
    showAchievementNotification(achievementId, name, description, icon, reward);
    // Update achievements list if it's visible
    if (achievementsFrame.Visible) {
      updateAchievementsUI();
    }
  }
);

// Listen for achievements update
AchievementsUpdate.OnClientEvent.Connect((achievementIds: string[]) => {
  unlockedAchievements = achievementIds;
  if (achievementsFrame.Visible) {
    updateAchievementsUI();
  }
});

// Listen for achievement progress update
AchievementProgressUpdate.OnClientEvent.Connect(
  (progress: { [achievementId: string]: number }) => {
    achievementProgress = progress;
    if (achievementsFrame.Visible) {
      updateAchievementsUI();
    }
  }
);

// Listen for leaderboard response
LeaderboardResponse.OnClientEvent.Connect(
  (
    leaderboardType: "currency" | "rebirths" | "playtime",
    data: Array<{ userId: number; username: string; value: number }>
  ) => {
    updateLeaderboardUI(leaderboardType, data);
  }
);

// Auto-refresh leaderboards when frame is visible
let leaderboardRefreshInterval: thread | undefined = undefined;

function startLeaderboardAutoRefresh(): void {
  // Clear existing interval if any
  if (leaderboardRefreshInterval) {
    task.cancel(leaderboardRefreshInterval);
  }

  // Refresh every 10 seconds
  leaderboardRefreshInterval = task.spawn(() => {
    while (leaderboardFrame.Visible) {
      task.wait(10);
      if (leaderboardFrame.Visible) {
        LeaderboardRequest.FireServer(currentLeaderboardType);
      }
    }
  });
}

function stopLeaderboardAutoRefresh(): void {
  if (leaderboardRefreshInterval) {
    task.cancel(leaderboardRefreshInterval);
    leaderboardRefreshInterval = undefined;
  }
}

// Phase 8 - Events UI

// Track active events
let activeEvents: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  startTime: number;
  endTime: number;
}> = [];

// Events notification frame
let eventNotificationFrame: Frame | undefined = undefined;

function showEventNotification(
  eventId: string,
  name: string,
  description: string,
  icon: string
): void {
  // Remove existing notification if any
  if (eventNotificationFrame) {
    eventNotificationFrame.Destroy();
  }

  const notification = new Instance("Frame");
  notification.Name = "EventNotification";
  notification.Size = new UDim2(0, 350, 0, 100);
  notification.Position = new UDim2(1, -370, 0, 130); // Below achievement notification
  notification.BackgroundColor3 = new Color3(0.4, 0.2, 0.8);
  notification.BorderSizePixel = 0;
  notification.Parent = screenGui;

  const notificationCorner = new Instance("UICorner");
  notificationCorner.CornerRadius = new UDim(0, 8);
  notificationCorner.Parent = notification;

  const iconLabel = new Instance("TextLabel");
  iconLabel.Size = new UDim2(0, 60, 1, 0);
  iconLabel.Position = new UDim2(0, 10, 0, 0);
  iconLabel.BackgroundTransparency = 1;
  iconLabel.Text = icon;
  iconLabel.TextSize = 40;
  iconLabel.Font = Enum.Font.GothamBold;
  iconLabel.Parent = notification;

  const nameLabel = new Instance("TextLabel");
  nameLabel.Size = new UDim2(1, -80, 0, 30);
  nameLabel.Position = new UDim2(0, 70, 0, 10);
  nameLabel.BackgroundTransparency = 1;
  nameLabel.Text = `Event Started: ${name}`;
  nameLabel.TextColor3 = new Color3(1, 1, 1);
  nameLabel.TextSize = 16;
  nameLabel.Font = Enum.Font.GothamBold;
  nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
  nameLabel.Parent = notification;

  const descLabel = new Instance("TextLabel");
  descLabel.Size = new UDim2(1, -80, 0, 50);
  descLabel.Position = new UDim2(0, 70, 0, 40);
  descLabel.BackgroundTransparency = 1;
  descLabel.Text = description;
  descLabel.TextColor3 = new Color3(0.9, 0.9, 0.9);
  descLabel.TextSize = 12;
  descLabel.Font = Enum.Font.Gotham;
  descLabel.TextXAlignment = Enum.TextXAlignment.Left;
  descLabel.TextWrapped = true;
  descLabel.Parent = notification;

  eventNotificationFrame = notification;

  // Auto-hide after 8 seconds
  task.spawn(() => {
    task.wait(8);
    if (notification.Parent) {
      notification.Destroy();
      eventNotificationFrame = undefined;
    }
  });
}

// Events display frame - BOTTOM RIGHT
const eventsFrame = new Instance("Frame");
eventsFrame.Name = "EventsFrame";
eventsFrame.Size = new UDim2(0, 200, 0, 100); // Smaller
eventsFrame.Position = new UDim2(1, -220, 1, -70); // Bottom right corner
eventsFrame.BackgroundColor3 = new Color3(0.15, 0.1, 0.2);
eventsFrame.BorderSizePixel = 0;
eventsFrame.Visible = true; // Always visible
eventsFrame.Parent = screenGui;

const eventsCorner = new Instance("UICorner");
eventsCorner.CornerRadius = new UDim(0, 8);
eventsCorner.Parent = eventsFrame;

const eventsTitle = new Instance("TextLabel");
eventsTitle.Name = "Title";
eventsTitle.Size = new UDim2(1, 0, 0, 30);
eventsTitle.Position = new UDim2(0, 0, 0, 0);
eventsTitle.BackgroundTransparency = 1;
eventsTitle.Text = "🎉 Active Events";
eventsTitle.TextColor3 = new Color3(1, 1, 1);
eventsTitle.TextSize = 18;
eventsTitle.Font = Enum.Font.GothamBold;
eventsTitle.Parent = eventsFrame;

const eventsPadding = new Instance("UIPadding");
eventsPadding.PaddingLeft = new UDim(0, 10);
eventsPadding.PaddingTop = new UDim(0, 5);
eventsPadding.Parent = eventsTitle;

const eventsList = new Instance("ScrollingFrame");
eventsList.Name = "EventsList";
eventsList.Size = new UDim2(1, -20, 1, -35);
eventsList.Position = new UDim2(0, 10, 0, 35);
eventsList.BackgroundTransparency = 1;
eventsList.ScrollBarThickness = 4;
eventsList.CanvasSize = new UDim2(0, 0, 0, 0);
eventsList.Parent = eventsFrame;

// Container frame inside ScrollingFrame for layout
const eventsListContainer = new Instance("Frame");
eventsListContainer.Name = "Container";
eventsListContainer.Size = new UDim2(1, 0, 0, 0);
eventsListContainer.BackgroundTransparency = 1;
eventsListContainer.AutomaticSize = Enum.AutomaticSize.Y;
eventsListContainer.Parent = eventsList;

const eventsLayout = new Instance("UIListLayout");
eventsLayout.Padding = new UDim(0, 5);
eventsLayout.SortOrder = Enum.SortOrder.LayoutOrder;
eventsLayout.Parent = eventsListContainer;

// Update events UI
function updateEventsUI(): void {
  // Clear existing event items
  for (const child of eventsListContainer.GetChildren()) {
    if (child.IsA("Frame")) {
      child.Destroy();
    }
  }

  if (activeEvents.size() === 0) {
    const noEventsLabel = new Instance("TextLabel");
    noEventsLabel.Size = new UDim2(1, 0, 0, 30);
    noEventsLabel.BackgroundTransparency = 1;
    noEventsLabel.Text = "No active events";
    noEventsLabel.TextColor3 = new Color3(0.6, 0.6, 0.6);
    noEventsLabel.TextSize = 12;
    noEventsLabel.Font = Enum.Font.Gotham;
    noEventsLabel.Parent = eventsListContainer;
  } else {
    const currentTime = os.time();

    for (const event of activeEvents) {
      const timeRemaining = event.endTime - currentTime;
      const minutesRemaining = math.floor(timeRemaining / 60);
      const secondsRemaining = timeRemaining % 60;

      const eventItem = new Instance("Frame");
      eventItem.Name = event.id;
      eventItem.Size = new UDim2(1, 0, 0, 50);
      eventItem.BackgroundColor3 = new Color3(0.3, 0.2, 0.4);
      eventItem.BorderSizePixel = 0;
      eventItem.Parent = eventsListContainer;

      const itemCorner = new Instance("UICorner");
      itemCorner.CornerRadius = new UDim(0, 6);
      itemCorner.Parent = eventItem;

      const iconLabel = new Instance("TextLabel");
      iconLabel.Size = new UDim2(0, 30, 1, 0);
      iconLabel.Position = new UDim2(0, 5, 0, 0);
      iconLabel.BackgroundTransparency = 1;
      iconLabel.Text = event.icon;
      iconLabel.TextSize = 20;
      iconLabel.Font = Enum.Font.GothamBold;
      iconLabel.Parent = eventItem;

      const nameLabel = new Instance("TextLabel");
      nameLabel.Size = new UDim2(1, -40, 0, 20);
      nameLabel.Position = new UDim2(0, 35, 0, 5);
      nameLabel.BackgroundTransparency = 1;
      nameLabel.Text = event.name;
      nameLabel.TextColor3 = new Color3(1, 1, 1);
      nameLabel.TextSize = 14;
      nameLabel.Font = Enum.Font.GothamBold;
      nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
      nameLabel.Parent = eventItem;

      const timeLabel = new Instance("TextLabel");
      timeLabel.Size = new UDim2(1, -40, 0, 20);
      timeLabel.Position = new UDim2(0, 35, 0, 25);
      timeLabel.BackgroundTransparency = 1;
      timeLabel.Text = `${minutesRemaining}m ${secondsRemaining}s remaining`;
      timeLabel.TextColor3 = new Color3(0.8, 0.8, 0.8);
      timeLabel.TextSize = 11;
      timeLabel.Font = Enum.Font.Gotham;
      timeLabel.TextXAlignment = Enum.TextXAlignment.Left;
      timeLabel.Parent = eventItem;
    }
  }

  // Update canvas size
  eventsList.CanvasSize = new UDim2(
    0,
    0,
    0,
    eventsLayout.AbsoluteContentSize.Y + 10
  );

  // Update container size to match content
  eventsListContainer.Size = new UDim2(
    1,
    0,
    0,
    eventsLayout.AbsoluteContentSize.Y
  );
}

// Update events UI every second to refresh countdown
task.spawn(() => {
  while (true) {
    task.wait(1);
    if (eventsFrame.Visible) {
      updateEventsUI();
    }
  }
});

// Listen for event updates
EventUpdate.OnClientEvent.Connect(
  (
    events: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      startTime: number;
      endTime: number;
    }>
  ) => {
    // Check for new events
    const previousEventIds = activeEvents.map((e) => e.id);
    const newEventIds = events.map((e) => e.id);

    // Find newly started events
    for (const event of events) {
      if (!previousEventIds.includes(event.id)) {
        showEventNotification(
          event.id,
          event.name,
          event.description,
          event.icon
        );
      }
    }

    activeEvents = events;
    updateEventsUI();
  }
);

// Settings and Friends UI removed - buttons don't work

// Menu toggle button handler (will be connected after all frames are created)
// Note: rebirthFrame doesn't exist as a separate frame - rebirth button is directly on screenGui

// Modal buttons removed - everything is on screen now

// No longer needed - using simple Frame instead of ScrollingFrame

// No longer needed - using simple Frame instead of ScrollingFrame

// Ensure screenGui is visible
screenGui.Enabled = true;

print("[Client] Currency UI initialized");
print(`[Client] ScreenGui enabled: ${screenGui.Enabled}`);
print(`[Client] ScreenGui parent: ${screenGui.Parent?.Name}`);
print(`[Client] ScreenGui children count: ${screenGui.GetChildren().size()}`);
print(`[Client] Currency frame visible: ${currencyFrame.Visible}`);
print(`[Client] Currency frame parent: ${currencyFrame.Parent?.Name}`);
print(`[Client] Menu toggle visible: ${menuToggleButton.Visible}`);
print(`[Client] Menu toggle parent: ${menuToggleButton.Parent?.Name}`);

/**
 * Format large numbers (always abbreviated format)
 */
function formatNumber(num: number): string {
  if (num >= 1000000000000) {
    return `${math.floor((num / 1000000000000) * 100) / 100}T`;
  } else if (num >= 1000000000) {
    return `${math.floor((num / 1000000000) * 100) / 100}B`;
  } else if (num >= 1000000) {
    return `${math.floor((num / 1000000) * 100) / 100}M`;
  } else if (num >= 1000) {
    return `${math.floor((num / 1000) * 100) / 100}K`;
  }
  return tostring(math.floor(num));
}
