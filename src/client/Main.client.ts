import {
  Players,
  ReplicatedStorage,
  MarketplaceService,
} from "@rbxts/services";
import { GAMEPASS_IDS, PRODUCT_IDS } from "../shared/MonetizationConfig";

// Get the local player
const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// Wait for RemoteEvents to be created by server
const remoteEventsFolder = ReplicatedStorage.WaitForChild(
  "RemoteEvents"
) as Folder;
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

// Create ScreenGui for UI
const screenGui = new Instance("ScreenGui");
screenGui.Name = "CurrencyUI";
screenGui.ResetOnSpawn = false;
screenGui.Parent = playerGui;

// Create currency display frame
const currencyFrame = new Instance("Frame");
currencyFrame.Name = "CurrencyFrame";
currencyFrame.Size = new UDim2(0, 300, 0, 60);
currencyFrame.Position = new UDim2(0, 20, 0, 20);
currencyFrame.BackgroundColor3 = new Color3(0.1, 0.1, 0.1);
currencyFrame.BorderSizePixel = 0;
currencyFrame.Parent = screenGui;

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
rebirthCountLabel.Position = new UDim2(0, 20, 0, 150);
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

// Create upgrades/scrolling frame
const upgradesFrame = new Instance("ScrollingFrame");
upgradesFrame.Name = "UpgradesFrame";
upgradesFrame.Size = new UDim2(0, 350, 0, 400);
upgradesFrame.Position = new UDim2(1, -370, 0, 20);
upgradesFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
upgradesFrame.BorderSizePixel = 0;
upgradesFrame.ScrollBarThickness = 8;
upgradesFrame.CanvasSize = new UDim2(0, 0, 0, 0);
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

  // Update canvas size
  upgradesFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    upgradesLayout.AbsoluteContentSize.Y
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

  // Update canvas size
  upgradesFrame.CanvasSize = new UDim2(
    0,
    0,
    0,
    upgradesLayout.AbsoluteContentSize.Y
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

// Gamepass UI
const gamepassFrame = new Instance("Frame");
gamepassFrame.Name = "GamepassFrame";
gamepassFrame.Size = new UDim2(0, 200, 0, 200);
gamepassFrame.Position = new UDim2(0, 20, 0, 200);
gamepassFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
gamepassFrame.BorderSizePixel = 0;
gamepassFrame.Parent = screenGui;

const gamepassCorner = new Instance("UICorner");
gamepassCorner.CornerRadius = new UDim(0, 8);
gamepassCorner.Parent = gamepassFrame;

const gamepassTitle = new Instance("TextLabel");
gamepassTitle.Name = "Title";
gamepassTitle.Size = new UDim2(1, 0, 0, 30);
gamepassTitle.BackgroundTransparency = 1;
gamepassTitle.Text = "Gamepasses";
gamepassTitle.TextColor3 = new Color3(1, 1, 1);
gamepassTitle.TextSize = 18;
gamepassTitle.Font = Enum.Font.GothamBold;
gamepassTitle.Parent = gamepassFrame;

const gamepassList = new Instance("Frame");
gamepassList.Name = "GamepassList";
gamepassList.Size = new UDim2(1, -10, 1, -35);
gamepassList.Position = new UDim2(0, 5, 0, 35);
gamepassList.BackgroundTransparency = 1;
gamepassList.Parent = gamepassFrame;

const gamepassLayout = new Instance("UIListLayout");
gamepassLayout.Padding = new UDim(0, 5);
gamepassLayout.SortOrder = Enum.SortOrder.LayoutOrder;
gamepassLayout.Parent = gamepassList;

// Gamepass buttons
const doubleCashButton = new Instance("TextButton");
doubleCashButton.Name = "DoubleCash";
doubleCashButton.Size = new UDim2(1, 0, 0, 40);
doubleCashButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
doubleCashButton.BorderSizePixel = 0;
doubleCashButton.Text = "2× Cash";
doubleCashButton.TextColor3 = new Color3(1, 1, 1);
doubleCashButton.TextSize = 14;
doubleCashButton.Font = Enum.Font.Gotham;
doubleCashButton.Parent = gamepassList;

const autoCollectButton = new Instance("TextButton");
autoCollectButton.Name = "AutoCollect";
autoCollectButton.Size = new UDim2(1, 0, 0, 40);
autoCollectButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
autoCollectButton.BorderSizePixel = 0;
autoCollectButton.Text = "Auto Collect";
autoCollectButton.TextColor3 = new Color3(1, 1, 1);
autoCollectButton.TextSize = 14;
autoCollectButton.Font = Enum.Font.Gotham;
autoCollectButton.Parent = gamepassList;

const vipButton = new Instance("TextButton");
vipButton.Name = "VIP";
vipButton.Size = new UDim2(1, 0, 0, 40);
vipButton.BackgroundColor3 = new Color3(0.3, 0.3, 0.3);
vipButton.BorderSizePixel = 0;
vipButton.Text = "VIP Zone";
vipButton.TextColor3 = new Color3(1, 1, 1);
vipButton.TextSize = 14;
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

// Developer Products UI
const productsFrame = new Instance("Frame");
productsFrame.Name = "ProductsFrame";
productsFrame.Size = new UDim2(0, 200, 0, 150);
productsFrame.Position = new UDim2(0, 20, 0, 410);
productsFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
productsFrame.BorderSizePixel = 0;
productsFrame.Parent = screenGui;

const productsCorner = new Instance("UICorner");
productsCorner.CornerRadius = new UDim(0, 8);
productsCorner.Parent = productsFrame;

const productsTitle = new Instance("TextLabel");
productsTitle.Name = "Title";
productsTitle.Size = new UDim2(1, 0, 0, 25);
productsTitle.BackgroundTransparency = 1;
productsTitle.Text = "Products";
productsTitle.TextColor3 = new Color3(1, 1, 1);
productsTitle.TextSize = 16;
productsTitle.Font = Enum.Font.GothamBold;
productsTitle.Parent = productsFrame;

const productsList = new Instance("Frame");
productsList.Name = "ProductsList";
productsList.Size = new UDim2(1, -10, 1, -30);
productsList.Position = new UDim2(0, 5, 0, 28);
productsList.BackgroundTransparency = 1;
productsList.Parent = productsFrame;

const productsLayout = new Instance("UIListLayout");
productsLayout.Padding = new UDim(0, 5);
productsLayout.SortOrder = Enum.SortOrder.LayoutOrder;
productsLayout.Parent = productsList;

// Product buttons
const boost2xButton = new Instance("TextButton");
boost2xButton.Name = "Boost2X";
boost2xButton.Size = new UDim2(1, 0, 0, 35);
boost2xButton.BackgroundColor3 = new Color3(0.3, 0.5, 0.3);
boost2xButton.BorderSizePixel = 0;
boost2xButton.Text = "2× Boost (1h)";
boost2xButton.TextColor3 = new Color3(1, 1, 1);
boost2xButton.TextSize = 13;
boost2xButton.Font = Enum.Font.Gotham;
boost2xButton.Parent = productsList;

const boost5xButton = new Instance("TextButton");
boost5xButton.Name = "Boost5X";
boost5xButton.Size = new UDim2(1, 0, 0, 35);
boost5xButton.BackgroundColor3 = new Color3(0.5, 0.3, 0.3);
boost5xButton.BorderSizePixel = 0;
boost5xButton.Text = "5× Boost (1h)";
boost5xButton.TextColor3 = new Color3(1, 1, 1);
boost5xButton.TextSize = 13;
boost5xButton.Font = Enum.Font.Gotham;
boost5xButton.Parent = productsList;

const rebirthSkipButton = new Instance("TextButton");
rebirthSkipButton.Name = "RebirthSkip";
rebirthSkipButton.Size = new UDim2(1, 0, 0, 35);
rebirthSkipButton.BackgroundColor3 = new Color3(0.4, 0.3, 0.5);
rebirthSkipButton.BorderSizePixel = 0;
rebirthSkipButton.Text = "Rebirth Skip";
rebirthSkipButton.TextColor3 = new Color3(1, 1, 1);
rebirthSkipButton.TextSize = 13;
rebirthSkipButton.Font = Enum.Font.Gotham;
rebirthSkipButton.Parent = productsList;

// Add corners to product buttons
[boost2xButton, boost5xButton, rebirthSkipButton].forEach((btn) => {
  const corner = new Instance("UICorner");
  corner.CornerRadius = new UDim(0, 6);
  corner.Parent = btn;
});

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

// Boost display
const boostDisplayFrame = new Instance("Frame");
boostDisplayFrame.Name = "BoostDisplay";
boostDisplayFrame.Size = new UDim2(0, 200, 0, 80);
boostDisplayFrame.Position = new UDim2(0, 20, 0, 570);
boostDisplayFrame.BackgroundColor3 = new Color3(0.15, 0.15, 0.15);
boostDisplayFrame.BorderSizePixel = 0;
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
    updateBoostDisplay();
  }
);

print("[Client] Currency UI initialized");

/**
 * Format large numbers (e.g., 1000 -> "1K", 1000000 -> "1M")
 */
function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `${math.floor((num / 1000000000) * 100) / 100}B`;
  } else if (num >= 1000000) {
    return `${math.floor((num / 1000000) * 100) / 100}M`;
  } else if (num >= 1000) {
    return `${math.floor((num / 1000) * 100) / 100}K`;
  }
  return tostring(math.floor(num));
}
