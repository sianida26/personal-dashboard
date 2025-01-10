import FormResponseError from "@/errors/FormResponseError";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturnType } from "@mantine/form";
import {
	useIsMutating,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { TbDeviceFloppy } from "react-icons/tb";
import { cn } from "@/lib/utils";

export type FormTemplateProps<TForm> = {
	children: React.ReactNode;
	form: UseFormReturnType<TForm>;
	onSubmit: Function;
	onSuccess?: Function;
	onSettled?: Function;
	onCancel?: Function;
	invalidateQueries?: any[];
	mutationKey?: any[];
	successToastMessage?: string;
	buttons?: Partial<{
		submit: boolean | string | React.ReactNode;
		cancel: boolean | string | React.ReactNode;
	}>;
	className?: string;
};

export default function FormTemplate<TForm>(props: FormTemplateProps<TForm>) {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const isMutating = useIsMutating();

	const mutation = useMutation({
		mutationKey: props.mutationKey,
		mutationFn: async () => {
			return await props.onSubmit();
		},
		onError: (error: unknown) => {
			if (error instanceof FormResponseError) {
				props.form.setErrors(error.formErrors);
				return;
			}

			if (error instanceof Error) {
				toast({
					description: error.message,
					variant: "destructive",
				});
			}
		},
		onSuccess: () => {
			if (props.invalidateQueries) {
				queryClient.invalidateQueries({
					queryKey: props.invalidateQueries,
				});
			}

			if (props.successToastMessage) {
				toast({
					description: props.successToastMessage,
					className: "bg-green-200 text-green-800",
				});
			}

			props.onSuccess?.();
		},
	});

	const submitButton = useMemo(() => {
		const withSubmitButton = props.buttons?.submit ?? true;

		if (withSubmitButton === false) return null; //without this button
		if (typeof withSubmitButton === "string" || withSubmitButton === true)
			return (
				<Button
					leftSection={<TbDeviceFloppy size={20} />}
					type="submit"
					disabled={Boolean(isMutating)}
				>
					Save
				</Button>
			);
		return withSubmitButton;
	}, [props.buttons]);

	const cancelButton = useMemo(() => {
		const withCancelButton = props.buttons?.cancel ?? true;

		if (withCancelButton === false) return null; //without this button
		if (typeof withCancelButton === "string" || withCancelButton === true)
			return (
				<Button
					variant="outline"
					type="button"
					onClick={() => props.onCancel?.()}
					disabled={Boolean(isMutating)}
				>
					Close
				</Button>
			);
		return withCancelButton;
	}, [props.buttons]);

	const handleSubmit = () => {
		mutation.mutate();
	};

	return (
		<form
			onSubmit={props.form.onSubmit(handleSubmit)}
			className={cn("flex flex-col gap-2", props.className)}
		>
			{props.children}

			{/* Buttons */}
			<div className="flex justify-end items-center gap-4 mt-4">
				{cancelButton}
				{submitButton}
			</div>
		</form>
	);
}
