import { Players } from "@rbxts/services";
import { CurrencyUpdate } from "../shared/RemoteEvents";

// Get the local player
const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

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

// Listen for currency updates from server
CurrencyUpdate.OnClientEvent.Connect((newCurrency: number) => {
	currencyLabel.Text = `💰 $${formatNumber(newCurrency)}`;
});

print("[Client] Currency UI initialized");

/**
 * Format large numbers (e.g., 1000 -> "1K", 1000000 -> "1M")
 */
function formatNumber(num: number): string {
	if (num >= 1000000000) {
		return `${math.floor(num / 1000000000 * 100) / 100}B`;
	} else if (num >= 1000000) {
		return `${math.floor(num / 1000000 * 100) / 100}M`;
	} else if (num >= 1000) {
		return `${math.floor(num / 1000 * 100) / 100}K`;
	}
	return tostring(math.floor(num));
}

