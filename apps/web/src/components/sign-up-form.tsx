import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link } from "@tanstack/react-router";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/offers",
						});
						toast.success("Conta criada com sucesso!");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
				email: z.email("Email inválido"),
				password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="mb-8 text-center">
					<Link to="/">
						<h1 className="mb-2 text-3xl font-bold text-primary">AdScope</h1>
					</Link>
					<p className="text-muted-foreground">
						Crie sua conta e comece a monitorar ofertas
					</p>
				</div>

				{/* Form Card */}
				<div className="rounded-xl border border-border bg-card p-8">
					<h2 className="mb-6 text-2xl font-semibold text-foreground">
						Criar conta grátis
					</h2>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name} className="text-foreground">
										Nome
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-border bg-background text-foreground placeholder:text-muted-foreground"
										placeholder="Seu nome"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-sm text-destructive">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name} className="text-foreground">
										Email
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-border bg-background text-foreground placeholder:text-muted-foreground"
										placeholder="seu@email.com"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-sm text-destructive">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name} className="text-foreground">
										Senha
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="border-border bg-background text-foreground placeholder:text-muted-foreground"
										placeholder="••••••••"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-sm text-destructive">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className="w-full bg-[#FACC15] font-semibold text-black hover:bg-[#F59E0B] dark:bg-[#FACC15] dark:hover:bg-[#F59E0B]"
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? "Criando conta..." : "Criar conta grátis"}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="mt-6 text-center">
						<button
							onClick={onSwitchToSignIn}
							className="text-sm text-muted-foreground transition-colors hover:text-primary"
						>
							Já tem uma conta?{" "}
							<span className="font-semibold text-primary">
								Fazer login
							</span>
						</button>
					</div>
				</div>

				{/* Back to home */}
				<div className="mt-6 text-center">
					<Link
						to="/"
						className="text-sm text-muted-foreground transition-colors hover:text-primary"
					>
						← Voltar para o início
					</Link>
				</div>
			</div>
		</div>
	);
}
