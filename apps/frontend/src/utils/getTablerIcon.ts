// src/utils/getTablerIcon.tsx
import * as TbIcons from "react-icons/tb";
import { IconType } from "react-icons";

export const getTablerIcon = (iconName: string): IconType | null => {
	return (TbIcons as Record<string, IconType>)[iconName] || null;
};
