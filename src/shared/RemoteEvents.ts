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

export { CurrencyUpdate };

