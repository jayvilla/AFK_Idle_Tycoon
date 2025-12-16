import { Workspace } from "@rbxts/services";

const part = new Instance("Part");
part.Name = "CURSOR_CONNECTION_TEST";
part.Size = new Vector3(8, 1, 8);
part.Position = new Vector3(0, 5, 0);
part.Anchored = true;
part.BrickColor = new BrickColor(119); // Bright green
part.Parent = Workspace;

print("✅ Cursor → AFK Tycoon connection confirmed");
