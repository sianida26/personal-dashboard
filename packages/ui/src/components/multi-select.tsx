import { X } from "lucide-react";

import { Badge } from "./badge";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "./command";
import { cn } from "../utils";
import { Command as CommandPrimitive } from "cmdk";
import type React from "react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { LuCheck, LuChevronsUpDown } from "react-icons/lu";
import { Label } from "./label";

export type BaseFieldProps = {
	id?: string;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	readOnly?: boolean;
	error?: React.ReactNode;
};

type Option = { label: string; value: string } | string;
export type MultiSelectProps = {
	placeholder?: string;
	options: Option[];
	selectedOptions: string[];
	allowCreate?: boolean;
	onChange?: (options: string[]) => void;
	onValueChange?: (value: string) => void;
} & BaseFieldProps;

export function MultiSelect({
	placeholder,
	options,
	selectedOptions,
	onChange,
	onValueChange,
	allowCreate,
	label,
	readOnly,
	error,
}: MultiSelectProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");

	const handleUnselect = useCallback(
		(value: string) => {
			const _selectedOptions = selectedOptions.filter((s) => s !== value);
			onChange?.(_selectedOptions);
		},
		[selectedOptions, onChange],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (input) {
				if (e.key === "Delete" || e.key === "Backspace") {
					if (input.value === "") {
						onChange?.([...selectedOptions.slice(0, -1)]);
					}
				}
				if (e.key === "Escape") {
					input.blur();
				}
			}
		},
		[selectedOptions, onChange],
	);

	const handleSelect = useCallback(
		(value: string) => {
			const existingOption = selectedOptions.includes(value);
			let _selectedOptions: string[];

			if (existingOption) {
				_selectedOptions = selectedOptions.filter((x) => x !== value);
			} else {
				_selectedOptions = [...selectedOptions, value];
			}
			setInputValue("");
			onChange?.(_selectedOptions);
		},
		[selectedOptions, onChange],
	);

	return (
		<Command
			onKeyDown={handleKeyDown}
			className={cn(
				"overflow-visible bg-transparent pt-2 flex flex-col gap-1 h-min",
				readOnly ? "cursor-not-allowed bg-gray-200" : "",
			)}
		>
			{typeof label === "string" ? <Label>{label}</Label> : label}
			<div
				className={cn(
					"group rounded-md px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 relative bg-background",
					error ? "border border-destructive" : "border border-input",
				)}
			>
				<div className="absolute right-2 top-1/2 -translate-y-1/2">
					<LuChevronsUpDown className="text-muted-foreground" />
				</div>
				<div className="flex flex-wrap gap-1">
					{selectedOptions.map((value) => {
						const option = options.find((opt) => {
							if (typeof opt === "string") return opt === value;
							return opt.value === value;
						});
						const label =
							typeof option === "string"
								? option
								: option?.label || value;

						return (
							<Badge
								key={value}
								variant="secondary"
								className={cn(
									readOnly
										? "cursor-not-allowed opacity-50"
										: "",
								)}
							>
								{label}
								{!readOnly && (
									<button
										type="button"
										className="ml-1 rounded-full outline-hidden ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleUnselect(value);
											}
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										onClick={() => handleUnselect(value)}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</button>
								)}
							</Badge>
						);
					})}
					<CommandPrimitive.Input
						ref={inputRef}
						value={inputValue}
						readOnly={readOnly}
						onValueChange={(v) => {
							setInputValue(v);
							onValueChange?.(v);
						}}
						onBlur={() => setOpen(false)}
						onFocus={() => (readOnly ? undefined : setOpen(true))}
						placeholder={selectedOptions.length ? "" : placeholder}
						className="ml-2 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"
						onKeyDown={(e) => {
							if (
								e.key === "Enter" &&
								inputValue &&
								allowCreate
							) {
								handleSelect(inputValue);
							}
						}}
					/>
				</div>
			</div>
			{error && <p className="mt-1 text-sm text-destructive">{error}</p>}
			<div className="relative">
				<CommandList>
					{open && options.length > 0 ? (
						<div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden animate-in">
							<CommandGroup className="overflow-auto">
								{options.map((option) => {
									const value =
										typeof option === "string"
											? option
											: option.value;
									const label =
										typeof option === "string"
											? option
											: option.label;

									return (
										<CommandItem
											key={value}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onSelect={() => {
												setInputValue("");
												handleSelect(value);
											}}
											className="cursor-pointer"
										>
											<LuCheck
												className={cn(
													"h-3 w-3",
													selectedOptions.includes(
														value,
													)
														? "text-primary mr-2"
														: "hidden",
												)}
											/>
											{label}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</div>
					) : null}
				</CommandList>
			</div>
		</Command>
	);
}

export default MultiSelect;
