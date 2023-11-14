// credits to https://github.com/liamcain/obsidian-daily-notes-interface
// whom I copied this code from
import type { Moment } from "moment";
import { TFile, TFolder, Vault, normalizePath } from "obsidian";

export const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
export type IGranularity = "day" | "week" | "month" | "quarter" | "year";

export class DailyNotesFolderMissingError extends Error {}

export function getDateFromFile(
	file: TFile,
	granularity: IGranularity
): Moment | null {
	return getDateFromFilename(file.basename, granularity);
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

	return noteDate;
}

export function getAllDailyNotes(): Record<string, TFile> {
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
- * dateUID is a way of weekly identifying daily/weekly/mont
hly notes.
- * They are prefixed with the granularity to avoid ambiguit
y.
- */
export function getDateUID(
	date: Moment,
	granularity: IGranularity = "day"
): string {
	const ts = date.clone().startOf(granularity).format();
	return `${granularity}-${ts}`;
}

/**
- * Read the user settings for the `daily-notes` plugin
- * to keep behavior of creating a new note in-sync.
- */
export function getDailyNoteSettings(): IPeriodicNoteSettings {
	const { internalPlugins } = <any>window.app;

	const { folder, format, template } =
		internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
	return {
		format: format || DEFAULT_DAILY_NOTE_FORMAT,
		folder: folder?.trim() || "",
		template: template?.trim() || "",
	};
}

export function getDailyNote(
	date: Moment,
	dailyNotes: Record<string, TFile>
): TFile {
	return dailyNotes[getDateUID(date, "day")] ?? null;
}
