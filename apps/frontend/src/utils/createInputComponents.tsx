import {
	Autocomplete,
	type AutocompleteOption,
	type AutocompleteProps,
	Checkbox,
	type CheckboxProps,
	DateTimePicker,
	type DateTimePickerProps,
	FileInput,
	type FileInputProps,
	FormGroup,
	type FormGroupProps,
	Input,
	type InputProps,
	Label,
	MultiSelect,
	type MultiSelectProps,
	NumberInput,
	type NumberInputProps,
	PasswordInput,
	type PasswordInputProps,
	RadioGroup,
	RadioGroupItem,
	type RadioGroupProps,
	type RadioProps,
	Select,
	type SelectProps,
	Textarea,
	type TextareaProps,
} from "@repo/ui";
import type { ReactNode } from "@tanstack/react-router";
import type React from "react";

//TODO: Implement all these

type GeneralInputProps = {
	hidden?: boolean;
	key?: string | number;
};

type CustomType = {
	type: "custom";
	component: React.ReactNode;
};

type TextInputType = {
	type: "text";
} & InputProps;

type MultiSelectInputType = {
	type: "multi-select";
} & MultiSelectProps;

type PasswordInputType = {
	type: "password";
} & PasswordInputProps;

type NumberInputType = {
	type: "number";
} & Omit<NumberInputProps, "type">;

type SelectType = {
	type: "select";
} & SelectProps;

type AutocompleteType = {
	type: "autocomplete";
	options: AutocompleteOption[];
} & Omit<AutocompleteProps, "options">;

type Group = {
	type: "group";
	inputs: AcceptedInput[];
} & FormGroupProps;

// type ChipType = {
// 	type: "chip";
// } & Omit<ChipProps, "type">;

type CheckboxType = {
	type: "checkbox";
} & Omit<CheckboxProps, "type">;

type TextareaType = {
	type: "textarea";
} & TextareaProps;

type RadioGroupType = {
	type: "radio-group";
	layout?: "vertical" | "horizontal";
	radios: RadioProps[];
} & Omit<RadioGroupProps, "children">;

type FileInputType<Multiple = boolean> = {
	type: "file-input";
	multiple?: Multiple;
} & Omit<FileInputProps, "type" | "multiple">;

type DateTimePickerType = {
	type: "datetime-picker";
} & DateTimePickerProps;

type AcceptedInput = (
	| TextInputType
	| MultiSelectInputType
	| PasswordInputType
	| NumberInputType
	| SelectType
	| DateTimePickerType
	| AutocompleteType
	// | ChipType
	| Group
	| CheckboxType
	| TextareaType
	| RadioGroupType
	| FileInputType
	| CustomType
) &
	GeneralInputProps;

interface Options {
	disableAll?: boolean;
	readonlyAll?: boolean;
	inputs: AcceptedInput[];
}

function createInputComponents(options: Options) {
	const components = [] as ReactNode[];

	const createComponent = ({ key, ...input }: AcceptedInput) => {
		switch (input.type) {
			case "text":
				return (
					<Input
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "multi-select":
				return (
					<MultiSelect
						{...input}
						key={key}
						// readOnly={options.readonlyAll || input.readOnly}
						// disabled={options.disableAll || input.disabled}
					/>
				);
			case "password":
				return (
					<PasswordInput
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "number":
				return (
					<NumberInput
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "select":
				return (
					<Select
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "autocomplete":
				return (
					<Autocomplete
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);

			case "group": {
				const localComponents: ReactNode[] = [];

				for (const [key, child] of input.inputs.entries()) {
					if (child.hidden) continue;

					localComponents.push(createComponent({ ...child, key }));
				}

				return (
					<FormGroup key={key} {...input}>
						{localComponents}
					</FormGroup>
				);
			}

			// case "chip": {
			// 	return (
			// 		<Chip
			// 			{...input}
			// 			key={key}
			// 			type="checkbox"
			// 			readOnly={options.readonlyAll || input.readOnly}
			// 			disabled={options.disableAll || input.disabled}
			// 		/>
			// 	);
			// }

			case "checkbox": {
				return (
					<Checkbox
						{...input}
						type="button"
						key={key}
						// readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}

			case "textarea": {
				return (
					<Textarea
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}

			case "radio-group": {
				return (
					<RadioGroup
						{...input}
						key={key}
						// readOnly={options.readonlyAll || input.readOnly}
					>
						{/* <Group> */}
						{input.radios.map((radio, index) => {
							return (
								<div
									className="flex items-center space-x-2"
									key={`${radio.id}-${index}`}
								>
									<RadioGroupItem {...radio} />
									<Label htmlFor={radio.id}>{index}</Label>
								</div>
							);
						})}
						{/* </Group> */}
					</RadioGroup>
				);
			}

			case "file-input": {
				return (
					<FileInput
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}

			case "datetime-picker": {
				return (
					<DateTimePicker
						{...input}
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}

			case "custom": {
				return input.component;
			}
		}
	};

	for (const [index, input] of options.inputs.entries()) {
		if (input.hidden) continue;

		components.push(createComponent({ ...input, key: index }));
	}

	return <>{components}</>;
}

export default createInputComponents;
