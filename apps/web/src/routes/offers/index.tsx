import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DashboardLayout } from "@/components/dashboard-layout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, ExternalLink, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight, Clock, Flame, X, ChevronDown, Package, MapPin, Box, Target, Palette, Lock, Eye, MoreVertical, Activity } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { CreateOfferModal } from "@/components/create-offer-modal";

// Type for search params
type OffersSearch = {
	search?: string;
	region?: string;
	type?: string;
	niche?: string;
	strategy?: string;
	badges?: string[];
	page?: number;
}

export const Route = createFileRoute("/offers/")({
	component: OffersRoute,
	validateSearch: (search: Record<string, unknown>): OffersSearch => {
		return {
			search: (search.search as string) || undefined,
			region: (search.region as string) || undefined,
			type: (search.type as string) || undefined,
			niche: (search.niche as string) || undefined,
			strategy: (search.strategy as string) || undefined,
			badges: (search.badges as string[]) || undefined,
			page: Number(search.page) || 1,
		};
	},
	beforeLoad: ({ context }) => {
		if (!context.queryClient) {
			throw new Error("No session");
		}
	},
});

function OffersRoute() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [badgesPopoverOpen, setBadgesPopoverOpen] = useState(false);
	const [pendingBadges, setPendingBadges] = useState<string[]>([]);
	const [searchInput, setSearchInput] = useState("");
	const navigate = useNavigate({ from: Route.fullPath });
	const searchParams = Route.useSearch();

	const updateSearch = useCallback((updates: Partial<OffersSearch>) => {
		navigate({
			search: (prev) => ({ ...prev, ...updates }),
			replace: true,
		});
	}, [navigate]);

	// Sync search input with URL param
	useEffect(() => {
		setSearchInput(searchParams.search || "");
	}, [searchParams.search]);

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput !== (searchParams.search || "")) {
				updateSearch({ search: searchInput || undefined, page: 1 });
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [searchInput, searchParams.search, updateSearch]);

	const pageSize = 10;

	const offers = useQuery(trpc.offer.getAll.queryOptions({
		search: searchParams.search,
		region: searchParams.region,
		type: searchParams.type,
		niche: searchParams.niche,
		badges: searchParams.badges,
		limit: pageSize,
		offset: ((searchParams.page || 1) - 1) * pageSize,
	}));
	const stats = useQuery(trpc.offer.getStats.queryOptions());
	const deltas = useQuery(trpc.snapshot.getDelta.queryOptions());

	// Fetch filter options
	const regions = useQuery(trpc.config.regions.getAll.queryOptions());
	const types = useQuery(trpc.config.offerTypes.getAll.queryOptions());
	const niches = useQuery(trpc.config.niches.getAll.queryOptions());
	const strategies = useQuery(trpc.config.strategies.getAll.queryOptions());
	const allBadges = useQuery(trpc.config.badges.getAll.queryOptions());

	const totalPages = offers.data ? Math.ceil(offers.data.total / pageSize) : 0;

	const getDeltaForOffer = (offerId: number) => {
		return deltas.data?.find((d) => d.offerId === offerId);
	};

	const clearAllFilters = () => {
		setSearchInput("");
		navigate({
			search: {},
			replace: true,
		});
	};

	const hasActiveFilters = searchParams.search || searchParams.region || searchParams.type ||
		searchParams.niche || searchParams.strategy || searchParams.badges?.length;

	const formatDate = (date: Date | string | null) => {
		if (!date) return "N/A";
		return new Date(date).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Handlers para alternar seleções locais (não atualiza URL ainda)
	const togglePendingBadge = (badge: string) => {
		setPendingBadges(prev =>
			prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
		);
	};

	// Handlers para abrir/fechar Popovers
	const handleBadgesPopoverChange = (open: boolean) => {
		if (open) {
			// Ao abrir, carrega os valores atuais da URL
			setPendingBadges(searchParams.badges || []);
		} else {
			// Ao fechar, aplica as mudanças na URL
			updateSearch({ badges: pendingBadges.length > 0 ? pendingBadges : undefined, page: 1 });
		}
		setBadgesPopoverOpen(open);
	};

	// Handler para remover badge dos pills (atualiza URL imediatamente)
	const toggleBadge = (badge: string) => {
		const current = searchParams.badges || [];
		const updated = current.includes(badge)
			? current.filter(b => b !== badge)
			: [...current, badge];
		updateSearch({ badges: updated.length > 0 ? updated : undefined });
	};

	return (
		<DashboardLayout>
		<div className="container mx-auto px-4 py-3 max-w-7xl">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Rastreador de Ofertas
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Monitore ofertas de anúncios do Facebook
					</p>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)} size="default" className="shadow-sm">
					<Plus className="mr-2 h-4 w-4" />
					Adicionar Oferta
				</Button>
			</div>

			<CreateOfferModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
			/>

			{/* Stats Cards */}
			{stats.isLoading ? (
				<div className="mb-4 grid gap-3 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i} className="overflow-hidden">
							<CardContent className="p-4">
								<Skeleton className="h-4 w-[100px] mb-3" />
								<Skeleton className="h-7 w-[60px] mb-2" />
								<Skeleton className="h-3 w-[80px]" />
							</CardContent>
						</Card>
					))}
				</div>
			) : stats.data ? (
				<div className="mb-4 grid gap-3 md:grid-cols-4">
					<Card className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Ofertas</span>
								<div className="p-2 bg-blue-500/10 rounded-lg">
									<Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								</div>
							</div>
							<div className="text-3xl font-bold text-foreground mb-1">{stats.data.total}</div>
							<div className="text-xs text-muted-foreground">{stats.data.active} ativas</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mais Ativa</span>
								<div className="p-2 bg-orange-500/10 rounded-lg">
									<Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
								</div>
							</div>
							{stats.data.mostActiveOffer ? (
								<>
									<div className="text-xl font-bold truncate mb-1">{stats.data.mostActiveOffer.name}</div>
									<div className="text-xs text-muted-foreground">{stats.data.mostActiveOffer.count} criativos</div>
								</>
							) : (
								<div className="text-sm text-muted-foreground">Sem dados</div>
							)}
						</CardContent>
					</Card>

					<Card className="overflow-hidden border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tendências (24h)</span>
								<div className="p-2 bg-purple-500/10 rounded-lg">
									<TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1.5">
									<div className="p-1.5 bg-green-500/10 rounded">
										<TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
									</div>
									<span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.data.trendingUp}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="p-1.5 bg-red-500/10 rounded">
										<TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
									</div>
									<span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.data.trendingDown}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden border-l-4 border-l-cyan-500 hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coletas</span>
								<div className="p-2 bg-cyan-500/10 rounded-lg">
									<Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">
									Última: <span className="font-medium text-foreground">{formatDate(stats.data.lastScraped)}</span>
								</div>
								<div className="text-xs text-muted-foreground">
									Próxima: <span className="font-medium text-foreground">{formatDate(stats.data.nextScrape)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}

			{/* Filters Card - Compact and Organized */}
			<Card className="mb-4">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base">Filtros</CardTitle>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearAllFilters}>
								<X className="mr-2 h-4 w-4" />
								Limpar Todos
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar por nome, página..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-10 pr-10"
						/>
						{searchInput && (
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
								onClick={() => setSearchInput("")}
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>

					{/* Filters Grid - All in one row on desktop */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
						<Select
							value={searchParams.region || "all"}
							onValueChange={(value) => updateSearch({ region: value === "all" ? undefined : value, page: 1 })}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Região" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas as Regiões</SelectItem>
								{regions.data?.map((r) => (
									<SelectItem key={r.slug} value={r.slug}>
										{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={searchParams.type || "all"}
							onValueChange={(value) => updateSearch({ type: value === "all" ? undefined : value, page: 1 })}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os Tipos</SelectItem>
								{types.data?.map((t) => (
									<SelectItem key={t.slug} value={t.slug}>
										{t.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={searchParams.niche || "all"}
							onValueChange={(value) => updateSearch({ niche: value === "all" ? undefined : value, page: 1 })}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Nicho" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os Nichos</SelectItem>
								{niches.data?.map((n) => (
									<SelectItem key={n.slug} value={n.slug}>
										{n.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Strategy Filter */}
						<Select
							value={searchParams.strategy || "all"}
							onValueChange={(value) => updateSearch({ strategy: value === "all" ? undefined : value, page: 1 })}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Estratégia" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas estratégias</SelectItem>
								{strategies.data?.map((s) => (
									<SelectItem key={s.slug} value={s.slug}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Badges Multi-Select */}
						<Popover open={badgesPopoverOpen} onOpenChange={handleBadgesPopoverChange}>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									<span className="truncate">
										{searchParams.badges?.length
											? `Badges (${searchParams.badges.length})`
											: "Badges"}
									</span>
									<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0" align="start">
								<div className="p-3 border-b">
									<div className="text-sm font-medium">Selecione Badges</div>
									<div className="text-xs text-muted-foreground mt-1">
										{pendingBadges.length} selecionado{pendingBadges.length !== 1 ? 's' : ''}
									</div>
								</div>
								<div className="p-2 max-h-[300px] overflow-y-auto">
									{allBadges.data && allBadges.data.length > 0 ? (
										<div className="space-y-1">
											{allBadges.data.map((badge) => {
												const isChecked = pendingBadges.includes(badge.name);
												return (
													<div
														key={badge.id}
														className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer transition-colors"
														onMouseDown={(e) => {
															e.preventDefault();
															togglePendingBadge(badge.name);
														}}
													>
														<Checkbox
															id={`badge-${badge.id}`}
															checked={isChecked}
															tabIndex={-1}
														/>
														<label
															htmlFor={`badge-${badge.id}`}
															className="text-sm flex-1 cursor-pointer flex items-center gap-1 select-none"
														>
															<span>{badge.icon}</span>
															<span>{badge.name}</span>
														</label>
													</div>
												);
											})}
										</div>
									) : (
										<div className="text-sm text-center text-muted-foreground py-6">
											Nenhum badge disponível
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>

					{/* Active Filter Pills */}
					{hasActiveFilters && (
						<div className="flex flex-wrap gap-2 pt-3 border-t">
							{searchParams.region && (
								<Badge variant="outline" className="gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
									<span>📍 {regions.data?.find(r => r.slug === searchParams.region)?.name}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											updateSearch({ region: undefined, page: 1 });
										}}
										className="ml-0.5 rounded-sm hover:bg-blue-500/20 p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							{searchParams.type && (
								<Badge variant="outline" className="gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
									<span>📦 {types.data?.find(t => t.slug === searchParams.type)?.label}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											updateSearch({ type: undefined, page: 1 });
										}}
										className="ml-0.5 rounded-sm hover:bg-purple-500/20 p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							{searchParams.niche && (
								<Badge variant="outline" className="gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
									<span>🎯 {niches.data?.find(n => n.slug === searchParams.niche)?.label}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											updateSearch({ niche: undefined, page: 1 });
										}}
										className="ml-0.5 rounded-sm hover:bg-green-500/20 p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							{searchParams.strategy && (
								<Badge variant="outline" className="gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20">
									<span>🎨 {strategies.data?.find(s => s.slug === searchParams.strategy)?.label}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											updateSearch({ strategy: undefined, page: 1 });
										}}
										className="ml-0.5 rounded-sm hover:bg-pink-500/20 p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							)}
							{searchParams.badges?.map((badge) => {
								const badgeData = allBadges.data?.find(b => b.name === badge);
								return (
									<Badge key={badge} variant="outline" className="gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
										<span>{badgeData?.icon} {badge}</span>
										<button
											onClick={(e) => {
												e.stopPropagation();
												toggleBadge(badge);
											}}
											className="ml-0.5 rounded-sm hover:bg-red-500/20 p-0.5 transition-colors"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Offers List */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Ofertas</CardTitle>
							<CardDescription>
								{offers.data ? `${offers.data.total} oferta${offers.data.total !== 1 ? 's' : ''} encontrada${offers.data.total !== 1 ? 's' : ''}` : ''}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{offers.isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="relative rounded-xl border bg-card p-5">
									{/* Status stripe skeleton */}
									<Skeleton className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" />

									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0 space-y-3">
											{/* Header skeleton */}
											<div className="space-y-2">
												<Skeleton className="h-6 w-[250px]" />
												<Skeleton className="h-4 w-[180px]" />
											</div>

											{/* Badges skeleton */}
											<div className="flex gap-2">
												<Skeleton className="h-6 w-[80px] rounded-md" />
												<Skeleton className="h-6 w-[90px] rounded-md" />
												<Skeleton className="h-6 w-[70px] rounded-md" />
											</div>
										</div>

										{/* Right section skeleton */}
										<div className="flex-shrink-0 space-y-3">
											<Skeleton className="h-[100px] w-[100px] rounded-lg" />
											<div className="space-y-1.5">
												<Skeleton className="h-7 w-[100px] rounded-md" />
												<Skeleton className="h-7 w-[100px] rounded-md" />
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : offers.data?.data.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 px-4">
							<div className="relative mb-8">
								<div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
								<div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-8 border-2 border-primary/20">
									<Package className="h-16 w-16 text-primary" />
								</div>
							</div>
							<h3 className="text-2xl font-bold mb-3">
								{hasActiveFilters ? "Nenhuma oferta encontrada" : "Nenhuma oferta cadastrada"}
							</h3>
							<p className="text-muted-foreground text-center max-w-lg mb-8 leading-relaxed">
								{hasActiveFilters
									? "Não encontramos ofertas com os filtros aplicados. Tente ajustar os filtros ou criar uma nova oferta."
									: "Comece a rastrear anúncios da Biblioteca de Anúncios do Facebook criando sua primeira oferta e monitore criativos em tempo real."}
							</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<Button
									size="lg"
									onClick={() => setIsCreateModalOpen(true)}
									className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
								>
									<Plus className="mr-2 h-5 w-5" />
									{hasActiveFilters ? "Adicionar Oferta" : "Criar Primeira Oferta"}
								</Button>
								{hasActiveFilters && (
									<Button
										size="lg"
										variant="outline"
										onClick={clearAllFilters}
										className="hover:bg-muted"
									>
										<X className="mr-2 h-4 w-4" />
										Limpar Filtros
									</Button>
								)}
							</div>
						</div>
					) : (
						<>
							<div className="space-y-3">
								{offers.data?.data.map((offer) => {
									const delta = getDeltaForOffer(offer.id);
									return (
										<Link
											key={offer.uuid}
											to="/offers/$offerId"
											params={{ offerId: offer.uuid }}
											className="block"
										>
											<div className="group relative rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
												{/* Status Indicator Stripe */}
												<div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${offer.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />

												<div className="flex items-start justify-between gap-4">
													{/* Left Section - Main Content */}
													<div className="flex-1 min-w-0 space-y-3">
														{/* Header */}
														<div className="flex items-start justify-between gap-3">
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-2 mb-1">
																	<h3 className="font-bold text-lg group-hover:text-primary truncate transition-colors">
																		{offer.name}
																	</h3>
																	{!offer.isActive && (
																		<Badge variant="secondary" className="text-xs font-medium">
																			Inativa
																		</Badge>
																	)}
																	{offer.hasCloaker && (
																		<Badge variant="destructive" className="text-xs font-medium">
																			<Lock className="h-3 w-3 mr-1" />
																			Cloaker
																		</Badge>
																	)}
																</div>

																{/* Pages Info */}
																{offer.pages && offer.pages.length > 0 ? (
																	offer.pages.length === 1 ? (
																		<p className="text-sm text-muted-foreground truncate">
																			{offer.pages[0].pageName || 'Página sem nome'}
																		</p>
																	) : (
																		<div className="mb-1">
																			<Collapsible>
																				<div className="flex items-center gap-2">
																					<span className="text-sm text-muted-foreground">
																						{offer.pages.length} páginas monitoradas
																					</span>
																					<CollapsibleTrigger asChild>
																						<Button
																							variant="ghost"
																							size="sm"
																							className="h-6 px-2 text-xs hover:bg-muted/50"
																							onClick={(e) => e.stopPropagation()}
																						>
																							Ver páginas
																							<ChevronDown className="ml-1 h-3 w-3" />
																						</Button>
																					</CollapsibleTrigger>
																				</div>
																				<CollapsibleContent className="space-y-1 mt-2" onClick={(e) => e.stopPropagation()}>
																					{offer.pages.map((page, idx) => (
																						<div
																							key={page.pageId}
																							className="border-l-2 border-primary/30 pl-3 py-1.5 bg-muted/30 rounded-r"
																						>
																							<div className="flex items-center gap-2">
																								<span className="font-medium text-sm truncate">
																									{page.pageName || `Página ${idx + 1}`}
																								</span>
																								{page.isPrimary && (
																									<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
																										Principal
																									</Badge>
																								)}
																							</div>
																							<a
																								href={page.url}
																								target="_blank"
																								rel="noopener noreferrer"
																								onClick={(e) => e.stopPropagation()}
																								className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
																							>
																								<ExternalLink className="h-3 w-3" />
																								Ver no Facebook
																							</a>
																						</div>
																					))}
																				</CollapsibleContent>
																			</Collapsible>
																		</div>
																	)
																) : (
																	offer.pageName && (
																		<p className="text-sm text-muted-foreground truncate">
																			{offer.pageName}
																		</p>
																	)
																)}
															</div>
														</div>

														{/* Metadata Badges */}
														<div className="flex flex-wrap gap-2">
															<Badge variant="outline" className="text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 px-2.5 py-1">
																<MapPin className="h-3 w-3 mr-1" />
																{offer.regionLabel || offer.region}
															</Badge>
															<Badge variant="outline" className="text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 px-2.5 py-1">
																<Box className="h-3 w-3 mr-1" />
																{offer.typeLabel || offer.type}
															</Badge>
															{offer.niche && (
																<Badge variant="outline" className="text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 px-2.5 py-1">
																	<Target className="h-3 w-3 mr-1" />
																	{offer.nicheLabel || offer.niche}
																</Badge>
															)}
															{offer.strategy && (
																<Badge variant="outline" className="text-xs font-medium bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30 px-2.5 py-1">
																	<Palette className="h-3 w-3 mr-1" />
																	{offer.strategyLabel || offer.strategy}
																</Badge>
															)}
														</div>
													</div>

													{/* Right Section - Metrics & Actions */}
													<div className="flex flex-col items-end gap-3 flex-shrink-0">
														{/* Creative Count Card */}
														{delta && (
															<div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 text-center min-w-[100px] border border-primary/20">
																<div className="text-3xl font-bold text-foreground mb-0.5">
																	{delta.current}
																</div>
																<div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
																	Criativos
																</div>
																{delta.delta !== 0 && (
																	<div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
																		delta.delta > 0
																			? 'bg-green-500/20 text-green-700 dark:text-green-400'
																			: 'bg-red-500/20 text-red-700 dark:text-red-400'
																	}`}>
																		{delta.delta > 0 ? (
																			<TrendingUp className="h-3 w-3" />
																		) : (
																			<TrendingDown className="h-3 w-3" />
																		)}
																		{delta.delta > 0 ? '+' : ''}{delta.delta}
																	</div>
																)}
															</div>
														)}

														{/* Action Buttons */}
														<div className="flex flex-col gap-1.5 w-full">
															<Button
																variant="ghost"
																size="sm"
																className="text-xs justify-start group/btn hover:bg-primary/10 hover:text-primary"
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																}}
															>
																<Eye className="h-3.5 w-3.5 mr-1.5" />
																Ver Detalhes
															</Button>
															{(offer.pages && offer.pages.length > 0 ? (
																<a
																	href={offer.pages.find(p => p.isPrimary)?.url || offer.pages[0].url}
																	target="_blank"
																	rel="noopener noreferrer"
																	onClick={(e) => e.stopPropagation()}
																	className="inline-flex items-center justify-start text-xs text-muted-foreground hover:text-primary px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
																>
																	<ExternalLink className="h-3.5 w-3.5 mr-1.5" />
																	Facebook
																</a>
															) : (
																offer.facebookUrl && (
																	<a
																		href={offer.facebookUrl}
																		target="_blank"
																		rel="noopener noreferrer"
																		onClick={(e) => e.stopPropagation()}
																		className="inline-flex items-center justify-start text-xs text-muted-foreground hover:text-primary px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
																	>
																		<ExternalLink className="h-3.5 w-3.5 mr-1.5" />
																		Facebook
																	</a>
																)
															))}
														</div>
													</div>
												</div>
											</div>
										</Link>
									);
								})}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="mt-6 flex items-center justify-between border-t pt-4">
									<div className="text-sm text-muted-foreground">
										Página {searchParams.page || 1} de {totalPages}
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => updateSearch({ page: Math.max(1, (searchParams.page || 1) - 1) })}
											disabled={(searchParams.page || 1) === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											Anterior
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => updateSearch({ page: Math.min(totalPages, (searchParams.page || 1) + 1) })}
											disabled={(searchParams.page || 1) === totalPages}
										>
											Próxima
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
		</DashboardLayout>
	);
}
