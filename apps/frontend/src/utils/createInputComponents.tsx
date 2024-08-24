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
	Radio,
	RadioGroup,
	RadioGroupProps,
	RadioProps,
	Select,
	SelectProps,
	TextInput,
	TextInputProps,
	Textarea,
	TextareaProps,
} from "@mantine/core";
import { ReactNode } from "@tanstack/react-router";

type GeneralInputProps = {
	hidden?: boolean;
	key?: string | number;
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

type TextareaType = {
	type: "textarea";
} & TextareaProps;

type RadioGroupType = {
	type: "radio-group";
	radios: RadioProps[];
} & RadioGroupProps;

type AcceptedInput = (
	| TextInputType
	| MultiSelectInputType
	| PasswordInputType
	| NumberInputType
	| SelectType
	| ChipType
	| Group
	| CheckboxType
	| TextareaType
	| RadioGroupType
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
					<TextInput
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
						readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
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
						type="text"
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

			case "group": {
				const localComponents: ReactNode[] = [];

				for (const [key, child] of input.inputs.entries()) {
					if (child.hidden) continue;

					localComponents.push(createComponent({ ...child, key }));
				}

				return (
					<Fieldset key={key} {...input}>
						{localComponents}
					</Fieldset>
				);
			}

			case "chip": {
				return (
					<Chip
						{...input}
						key={key}
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
						key={key}
						readOnly={options.readonlyAll || input.readOnly}
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
					<RadioGroup {...input} key={key}>
						{input.radios.map((radio, index) => (
							<Radio key={index} {...radio} />
						))}
					</RadioGroup>
				);
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
