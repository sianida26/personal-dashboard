/**
 * NumberInput.tsx
 *
 * A fully-featured numeric input component supporting:
 * - Controlled and uncontrolled modes
 * - Prefix, thousand and decimal separators
 * - Customizable clamp behavior (none, blur, strict)
 * - Increment/decrement controls
 * - Decimal or integer-only input
 */

import * as React from "react";
import { Input, type InputProps } from "./input";
import { cn } from "../utils";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

/**
 * Props for <NumberInput>
 */
export interface NumberInputProps
	extends Omit<InputProps, "type" | "value" | "onChange"> {
	/** Controlled numeric value. Pass `null` to clear. */
	value?: number | null;
	/** Default initial numeric value (uncontrolled mode). */
	defaultValue?: number;
	/** Callback when the numeric value changes. Receives `number` or `null`. */
	onChange?(value: number | null): void;
	/** Minimum allowable value (inclusive). */
	min?: number;
	/** Maximum allowable value (inclusive). */
	max?: number;
	/** Step amount for arrows. @default 1 */
	step?: number;
	/** Clamp behavior: none, blur, strict. @default "blur" */
	clampBehavior?: "none" | "blur" | "strict";
	/** Text prefix (e.g. "$“). */
	prefix?: string;
	/** Thousands separator char (e.g. ","). */
	thousandSeparator?: string;
	/** Decimal separator char (e.g. "."). */
	decimalSeparator?: string;
	/** Allow decimals? @default true */
	allowDecimals?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			value,
			defaultValue,
			onChange,
			min,
			max,
			step = 1,
			clampBehavior = "blur",
			prefix = "",
			thousandSeparator = "",
			decimalSeparator = ".",
			allowDecimals = true,
			...props
		},
		ref,
	) => {
		const sep = decimalSeparator;
		const thou = thousandSeparator;

		function format(n: number) {
			const [i = "0", d = ""] = n.toString().split(".");
			let iFmt = i;
			if (thou && i.length > 3)
				iFmt = i.replace(/\B(?=(\d{3})+(?!\d))/g, thou);
			return prefix + (d && allowDecimals ? `${iFmt}${sep}${d}` : iFmt);
		}

		function parse(txt: string): number | null {
			let t = txt.replace(prefix, "");
			if (thou) {
				const esc = thou.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&");
				t = t.replace(new RegExp(esc, "g"), "");
			}
			if (sep !== ".") t = t.replace(sep, ".");
			if (!/^-?\d*\.?\d*$/.test(t)) return null;
			if (t === "." || t === "-" || t === "-.") return null;
			const num = Number.parseFloat(t);
			return Number.isNaN(num) ? null : num;
		}

		function clamp(n: number) {
			let r = n;
			if (min != null && r < min) r = min;
			if (max != null && r > max) r = max;
			return r;
		}

		const isEditing = React.useRef(false);
		const initialNum = value ?? defaultValue ?? null;
		const [internalNum, setInternalNum] = React.useState<number | null>(
			initialNum,
		);
		const [text, setText] = React.useState<string>(
			initialNum != null ? format(initialNum) : "",
		);

		React.useEffect(() => {
			if (!isEditing.current) {
				const v = value ?? null;
				setInternalNum(v);
				setText(v != null ? format(v) : "");
			}
		}, [value]);

		const handleFocus = () => {
			isEditing.current = true;
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			isEditing.current = false;
			const p = parse(text);
			if (p == null) {
				if (min != null) {
					setInternalNum(min);
					setText(format(min));
					onChange?.(min);
				} else {
					setInternalNum(null);
					setText("");
					onChange?.(null);
				}
			} else {
				const final = clampBehavior !== "none" ? clamp(p) : p;
				setInternalNum(final);
				setText(format(final));
				onChange?.(final);
			}
			props.onBlur?.(e);
		};

		const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			// validation regex: prefix? minus? digits/thou* optional decSep digits*
			const esc = (s: string) =>
				s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&");
			const prefixPart = prefix ? esc(prefix) : "";
			const thouPart = thou ? esc(thou) : "";
			const sepPart = esc(sep);
			const pattern = new RegExp(
				`^${prefixPart}[-]?([0-9${thouPart}]*)(?:${sepPart}[0-9]*)?$`,
			);
			if (!pattern.test(raw)) {
				// ignore invalid keystrokes
				return;
			}
			setText(raw);
			if (!raw || raw === prefix) return;
			if ((allowDecimals && raw.endsWith(sep)) || raw === `${prefix}-`)
				return;
			const p = parse(raw);
			if (p != null) {
				if (clampBehavior === "strict") {
					const c = clamp(p);
					setInternalNum(c);
					setText(format(c));
					onChange?.(c);
				} else {
					setInternalNum(p);
					onChange?.(p);
				}
			}
		};

		const inc = () => {
			const next = clamp((internalNum ?? 0) + step);
			setInternalNum(next);
			setText(format(next));
			onChange?.(next);
		};
		const dec = () => {
			const next = clamp((internalNum ?? 0) - step);
			setInternalNum(next);
			setText(format(next));
			onChange?.(next);
		};

		const atMin = min != null && internalNum != null && internalNum <= min;
		const atMax = max != null && internalNum != null && internalNum >= max;

		const rightSection = (
			<div className="flex flex-col h-full">
				<button
					type="button"
					onClick={inc}
					disabled={atMax}
					className={cn(
						"flex items-center h-full justify-center w-6 hover:bg-primary/10 disabled:opacity-50",
					)}
				>
					<LuChevronUp />
				</button>
				<button
					type="button"
					onClick={dec}
					disabled={atMin}
					className={cn(
						"flex items-center h-full justify-center w-6 hover:bg-primary/10 disabled:opacity-50",
					)}
				>
					<LuChevronDown />
				</button>
			</div>
		);

		return (
			<Input
				ref={ref}
				{...props}
				type="text"
				inputMode={allowDecimals ? "decimal" : "numeric"}
				value={text}
				onFocus={handleFocus}
				onChange={handleChangeText}
				onBlur={handleBlur}
				rightSection={rightSection}
				classNames={{
					rightSection:
						"right-[0.4px] h-full rounded-r-sm overflow-clip",
					...props.classNames,
				}}
			/>
		);
	},
);
NumberInput.displayName = "NumberInput";
