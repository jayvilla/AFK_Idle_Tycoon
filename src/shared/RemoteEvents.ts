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

export { CurrencyUpdate, RebirthRequest, RebirthResponse, RebirthCountUpdate };

