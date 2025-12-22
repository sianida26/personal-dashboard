import Dexie, { type Table } from "dexie";

export interface ThemePreference {
	id: string;
	themeMode: "light" | "dark" | "system";
	colorScheme: "default" | "blue" | "purple" | "green" | "orange" | "red";
	updatedAt: number;
}

export class ThemeDB extends Dexie {
	theme!: Table<ThemePreference, string>;

	constructor() {
		super("ThemeDB");
		this.version(1).stores({
			theme: "id",
		});
	}
}

export const themeDB = new ThemeDB();
