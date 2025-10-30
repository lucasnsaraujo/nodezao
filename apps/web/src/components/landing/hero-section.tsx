import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
	return (
		<section className="relative overflow-hidden bg-background py-20 sm:py-32">
			{/* Background gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

			<div className="container relative mx-auto px-4">
				<div className="mx-auto max-w-4xl text-center">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-muted px-4 py-2">
						<span className="text-sm font-medium text-primary">
							Enquanto você dorme, seus concorrentes estão escalando
						</span>
					</div>

					{/* Main heading */}
					<h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
						Pare de Testar no Escuro.{" "}
						<span className="bg-gradient-to-r from-[#FACC15] to-[#F59E0B] dark:from-[#FACC15] dark:to-[#F59E0B] bg-clip-text text-transparent">
							Escale o que Já Funciona.
						</span>
					</h1>

					{/* Subheading with competitive angle */}
					<p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
						Monitore automaticamente as ofertas que <span className="font-semibold text-foreground">você</span> escolhe espionar.
						Dados em tempo real direto do Facebook Ad Library.
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						{/* Sign-up temporarily disabled - uncomment to enable */}
						{/* <Link to="/sign-up">
							<Button
								size="lg"
								className="group bg-[#FACC15] px-8 text-base font-semibold text-black hover:bg-[#F59E0B]"
							>
								Começar Agora Grátis
								<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
							</Button>
						</Link> */}
						<Link to="/login">
							<Button
								size="lg"
								className="group bg-[#FACC15] px-8 text-base font-semibold text-black hover:bg-[#F59E0B] dark:bg-[#FACC15] dark:hover:bg-[#F59E0B]"
							>
								Acessar Plataforma
								<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
							</Button>
						</Link>
					</div>

					{/* Trust indicators */}
					<div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span>Ofertas ilimitadas</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span>Atualizado a cada hora</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span>Dados reais do Ad Library</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span>Suas ofertas. Só suas.</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
