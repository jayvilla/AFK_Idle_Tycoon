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

// AFK reward claim request (client -> server)
const AFKRewardClaimRequest = new Instance("RemoteEvent");
AFKRewardClaimRequest.Name = "AFKRewardClaimRequest";
AFKRewardClaimRequest.Parent = remoteFolder;

// AFK reward claim response (server -> client)
const AFKRewardClaimResponse = new Instance("RemoteEvent");
AFKRewardClaimResponse.Name = "AFKRewardClaimResponse";
AFKRewardClaimResponse.Parent = remoteFolder;

// Daily login reward claim request (client -> server)
const DailyLoginClaimRequest = new Instance("RemoteEvent");
DailyLoginClaimRequest.Name = "DailyLoginClaimRequest";
DailyLoginClaimRequest.Parent = remoteFolder;

// Daily login reward claim response (server -> client)
const DailyLoginClaimResponse = new Instance("RemoteEvent");
DailyLoginClaimResponse.Name = "DailyLoginClaimResponse";
DailyLoginClaimResponse.Parent = remoteFolder;

// Leaderboard request (client -> server)
const LeaderboardRequest = new Instance("RemoteEvent");
LeaderboardRequest.Name = "LeaderboardRequest";
LeaderboardRequest.Parent = remoteFolder;

// Leaderboard response (server -> client)
const LeaderboardResponse = new Instance("RemoteEvent");
LeaderboardResponse.Name = "LeaderboardResponse";
LeaderboardResponse.Parent = remoteFolder;

// Achievement unlock notification (server -> client)
const AchievementUnlocked = new Instance("RemoteEvent");
AchievementUnlocked.Name = "AchievementUnlocked";
AchievementUnlocked.Parent = remoteFolder;

// Achievements update (server -> client)
const AchievementsUpdate = new Instance("RemoteEvent");
AchievementsUpdate.Name = "AchievementsUpdate";
AchievementsUpdate.Parent = remoteFolder;

// Achievement progress update (server -> client) - sends progress data for all achievements
const AchievementProgressUpdate = new Instance("RemoteEvent");
AchievementProgressUpdate.Name = "AchievementProgressUpdate";
AchievementProgressUpdate.Parent = remoteFolder;

// Event update (server -> client) - sends active events
const EventUpdate = new Instance("RemoteEvent");
EventUpdate.Name = "EventUpdate";
EventUpdate.Parent = remoteFolder;

// Admin event activation (client -> server) - for testing/admin purposes
// WARNING: In production, add proper admin authentication!
const AdminActivateEvent = new Instance("RemoteEvent");
AdminActivateEvent.Name = "AdminActivateEvent";
AdminActivateEvent.Parent = remoteFolder;

// Settings update (client -> server)
const SettingsUpdateRequest = new Instance("RemoteEvent");
SettingsUpdateRequest.Name = "SettingsUpdateRequest";
SettingsUpdateRequest.Parent = remoteFolder;

// Settings update response (server -> client)
const SettingsUpdateResponse = new Instance("RemoteEvent");
SettingsUpdateResponse.Name = "SettingsUpdateResponse";
SettingsUpdateResponse.Parent = remoteFolder;

// Friends request (client -> server) - get friends' progress
const FriendsRequest = new Instance("RemoteEvent");
FriendsRequest.Name = "FriendsRequest";
FriendsRequest.Parent = remoteFolder;

// Friends response (server -> client)
const FriendsResponse = new Instance("RemoteEvent");
FriendsResponse.Name = "FriendsResponse";
FriendsResponse.Parent = remoteFolder;

export { CurrencyUpdate, RebirthRequest, RebirthResponse, RebirthCountUpdate, UpgradePurchaseRequest, UpgradePurchaseResponse, ZoneUnlockRequest, ZoneUnlockResponse, PlayerDataUpdate, AFKRewardClaimRequest, AFKRewardClaimResponse, DailyLoginClaimRequest, DailyLoginClaimResponse, LeaderboardRequest, LeaderboardResponse, AchievementUnlocked, AchievementsUpdate, AchievementProgressUpdate, EventUpdate, AdminActivateEvent, SettingsUpdateRequest, SettingsUpdateResponse, FriendsRequest, FriendsResponse };

