import { ReplicatedStorage } from "@rbxts/services";

// Create RemoteEvents folder
let remoteFolder = ReplicatedStorage.FindFirstChild("RemoteEvents") as Folder;
if (!remoteFolder) {
	remoteFolder = new Instance("Folder");
	remoteFolder.Name = "RemoteEvents";
	remoteFolder.Parent = ReplicatedStorage;
}

// Currency update event (server -> client)
const CurrencyUpdate = new Instance("RemoteEvent");
CurrencyUpdate.Name = "CurrencyUpdate";
CurrencyUpdate.Parent = remoteFolder;

// Rebirth request event (client -> server)
const RebirthRequest = new Instance("RemoteEvent");
RebirthRequest.Name = "RebirthRequest";
RebirthRequest.Parent = remoteFolder;

// Rebirth response event (server -> client)
const RebirthResponse = new Instance("RemoteEvent");
RebirthResponse.Name = "RebirthResponse";
RebirthResponse.Parent = remoteFolder;

// Rebirth count update event (server -> client)
const RebirthCountUpdate = new Instance("RemoteEvent");
RebirthCountUpdate.Name = "RebirthCountUpdate";
RebirthCountUpdate.Parent = remoteFolder;

// Upgrade purchase request (client -> server)
const UpgradePurchaseRequest = new Instance("RemoteEvent");
UpgradePurchaseRequest.Name = "UpgradePurchaseRequest";
UpgradePurchaseRequest.Parent = remoteFolder;

// Upgrade purchase response (server -> client)
const UpgradePurchaseResponse = new Instance("RemoteEvent");
UpgradePurchaseResponse.Name = "UpgradePurchaseResponse";
UpgradePurchaseResponse.Parent = remoteFolder;

// Zone unlock request (client -> server)
const ZoneUnlockRequest = new Instance("RemoteEvent");
ZoneUnlockRequest.Name = "ZoneUnlockRequest";
ZoneUnlockRequest.Parent = remoteFolder;

// Zone unlock response (server -> client)
const ZoneUnlockResponse = new Instance("RemoteEvent");
ZoneUnlockResponse.Name = "ZoneUnlockResponse";
ZoneUnlockResponse.Parent = remoteFolder;

// Player data update (server -> client) - sends all upgrade/zone data
const PlayerDataUpdate = new Instance("RemoteEvent");
PlayerDataUpdate.Name = "PlayerDataUpdate";
PlayerDataUpdate.Parent = remoteFolder;

export { CurrencyUpdate, RebirthRequest, RebirthResponse, RebirthCountUpdate, UpgradePurchaseRequest, UpgradePurchaseResponse, ZoneUnlockRequest, ZoneUnlockResponse, PlayerDataUpdate };

