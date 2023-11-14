import type { Moment } from "moment";
import { TFile, TFolder, Vault, normalizePath } from "obsidian";
import { basename } from "path";

export const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
export type IGranularity = "day" | "week" | "month" | "quarter" | "year";

export class DailyNotesFolderMissingError extends Error {}

function removeEscapedCharacters(format: string): string {
  return format.replace(/\[[^\]]*\]/g, ""); // remove everything within brackets
}

/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week dateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isFormatAmbiguous(format: string, granularity: IGranularity) {
  if (granularity === "week") {
    const cleanFormat = removeEscapedCharacters(format);
    return (
      /w{1,2}/i.test(cleanFormat) &&
      (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat))
    );
  }
  return false;
}

export function getDateFromFile(
	file: TFile,
	granularity: IGranularity
): Moment | null {
	return getDateFromFilename(file.basename, granularity);
}

export function getDateFromPath(
	path: string,
	granularity: IGranularity
): Moment | null {
	return getDateFromFilename(basename(path), granularity);
}

function getDateFromFilename(
	filename: string,
	granularity: IGranularity
): Moment | null {
	const getSettings = {
		day: getDailyNoteSettings,
	};

	const format = getSettings[granularity]().format.split("/").pop();
	const noteDate = window.moment(filename, format, true);

	if (!noteDate.isValid()) {
		return null;
	}

	if (isFormatAmbiguous(format, granularity)) {
		if (granularity === "week") {
			const cleanFormat = removeEscapedCharacters(format);
			if (/w{1,2}/i.test(cleanFormat)) {
				return window.moment(
					filename,
					// If format contains week, remove day & month formatting
					format.replace(/M{1,4}/g, "").replace(/D{1,4}/g, ""),
					false
				);
			}
		}
	}

	return noteDate;
}

export function getAllDailyNotes(): Record<string, TFile> {
	/**
	 * Find all daily notes in the daily note folder
	 */
	const { vault } = window.app;
	const { folder } = getDailyNoteSettings();

	const dailyNotesFolder = vault.getAbstractFileByPath(
		normalizePath(folder)
	) as TFolder;

	if (!dailyNotesFolder) {
		throw new DailyNotesFolderMissingError(
			"Failed to find daily notes folder"
		);
	}

	const dailyNotes: Record<string, TFile> = {};
	Vault.recurseChildren(dailyNotesFolder, (note) => {
		if (note instanceof TFile) {
			const date = getDateFromFile(note, "day");
			if (date) {
				const dateString = getDateUID(date, "day");
				dailyNotes[dateString] = note;
			}
		}
	});

	return dailyNotes;
}

export interface IPeriodicNoteSettings {
	folder?: string;
	format?: string;
	template?: string;
}

/**
 * dateUID is a way of weekly identifying daily/weekly/monthly notes.
 * They are prefixed with the granularity to avoid ambiguity.
 */
export function getDateUID(
	date: Moment,
	granularity: IGranularity = "day"
): string {
	const ts = date.clone().startOf(granularity).format();
	return `${granularity}-${ts}`;
}

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(): IPeriodicNoteSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { internalPlugins, plugins } = <any>window.app;

	if (shouldUsePeriodicNotesSettings("daily")) {
		const { format, folder, template } =
			plugins.getPlugin("periodic-notes")?.settings?.daily || {};
		return {
			format: format || DEFAULT_DAILY_NOTE_FORMAT,
			folder: folder?.trim() || "",
			template: template?.trim() || "",
		};
	}

	const { folder, format, template } =
		internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
	return {
		format: format || DEFAULT_DAILY_NOTE_FORMAT,
		folder: folder?.trim() || "",
		template: template?.trim() || "",
	};
}

export function shouldUsePeriodicNotesSettings(
	periodicity: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const periodicNotes = (<any>window.app).plugins.getPlugin("periodic-notes");
	return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}

export function getDailyNote(
	date: Moment,
	dailyNotes: Record<string, TFile>
): TFile {
	return dailyNotes[getDateUID(date, "day")] ?? null;
}
