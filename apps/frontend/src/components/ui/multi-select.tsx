import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { LuCheck, LuChevronsUpDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import React, { KeyboardEvent, useCallback, useRef, useState } from "react";
import { Label } from "./label";

export type BaseFieldProps = {
	id?: string;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	readOnly?: boolean;
	error?: React.ReactNode;
};

type Option = { label: string; value: string };
export type MultiSelectProps = {
	placeholder?: string;
	options: Option[];
	selectedOptions: Option["value"][];
	allowCreate?: boolean;
	onChange: (options: Option["value"][]) => void;
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
		(option: Option) => {
			const _selectedOptions = [
				...selectedOptions.filter((s) => s !== option.value),
			];
			onChange(_selectedOptions);
		},
		[selectedOptions, onChange]
	); // Add selected and onChange as dependencies

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (input) {
				if (e.key === "Delete" || e.key === "Backspace") {
					if (input.value === "") {
						onChange([...selectedOptions.slice(0, -1)]);
					}
				}
				if (e.key === "Escape") {
					input.blur();
				}
			}
		},
		[selectedOptions, onChange]
	);

	const handleSelect = useCallback(
		(value: string) => {
			const existingOption = selectedOptions.find(
				(option) => option === value
			);

			let _selectedOptions = [];

			if (existingOption) {
				_selectedOptions = selectedOptions.filter((x) => x !== value);
			} else {
				const newOption = { label: value, value };
				_selectedOptions = [...selectedOptions, newOption.value];
			}
			setInputValue("");
			onChange(_selectedOptions);
		},
		[selectedOptions, onChange]
	);

	return (
		<Command
			onKeyDown={handleKeyDown}
			className={cn(
				"overflow-visible bg-transparent pt-2 flex flex-col gap-1 h-min",
				readOnly ? "cursor-not-allowed bg-gray-200" : ""
			)}
		>
			{typeof label === "string" ? <Label>{label}</Label> : label}
			<div
				className={cn(
					"group rounded-md px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 relative bg-background",
					error ? "border border-destructive" : "border border-input"
				)}
			>
				<div className="absolute right-2 top-1/2 -translate-y-1/2">
					<LuChevronsUpDown className="text-muted-foreground" />
				</div>
				<div className="flex flex-wrap gap-1">
					{selectedOptions.map((value) => {
						const option = options.find(
							(opt) => opt.value === value
						);

						return (
							option && (
								<Badge key={value} variant="secondary">
									{option.label}
									<button
										type="button"
										className={cn(
											"ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2",
											readOnly ? "cursor-not-allowed" : ""
										)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleUnselect(option);
											}
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										onClick={() =>
											readOnly
												? undefined
												: handleUnselect(option)
										}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</button>
								</Badge>
							)
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
						className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
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
			{/* Render the error message if there is an error */}
			{error && <p className="mt-1 text-sm text-destructive">{error}</p>}
			<div className="relative">
				<CommandList>
					{open && options.length > 0 ? (
						<div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
							<CommandGroup className="overflow-auto">
								{options.map((option) => {
									return (
										<CommandItem
											key={option.value}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onSelect={() => {
												setInputValue("");
												handleSelect(option.value);
											}}
											className={"cursor-pointer"}
										>
											<LuCheck
												className={cn(
													"h-3 w-3",
													selectedOptions.some(
														(item) =>
															item ===
															option.value
													)
														? "text-primary  mr-2"
														: "hidden"
												)}
											/>
											{option.label}
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
