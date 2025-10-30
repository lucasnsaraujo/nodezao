import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";

const faqs = [
	{
		question: "Por que não usar bibliotecas prontas de ads como os concorrentes?",
		answer:
			"Bibliotecas prontas são ciladas. Se 500 pessoas veem a mesma oferta, 500 pessoas vão rodar ela. O mercado satura em 48 horas e ninguém lucra. Com AdScope, você minera SÓ as ofertas que VOCÊ quer espionar. Inteligência exclusiva = vantagem competitiva real.",
	},
	{
		question: "Como funciona o monitoramento automático?",
		answer:
			"Você adiciona o link do Facebook Ad Library da oferta que quer trackear. A cada hora, o AdScope coleta automaticamente quantos criativos estão ativos. Se o número cresce, a oferta tá escalando. Se cai, tá morrendo. Simples, direto e em tempo real.",
	},
	{
		question: "Posso trackear ofertas ilimitadas?",
		answer:
			"Sim! Sem limites de ofertas. Você pode monitorar 10, 100 ou 1000 ofertas ao mesmo tempo. Organize por tags, regiões, nichos. Monte sua própria biblioteca de inteligência de mercado do seu jeito.",
	},
	{
		question: "O que acontece se eu encontrar uma oferta escalando?",
		answer:
			"Você vê os dados antes de todo mundo. Aí você decide: entra agora enquanto ainda tem margem, ou espera mais dados. Você tem vantagem de tempo. Enquanto outros estão copiando bibliotecas mortas, você tá entrando em ofertas vivas.",
	},
	{
		question: "Preciso de cartão de crédito pra começar?",
		answer:
			"Não. Zero fricção. Você cria conta e já pode começar a monitorar. Sem cartão, sem trial, sem enrolação. A ideia é você ter acesso rápido à inteligência que seus concorrentes não têm.",
	},
	{
		question: "Como vocês pegam os dados do Facebook?",
		answer:
			"Scraping direto do Facebook Ad Library. É público, é legal, é automático. A cada hora rodamos os scrapers e atualizamos tudo. Você não precisa fazer nada manualmente. É tudo no piloto automático.",
	},
];

export default function FAQSection() {
	return (
		<section className="bg-muted/30 py-20 sm:py-32">
			<div className="container mx-auto px-4">
				<div className="mx-auto max-w-3xl">
					{/* Section header */}
					<div className="mb-12 text-center">
						<h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
							Perguntas que você{" "}
							<span className="text-primary">provavelmente tem</span>
						</h2>
						<p className="text-lg text-muted-foreground">
							Respostas diretas. Sem marketing de internet coach.
						</p>
					</div>

					{/* FAQ Accordion */}
					<Accordion type="single" collapsible className="space-y-4">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={index}
								value={`item-${index}`}
								className="rounded-lg border border-border bg-card px-6"
							>
								<AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary hover:no-underline">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-base leading-relaxed text-muted-foreground">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
