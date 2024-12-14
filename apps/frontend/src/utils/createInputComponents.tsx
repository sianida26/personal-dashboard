import { Checkbox, CheckboxProps } from "@/components/ui/checkbox";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiSelect, { MultiSelectProps } from "@/components/ui/multi-select";
import {
	PasswordInput,
	PasswordInputProps,
} from "@/components/ui/password-input";
import {
	RadioGroup,
	RadioGroupItem,
	RadioGroupProps,
	RadioProps,
} from "@/components/ui/radio-group";
import { Select, SelectProps } from "@/components/ui/select";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { ReactNode } from "@tanstack/react-router";
import React from "react";

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

// type NumberInputType = {
// 	type: "number";
// } & Omit<NumberInputProps, "type">;

type SelectType = {
	type: "select";
} & SelectProps;

// type Group = {
// 	type: "group";
// 	inputs: AcceptedInput[];
// 	gap?: MantineSpacing;
// } & FieldsetProps;

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

// type FileInputType<Multiple = boolean> = {
// 	type: "file-input";
// 	multiple?: Multiple;
// } & Omit<FileInputProps<Multiple>, "type" | "multiple">;

type AcceptedInput = (
	| TextInputType
	| MultiSelectInputType
	| PasswordInputType
	// | NumberInputType
	| SelectType
	// | ChipType
	// | Group
	| CheckboxType
	| TextareaType
	| RadioGroupType
	// | FileInputType
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
			// case "number":
			// 	return (
			// 		<NumberInput
			// 			{...input}
			// 			key={key}
			// 			type="text"
			// 			readOnly={options.readonlyAll || input.readOnly}
			// 			disabled={options.disableAll || input.disabled}
			// 		/>
			// 	);
			case "select":
				return (
					<Select
						{...input}
						key={key}
						// readOnly={options.readonlyAll || input.readOnly}
						disabled={options.disableAll || input.disabled}
					/>
				);

			// case "group": {
			// 	const localComponents: ReactNode[] = [];

			// 	for (const [key, child] of input.inputs.entries()) {
			// 		if (child.hidden) continue;

			// 		localComponents.push(createComponent({ ...child, key }));
			// 	}

			// 	return (
			// 		<Fieldset key={key} {...input}>
			// 			<Stack gap={input.gap}>{localComponents}</Stack>
			// 		</Fieldset>
			// 	);
			// }

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
									key={index}
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

			// case "file-input": {
			// 	return (
			// 		<FileInput
			// 			{...input}
			// 			key={key}
			// 			type="button"
			// 			readOnly={options.readonlyAll || input.readOnly}
			// 			disabled={options.disableAll || input.disabled}
			// 		/>
			// 	);
			// }

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
