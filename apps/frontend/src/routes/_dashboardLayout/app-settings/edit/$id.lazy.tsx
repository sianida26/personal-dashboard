import { createLazyFileRoute } from "@tanstack/react-router";
import client from "@/honoClient";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { appSettingUpdateSchema } from "@repo/validation";
import { Button, Input } from "@repo/ui";
import { useToast } from "@repo/ui/hooks";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowLeft } from "lucide-react";
import type { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import fetchRPC from "@/utils/fetchRPC";
import { useEffect } from "react";
import { usePermissions } from "@/hooks/useAuth";

export const Route = createLazyFileRoute(
	"/_dashboardLayout/app-settings/edit/$id",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const { id } = Route.useParams();

	usePermissions("app-settings.edit");

	const form = useForm<z.infer<typeof appSettingUpdateSchema>>({
		initialValues: {
			id: "",
			value: "",
		},
		validate: zodResolver(appSettingUpdateSchema),
	});

	const { data: setting, isLoading } = useQuery({
		queryKey: ["app-settings", { id }],
		queryFn: () =>
			fetchRPC(client["app-settings"][":id"].$get({ param: { id } })),
	});

	useEffect(() => {
		if (setting) {
			form.setValues({
				id: setting.id,
				value: setting.value,
			});
		}
	}, [setting]);

	const updateMutation = useMutation({
		mutationKey: ["update-app-setting", id],
		mutationFn: (values: z.infer<typeof appSettingUpdateSchema>) =>
			fetchRPC(
				client["app-settings"][":id"].$put({
					param: { id },
					json: values,
				}),
			),
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Setting updated successfully",
			});
			navigate({ to: "/app-settings" });
		},
		onError: (error: Error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update setting",
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (values: z.infer<typeof appSettingUpdateSchema>) => {
		updateMutation.mutate(values);
	};

	if (isLoading) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			{/* Header with back button */}
			<div className="mb-6 flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/app-settings" })}
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-2xl font-semibold">
						Edit Setting: {setting?.key}
					</h1>
					<p className="text-sm text-muted-foreground">
						Update the setting value below
					</p>
				</div>
			</div>

			{/* Main content card */}
			<div className="mx-auto max-w-2xl">
				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<div className="mb-6">
						<h3 className="text-lg font-medium">Setting Details</h3>
						<p className="text-sm text-muted-foreground">
							This setting controls{" "}
							{setting?.key.split(".").join(" ")}
						</p>
					</div>

					<form
						onSubmit={form.onSubmit(handleSubmit)}
						className="space-y-6"
					>
						<div className="space-y-2">
							<div className="grid gap-1">
								<label
									htmlFor="setting-key"
									className="text-sm font-medium"
								>
									Key
								</label>
								<Input
									id="setting-key"
									value={setting?.key}
									disabled
									className="bg-muted"
								/>
							</div>
							<div className="grid gap-1">
								<label
									htmlFor="setting-value"
									className="text-sm font-medium"
								>
									Value
								</label>
								<Input
									id="setting-value"
									required
									{...form.getInputProps("value")}
								/>
								<p className="text-xs text-muted-foreground">
									Enter the new value for this setting
								</p>
							</div>
						</div>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									navigate({ to: "/app-settings" })
								}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={updateMutation.isPending}
							>
								{updateMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save Changes
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
