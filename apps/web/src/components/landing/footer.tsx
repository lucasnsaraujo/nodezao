import { Link } from "@tanstack/react-router";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		product: [
			{ label: "Ofertas", to: "/offers" },
			// { label: "Funcionalidades", to: "/#features" },
			// { label: "Preços", to: "/#pricing" },
		],
		// company: [
		// 	{ label: "Sobre", to: "/#about" },
		// 	{ label: "Blog", to: "/#blog" },
		// 	{ label: "Contato", to: "/#contact" },
		// ],
		// legal: [
		// 	{ label: "Privacidade", to: "/#privacy" },
		// 	{ label: "Termos", to: "/#terms" },
		// 	{ label: "Cookies", to: "/#cookies" },
		// ],
	};

	return (
		<footer className="border-t border-border bg-muted/30 py-12">
			<div className="container mx-auto px-4">
				<div className="grid gap-8 md:grid-cols-4">
					{/* Brand column */}
					<div className="md:col-span-1">
						<Link to="/" className="mb-4 inline-block">
							<h3 className="text-2xl font-bold text-primary">AdScope</h3>
						</Link>
						<p className="mb-4 text-sm text-muted-foreground">
							Monitore anúncios vencedores do Facebook Ad Library em tempo real.
						</p>
					</div>

					{/* Product links */}
					<div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
							Produto
						</h4>
						<ul className="space-y-3">
							{footerLinks.product.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Company links - commented out */}
					{/* <div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
							Empresa
						</h4>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div> */}

					{/* Legal links - commented out */}
					{/* <div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
							Legal
						</h4>
						<ul className="space-y-3">
							{footerLinks.legal.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div> */}
				</div>

				{/* Bottom bar */}
				<div className="mt-12 border-t border-border pt-8">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-sm text-muted-foreground">
							© {currentYear} AdScope. Todos os direitos reservados.
						</p>
						{/* Social links - commented out */}
						{/* <div className="flex gap-6">
							<a
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground transition-colors hover:text-primary"
							>
								Facebook
							</a>
							<a
								href="https://twitter.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground transition-colors hover:text-primary"
							>
								Twitter
							</a>
							<a
								href="https://linkedin.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground transition-colors hover:text-primary"
							>
								LinkedIn
							</a>
						</div> */}
					</div>
				</div>
			</div>
		</footer>
	);
}
