import {
	Checkbox,
	CheckboxProps,
	Chip,
	ChipProps,
	Fieldset,
	FieldsetProps,
	MultiSelect,
	MultiSelectProps,
	NumberInput,
	NumberInputProps,
	PasswordInput,
	PasswordInputProps,
	Select,
	SelectProps,
	TextInput,
	TextInputProps,
} from "@mantine/core";
import { ReactNode } from "@tanstack/react-router";

type GeneralInputProps = {
	hidden?: boolean;
};

type TextInputType = {
	type: "text";
} & TextInputProps;

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

type Group = {
	type: "group";
	inputs: AcceptedInput[];
} & FieldsetProps;

type ChipType = {
	type: "chip";
} & Omit<ChipProps, "type">;

type CheckboxType = {
	type: "checkbox";
} & CheckboxProps;

type AcceptedInput = (
	| TextInputType
	| MultiSelectInputType
	| PasswordInputType
	| NumberInputType
	| SelectType
	| ChipType
	| Group
	| CheckboxType
) &
	GeneralInputProps;

interface Options {
	disableAll?: boolean;
	readonlyAll?: boolean;
	inputs: AcceptedInput[];
}

function createInputComponents(options: Options) {
	const components = [] as ReactNode[];

	const createComponent = (input: AcceptedInput) => {
		switch (input.type) {
			case "text":
				return (
					<TextInput
						{...input}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "multi-select":
				return (
					<MultiSelect
						{...input}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "password":
				return (
					<PasswordInput
						{...input}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "number":
				return (
					<NumberInput
						{...input}
						type="text"
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			case "select":
				return (
					<Select
						{...input}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);

			case "group": {
				const localComponents: ReactNode[] = [];

				for (const child of input.inputs) {
					if (child.hidden) continue;

					localComponents.push(createComponent(child));
				}

				return <Fieldset {...input}>{localComponents}</Fieldset>;
			}

			case "chip": {
				return (
					<Chip
						{...input}
						type="checkbox"
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}

			case "checkbox": {
				return (
					<Checkbox
						{...input}
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);
			}
		}
	};

	for (const input of options.inputs) {
		if (input.hidden) continue;

		components.push(createComponent(input));
	}

	return <>{components}</>;
}

export default createInputComponents;
