import { Players, ReplicatedStorage } from "@rbxts/services";

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
