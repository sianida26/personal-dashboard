import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import client from "../../honoClient";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { zodResolver } from "mantine-form-zod-resolver";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/TextInput";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createLazyFileRoute("/login/")({
	component: LoginPage,
});

type FormSchema = {
	username: string;
	password: string;
};

const formSchema = z.object({
	username: z.string().min(1, "This field is required"),
	password: z.string().min(1, "This field is required"),
});

export default function LoginPage() {
	const [errorMessage, setErrorMessage] = useState("");
	const navigate = useNavigate();

	const { isAuthenticated, saveAuthData } = useAuth();

	const form = useForm<FormSchema>({
		initialValues: {
			username: "",
			password: "",
		},
		validate: zodResolver(formSchema),
	});

	useEffect(() => {
		if (isAuthenticated) {
			navigate({
				to: "/dashboard",
				replace: true,
			});
		}
	}, [navigate, isAuthenticated]);

	const loginMutation = useMutation({
		mutationFn: async (values: FormSchema) => {
			const res = await client.auth.login.$post({
				json: values,
			});

			if (res.ok) {
				return await res.json();
			}

			throw res;
		},

		onSuccess: (data) => {
			saveAuthData(
				{
					id: data.user.id,
					name: data.user.name,
					permissions: data.user.permissions,
					roles: data.user.roles,
				},
				data.accessToken
			);
		},

		onError: async (error) => {
			if (error instanceof Response) {
				const body = await error.json();
				setErrorMessage(body.message as string);
				return;
			}
		},
	});

	const handleSubmit = (values: FormSchema) => {
		loginMutation.mutate(values);
	};

	return (
		<div className="w-screen h-screen flex">
			{/* Left Side */}
			<div className="bg-red-500 flex-grow hidden lg:flex">
				<img
					src="https://images.pexels.com/photos/21243683/pexels-photo-21243683/free-photo-of-seni-kesenian-kreatif-melambai.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
					className="w-full h-full object-cover object-right"
				/>
			</div>

			{/* Right Side */}
			<div className="flex-grow lg:max-w-screen-md w-full flex flex-col justify-center items-center">
				{/* Top side */}
				<div className="justify-self-start flex justify-end w-full px-8 pt-8">
					<a href="#" className="text-xl font-bold">
						Register
					</a>
				</div>

				{/* Main Content */}
				<div className="flex flex-col items-center flex-grow justify-center">
					{/* Login Content */}
					<div className="flex flex-col items-center gap-6">
						<div className="flex flex-col items-center gap-2">
							<h1 className="text-3xl font-bold">Log In</h1>
							<p className="text-muted-foreground text-sm">
								Enter your username or email to log in to the
								app
							</p>
						</div>

						{errorMessage && (
							<Alert
								variant="default"
								className="bg-destructive text-destructive-foreground"
							>
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>
									Username or Password does not match.
								</AlertDescription>
							</Alert>
						)}

						<form
							className="flex flex-col w-full gap-4"
							onSubmit={form.onSubmit(handleSubmit)}
						>
							<TextInput
								label="Username"
								disabled={loginMutation.isPending}
								{...form.getInputProps("username")}
							/>
							<TextInput
								label="Password"
								type="password"
								disabled={loginMutation.isPending}
								{...form.getInputProps("password")}
							/>

							<Button
								disabled={loginMutation.isPending}
								type="submit"
							>
								Sign In
							</Button>
						</form>

						<div className="relative w-full">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>

						<div className="w-full">
							<Button variant="outline" className="w-full">
								<FcGoogle />
								Google
							</Button>
						</div>
					</div>
				</div>

				{/* Bottom Part */}
				{/* TODO: Add automatic versioning */}
				<div className="pb-2">
					<p className="text-muted-foreground text-sm">Version 1.0</p>
				</div>
			</div>
		</div>
	);
}
