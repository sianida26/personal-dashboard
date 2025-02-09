import type React from "react";
import FormTemplate, { type FormTemplateProps } from "./FormTemplate";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../../packages/ui/src/components/dialog";

export type ModalFormTemplateProps<TForm> = FormTemplateProps<TForm> & {
	title: React.ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
};

export default function ModalFormTemplate<TForm>(
	props: ModalFormTemplateProps<TForm>,
) {
	const handleCloseModal = () => {
		props.onClose?.();
		props.form.reset();
	};

	return (
		<Dialog open={props.isOpen ?? true}>
			<DialogContent onClose={handleCloseModal}>
				<DialogHeader>
					<DialogTitle>{props.title}</DialogTitle>
				</DialogHeader>

				<FormTemplate {...props} onCancel={() => props.onClose?.()} />
			</DialogContent>
		</Dialog>
	);
}
