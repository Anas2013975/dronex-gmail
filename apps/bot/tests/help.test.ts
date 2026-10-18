import { describe, expect, it } from "vitest";
import { CATEGORIES, COMMANDS, visibleCategories, visibleCommands } from "@dronex/shared";
import { handlers } from "../src/commands";
import { buildSlashDefinitions } from "../src/register";
import { buildHelpMessage } from "../src/help/buildHelp";

const all = () => true;
const none = () => false;
const flat = (m: ReturnType<typeof buildHelpMessage>) => JSON.stringify(m.components.map((c) => c.toJSON()));

describe("command metadata stays in sync", () => {
  it("every enabled slash command has a handler and vice versa", () => {
    const names = COMMANDS.filter((c) => c.type === "slash" && c.enabled).map((c) => c.name).sort();
    expect(Object.keys(handlers).sort()).toEqual(names);
  });
  it("slash registration is generated from the registry", () => {
    expect(buildSlashDefinitions().map((d) => d.name).sort()).toEqual(Object.keys(handlers).sort());
  });
  it("command names are unique and categories valid", () => {
    expect(new Set(COMMANDS.map((c) => c.name)).size).toBe(COMMANDS.length);
    for (const c of COMMANDS) expect(CATEGORIES[c.category]).toBeDefined();
  });
});

describe("/help rendering", () => {
  it("home menu lists exactly the categories that contain visible commands", () => {
    const json = flat(buildHelpMessage({ guildName: "S", pingMs: 5, canUse: all }));
    for (const k of visibleCategories(COMMANDS, all)) expect(json).toContain(`"value":"${k}"`);
    expect(json).not.toContain('"value":"moderation"'); // no moderation commands exist yet
  });
  it("hides permissioned commands from users without permission", () => {
    expect(visibleCommands(COMMANDS, none).map((c) => c.name)).toEqual(["help"]);
    const json = flat(buildHelpMessage({ guildName: "S", pingMs: 5, canUse: none }, "auth"));
    expect(json).not.toContain("/key");
    expect(json).toContain("لا توجد أوامر");
  });
  it("category view shows usage, permission and a working return button", () => {
    const json = flat(buildHelpMessage({ guildName: "S", pingMs: 5, canUse: all }, "auth"));
    expect(json).toContain("/key");
    expect(json).toContain("Manage Server");
    expect(json).toContain("help:home");
  });
  it("is ephemeral and uses Components V2", () => {
    const m = buildHelpMessage({ guildName: "S", pingMs: 5, canUse: all });
    expect(m.flags & 64).toBe(64);
    expect(m.flags & 32768).toBe(32768);
  });
});
