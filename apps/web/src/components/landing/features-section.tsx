import {
	TrendingUp,
	Clock,
	BarChart3,
	Target,
	Filter,
	Bell,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";

const features = [
	{
		icon: TrendingUp,
		title: "Nunca Mais Perca uma Oferta Escalando",
		description:
			"Enquanto outros descobrem ofertas vencedoras semanas depois, você recebe atualizações automáticas a cada hora. Seja o primeiro a surfar na onda.",
	},
	{
		icon: Clock,
		title: "Roube a Largada da Concorrência",
		description:
			"Dados frescos a cada 60 minutos. Quando você identificar uma oferta explodindo, ainda dá tempo de entrar antes do mercado saturar.",
	},
	{
		icon: BarChart3,
		title: "Tome Decisões de R$ 10k em 30 Segundos",
		description:
			"Gráficos que mostram se a oferta está subindo ou morrendo em 7 dias. Não precisa mais ficar 2 horas analisando planilha pra escolher sua próxima escala.",
	},
	{
		icon: Target,
		title: "Organize o Caos. Ache Ouro Mais Rápido.",
		description:
			"Filtre por região, nicho, tipo de produto. Acabou aquela sensação de estar perdido em 500 abas do navegador. Seu cérebro agradece.",
	},
	{
		icon: Filter,
		title: "Crie Seu Próprio Sistema de Espionagem",
		description:
			"Marque ofertas como 'Escalando Agora', 'Testando Q1', 'Black Friday'. Construa sua biblioteca de inteligência de mercado do seu jeito.",
	},
	{
		icon: Bell,
		title: "Identifique Mudanças Antes de Queimar Grana",
		description:
			"Veja na hora se uma oferta perdeu 50% dos criativos em 24h. É o mercado avisando: não escale isso agora. Você economiza antes de perder.",
	},
];

export default function FeaturesSection() {
	return (
		<section className="bg-background py-20 sm:py-32">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						O que você consegue fazer{" "}
						<span className="text-primary">que sua concorrência não consegue</span>
					</h2>
					<p className="text-lg text-muted-foreground">
						Não é sobre ter mais dados. É sobre ter os dados certos, no momento
						certo, organizados do jeito certo pra você escalar sem medo.
					</p>
				</div>

				{/* Features grid */}
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<Card
								key={index}
								className="border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
							>
								<CardContent className="p-6">
									<div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
										<Icon className="h-6 w-6 text-primary" />
									</div>
									<h3 className="mb-2 text-xl font-semibold text-foreground">
										{feature.title}
									</h3>
									<p className="text-muted-foreground">{feature.description}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}
