import { cn } from "@repo/ui/utils";
import type React from "react";
import FormTemplate, { type FormTemplateProps } from "./FormTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui";

export type ModalFormTemplateProps<TForm> = FormTemplateProps<TForm> & {
	title: React.ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
	className?: string;
};

export default function ModalFormTemplate<TForm>(
	props: ModalFormTemplateProps<TForm>,
) {
	const { className, ...formProps } = props;
	const handleCloseModal = () => {
		props.onClose?.();
		props.form.reset();
	};

	return (
		<Dialog open={props.isOpen ?? true}>
			<DialogContent
				onClose={handleCloseModal}
				className={cn("flex flex-col", className)}
			>
				<DialogHeader>
					<DialogTitle>{props.title}</DialogTitle>
				</DialogHeader>

				<FormTemplate
					{...formProps}
					className="flex-1 min-h-0 overflow-hidden"
					onCancel={() => props.onClose?.()}
				/>
			</DialogContent>
		</Dialog>
	);
}
