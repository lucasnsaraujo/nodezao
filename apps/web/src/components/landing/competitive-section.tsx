import { Card, CardContent } from "../ui/card";
import { X, Check } from "lucide-react";

export default function CompetitiveSection() {
	return (
		<section className="bg-muted/50 py-20 sm:py-32">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						Por que bibliotecas de ads{" "}
						<span className="text-destructive">mortas</span> não funcionam
					</h2>
					<p className="text-lg text-muted-foreground">
						Se todo mundo tá copiando a mesma oferta, ninguém lucra. Simples assim.
					</p>
				</div>

				{/* Comparison grid */}
				<div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
					{/* Competitors (Bad) */}
					<Card className="border-destructive/30 bg-card">
						<CardContent className="p-8">
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
									<X className="h-6 w-6 text-destructive" />
								</div>
								<h3 className="text-2xl font-bold text-foreground">
									Bibliotecas "Prontas"
								</h3>
							</div>

							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
									<span className="text-muted-foreground">
										Todo mundo vê as mesmas ofertas
									</span>
								</li>
								<li className="flex items-start gap-3">
									<X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
									<span className="text-muted-foreground">
										Mercado saturado em 48h
									</span>
								</li>
								<li className="flex items-start gap-3">
									<X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
									<span className="text-muted-foreground">
										Você roda a mesma oferta que 500 afiliados
									</span>
								</li>
								<li className="flex items-start gap-3">
									<X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
									<span className="text-muted-foreground">
										Margem de lucro despenca instantaneamente
									</span>
								</li>
								<li className="flex items-start gap-3">
									<X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
									<span className="text-muted-foreground">
										Zero vantagem competitiva
									</span>
								</li>
							</ul>

							<div className="mt-6 rounded-lg bg-destructive/5 p-4">
								<p className="text-sm font-medium text-destructive">
									💀 Resultado: Você queima budget copiando oferta morta
								</p>
							</div>
						</CardContent>
					</Card>

					{/* AdScope (Good) */}
					<Card className="border-primary/30 bg-card shadow-lg shadow-primary/10">
						<CardContent className="p-8">
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Check className="h-6 w-6 text-primary" />
								</div>
								<h3 className="text-2xl font-bold text-foreground">
									AdScope (Você)
								</h3>
							</div>

							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span className="text-muted-foreground">
										<span className="font-semibold text-foreground">Você</span> escolhe quais
										ofertas minerar
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span className="text-muted-foreground">
										Inteligência exclusiva que ninguém mais tem
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span className="text-muted-foreground">
										Track ofertas antes do mercado saturar
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span className="text-muted-foreground">
										Atualizações automáticas a cada hora
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span className="text-muted-foreground">
										Você entra primeiro, não por último
									</span>
								</li>
							</ul>

							<div className="mt-6 rounded-lg bg-primary/10 p-4">
								<p className="text-sm font-medium text-primary">
									🔥 Resultado: Você escala com vantagem competitiva real
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Bottom CTA */}
				<div className="mt-16 text-center">
					<p className="text-xl font-medium text-muted-foreground">
						A pergunta é:{" "}
						<span className="text-foreground">
							você quer copiar todo mundo ou ter suas próprias jogadas?
						</span>
					</p>
				</div>
			</div>
		</section>
	);
}
