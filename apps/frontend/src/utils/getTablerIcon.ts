import type { IconType } from "react-icons";
// src/utils/getTablerIcon.tsx
import * as TbIcons from "react-icons/tb";

export const getTablerIcon = (iconName: string): IconType | null => {
	return (TbIcons as Record<string, IconType>)[iconName] || null;
};
