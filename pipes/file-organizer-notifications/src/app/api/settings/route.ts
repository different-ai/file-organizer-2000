// app/api/settings/route.ts
import { pipe } from "@screenpipe/js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

interface NamespaceSettings {
  [key: string]: any;
}

interface Settings {
  [namespace: string]: NamespaceSettings;
}
// Force Node.js runtime
export const runtime = "nodejs"; // Add this line
export const dynamic = "force-dynamic";

const DEFAULT_INTERVAL_MINUTES = 5;

function getAppDataDir(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, ".screenpipe");
}

async function updateCronSchedule(intervalMinutes: number) {
  try {
    const screenpipeDir = process.env.SCREENPIPE_DIR || getAppDataDir();
    const pipeConfigPath = path.join(
      screenpipeDir,
      "pipes",
      "obsidian",
      "pipe.json"
    );

    console.log(`updating cron schedule at: ${pipeConfigPath}`);

    // Load or initialize both configs
    let config: any = {};

    try {
      const content = await fs.readFile(pipeConfigPath, "utf8");
      config = JSON.parse(content);
    } catch (err) {
      console.log(
        `no existing config found, creating new one at ${pipeConfigPath}`
      );
      config = { crons: [] };
    }

    // Update cron config
    config.crons = [
      {
        path: "/api/log",
        schedule: `0 */${intervalMinutes} * * * *`,
      },
      {
        path: "/api/intelligence",
        schedule: "0 0 */1 * * *",
      },
    ];
    config.enabled = config.enabled ?? true;
    config.is_nextjs = config.is_nextjs ?? true;

    await fs.writeFile(pipeConfigPath, JSON.stringify(config, null, 2));
    console.log(
      `updated cron schedule to run every ${intervalMinutes} minutes`
    );
  } catch (err) {
    console.error("failed to update cron schedule:", err);
    throw err;
  }
}

export async function GET() {
  try {
    const settingsManager = pipe.settings;
    if (!settingsManager) {
      throw new Error("settingsManager not found");
    }

    // Load persisted settings if they exist
    const screenpipeDir = process.env.SCREENPIPE_DIR || getAppDataDir();
    const settingsPath = path.join(
      screenpipeDir,
      "pipes",
      "obsidian",
      "settings.json"
    );

    try {
      const settingsContent = await fs.readFile(settingsPath, "utf8");
      const persistedSettings = JSON.parse(settingsContent);

      // Get obsidian namespace settings
      const obsidianSettings = await settingsManager.getNamespaceSettings("obsidian") || {};
      return new Response(JSON.stringify({
        customSettings: {
          obsidian: {
            ...obsidianSettings,
            ...persistedSettings,
          },
        },
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      // If no persisted settings, return just namespace settings
      const obsidianSettings = await settingsManager.getNamespaceSettings("obsidian") || {};
      return new Response(JSON.stringify({
        customSettings: {
          obsidian: obsidianSettings
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("failed to get settings:", error);
    return new Response(
      JSON.stringify({ error: "failed to get settings" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value, isPartialUpdate, reset, namespace } = body;

    // Get settings file path
    const screenpipeDir = process.env.SCREENPIPE_DIR || getAppDataDir();
    const settingsPath = path.join(
      screenpipeDir,
      "pipes",
      "obsidian",
      "settings.json"
    );

    // Handle obsidian namespace updates
    if (namespace === "obsidian" && isPartialUpdate) {
      // Use provided interval or default
      const intervalMs = value.interval || DEFAULT_INTERVAL_MINUTES * 60000;
      const intervalMinutes = Math.max(1, Math.floor(intervalMs / 60000));
      await updateCronSchedule(intervalMinutes);
      console.log(`setting interval to ${intervalMinutes} minutes`);
    }

    // Load current settings
    let settings: Settings = {};
    try {
      const content = await fs.readFile(settingsPath, "utf8");
      settings = JSON.parse(content) as Settings;
    } catch (err) {
      console.log("No existing settings found, creating new file");
    }

    if (reset) {
      if (namespace) {
        if (key) {
          // Reset single key in namespace
          const namespaceSettings = settings[namespace] || {};
          const { [key]: _, ...rest } = namespaceSettings;
          settings[namespace] = rest;
        } else {
          // Reset entire namespace
          settings[namespace] = {};
        }
      }
    } else if (namespace) {
      if (isPartialUpdate) {
        // Update namespace with merged settings
        settings[namespace] = {
          ...(settings[namespace] || {}),
          ...value,
        };
      } else {
        // Update single key in namespace
        settings[namespace] = {
          ...(settings[namespace] || {}),
          [key]: value,
        };
      }
    }

    // Save settings to file
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("failed to update settings:", error);
    return new Response(
      JSON.stringify({ error: "failed to update settings" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
