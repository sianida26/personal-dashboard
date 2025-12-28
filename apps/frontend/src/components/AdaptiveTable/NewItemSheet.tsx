import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Checkbox,
	Input,
	Label,
	NativeSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Textarea,
} from "@repo/ui";
import { AlertCircle, AlertTriangle, Loader2, Save, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import FormResponseError from "@/errors/FormResponseError";
import type { AdaptiveColumnDef, NewItemField } from "./types";

interface NewItemSheetProps<T> {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Explicit field definitions (takes priority over columns) */
	fields?: NewItemField[];
	/** Column definitions to auto-generate fields from */
	columns?: AdaptiveColumnDef<T>[];
	title: string;
	/** Callback when form is saved. If not provided, a warning will be shown. */
	onSave?: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * Generate form fields from column definitions
 * Includes columns that have editable=true or have editType defined
 */
function generateFieldsFromColumns<T>(
	columns: AdaptiveColumnDef<T>[],
): NewItemField[] {
	return columns
		.filter((col) => {
			// Skip actions column
			if (col.id === "_actions") return false;
			// Include if editable or has editType
			return col.editable || col.editType;
		})
		.map((col) => {
			const columnId =
				col.id || ("accessorKey" in col ? String(col.accessorKey) : "");
			const header =
				typeof col.header === "string" ? col.header : columnId;

			// Determine field type from editType or options
			let fieldType: NewItemField["type"] = "text";
			if (col.editType === "select" || col.options) {
				fieldType = "select";
			}

			return {
				name: columnId,
				label: header,
				type: fieldType,
				options: col.options?.map((opt) => ({
					label: opt.label,
					value: opt.value,
				})),
			};
		});
}

export function NewItemSheet<T>({
	open,
	onOpenChange,
	fields: explicitFields,
	columns,
	title,
	onSave,
}: NewItemSheetProps<T>) {
	// Use explicit fields if provided, otherwise generate from columns
	const fields = useMemo(() => {
		if (explicitFields && explicitFields.length > 0) {
			return explicitFields;
		}
		if (columns) {
			return generateFieldsFromColumns(columns);
		}
		return [];
	}, [explicitFields, columns]);
	// Initialize form data with default values
	const getInitialFormData = useCallback(() => {
		const initialData: Record<string, unknown> = {};
		for (const field of fields) {
			if (field.defaultValue !== undefined) {
				initialData[field.name] = field.defaultValue;
			} else if (field.type === "checkbox") {
				initialData[field.name] = false;
			} else if (field.type === "number") {
				initialData[field.name] = 0;
			} else {
				initialData[field.name] = "";
			}
		}
		return initialData;
	}, [fields]);

	const [formData, setFormData] =
		useState<Record<string, unknown>>(getInitialFormData);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [generalError, setGeneralError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleFieldChange = (name: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear field error when user starts typing
		if (fieldErrors[name]) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
		// Clear general error when user modifies form
		if (generalError) {
			setGeneralError(null);
		}
	};

	const resetForm = () => {
		setFormData(getInitialFormData());
		setFieldErrors({});
		setGeneralError(null);
	};

	const handleClose = () => {
		resetForm();
		onOpenChange(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!onSave) {
			// No save handler, just close
			handleClose();
			return;
		}

		setFieldErrors({});
		setGeneralError(null);
		setIsSubmitting(true);

		try {
			await onSave(formData);
			// Success - show toast and close drawer
			toast.success("Item created successfully");
			handleClose();
		} catch (error) {
			if (error instanceof FormResponseError) {
				// Validation error - show errors on fields
				setFieldErrors(error.formErrors);
			} else if (error instanceof Error) {
				// General error - show as alert
				setGeneralError(error.message);
			} else {
				setGeneralError("An unexpected error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderField = (field: NewItemField) => {
		const value = formData[field.name];
		const error = fieldErrors[field.name];

		switch (field.type) {
			case "text":
			case "password":
				return (
					<div key={field.name} className="space-y-2">
						<Label htmlFor={field.name}>
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
						<Input
							id={field.name}
							type={field.type}
							value={String(value ?? "")}
							onChange={(e) =>
								handleFieldChange(field.name, e.target.value)
							}
							placeholder={field.placeholder}
							disabled={isSubmitting}
							className={error ? "border-destructive" : ""}
						/>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
				);

			case "number":
				return (
					<div key={field.name} className="space-y-2">
						<Label htmlFor={field.name}>
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
						<Input
							id={field.name}
							type="number"
							value={String(value ?? "")}
							onChange={(e) =>
								handleFieldChange(
									field.name,
									e.target.valueAsNumber,
								)
							}
							placeholder={field.placeholder}
							disabled={isSubmitting}
							className={error ? "border-destructive" : ""}
						/>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
				);

			case "textarea":
				return (
					<div key={field.name} className="space-y-2">
						<Label htmlFor={field.name}>
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
						<Textarea
							id={field.name}
							value={String(value ?? "")}
							onChange={(e) =>
								handleFieldChange(field.name, e.target.value)
							}
							placeholder={field.placeholder}
							disabled={isSubmitting}
							className={error ? "border-destructive" : ""}
						/>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
				);

			case "select":
				return (
					<div key={field.name} className="space-y-2">
						<Label htmlFor={field.name}>
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
						<NativeSelect
							value={String(value ?? "")}
							onValueChange={(val) =>
								handleFieldChange(field.name, val)
							}
							disabled={isSubmitting}
						>
							<SelectTrigger
								className={error ? "border-destructive" : ""}
							>
								<SelectValue
									placeholder={
										field.placeholder || "Select..."
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{field.options?.map((option) => (
									<SelectItem
										key={option.value}
										value={String(option.value)}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</NativeSelect>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
				);

			case "checkbox":
				return (
					<div key={field.name} className="space-y-2">
						<div className="flex items-center space-x-2">
							<Checkbox
								id={field.name}
								checked={Boolean(value)}
								onCheckedChange={(checked) =>
									handleFieldChange(field.name, checked)
								}
								disabled={isSubmitting}
							/>
							<Label htmlFor={field.name}>
								{field.label}
								{field.required && (
									<span className="text-destructive ml-1">
										*
									</span>
								)}
							</Label>
						</div>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent side="right" className="w-[400px] sm:w-[540px] p-4">
				<SheetHeader className="mb-4">
					<SheetTitle>{title}</SheetTitle>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Developer warning when onSave is not provided */}
					{!onSave && (
						<Alert className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
							<AlertTriangle className="h-4 w-4 text-amber-600" />
							<AlertTitle>Data will not be saved</AlertTitle>
							<AlertDescription>
								Developer: Please provide the{" "}
								<code className="bg-amber-200 dark:bg-amber-800 px-1 rounded text-xs">
									onCreateItem
								</code>{" "}
								prop to enable saving functionality.
							</AlertDescription>
						</Alert>
					)}

					{fields.map(renderField)}

					{/* General error alert */}
					{generalError && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{generalError}</AlertDescription>
						</Alert>
					)}

					{/* Form buttons */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							<X className="h-4 w-4 mr-2" />
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Save className="h-4 w-4 mr-2" />
							)}
							Save
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
