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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/dashboard-layout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight, Clock, Flame, X, ChevronDown, Package, Lock, Activity, RefreshCw, Check } from "lucide-react";
import { trpc, queryClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { toast } from "sonner";

// Type for search params
type OffersSearch = {
	search?: string;
	region?: string;
	type?: string;
	niche?: string;
	strategy?: string;
	badges?: string[];
	page?: number;
	sortBy?: 'creatives-desc' | 'creatives-asc' | 'name-asc';
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
			sortBy: (search.sortBy as 'creatives-desc' | 'creatives-asc' | 'name-asc') || 'creatives-desc',
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

	const pageSize = 12;

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
	const detailedDeltas = useQuery(trpc.snapshot.getDetailedDeltas.queryOptions());

	// Fetch filter options
	const regions = useQuery(trpc.config.regions.getAll.queryOptions());
	const types = useQuery(trpc.config.offerTypes.getAll.queryOptions());
	const niches = useQuery(trpc.config.niches.getAll.queryOptions());
	const strategies = useQuery(trpc.config.strategies.getAll.queryOptions());
	const allBadges = useQuery(trpc.config.badges.getAll.queryOptions());

	const totalPages = offers.data ? Math.ceil(offers.data.total / pageSize) : 0;

	const getDetailedDeltaForOffer = (offerId: number) => {
		return detailedDeltas.data?.find((d) => d.offerId === offerId);
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

	// Refresh mutation with per-offer state tracking
	const [refreshingOffers, setRefreshingOffers] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

	const triggerRefreshMutation = useMutation({
		mutationFn: async ({ uuid }: { uuid: string }) => {
			const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/trigger-refresh/${uuid}`, {
				method: 'POST',
				credentials: 'include',
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to trigger refresh');
			}

			return response.json();
		},
		onMutate: (variables) => {
			setRefreshingOffers(prev => ({ ...prev, [variables.uuid]: 'loading' }));
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: [["offer", "getAll"]] });
			queryClient.invalidateQueries({ queryKey: [["snapshot", "getDetailedDeltas"]] });
			setRefreshingOffers(prev => ({ ...prev, [variables.uuid]: 'success' }));
			toast.success(data.message || "Dados atualizados!");

			// Reset to idle after 2 seconds
			setTimeout(() => {
				setRefreshingOffers(prev => ({ ...prev, [variables.uuid]: 'idle' }));
			}, 2000);
		},
		onError: (error: Error, variables) => {
			setRefreshingOffers(prev => ({ ...prev, [variables.uuid]: 'error' }));
			toast.error(`Erro: ${error.message}`);

			// Reset to idle after 3 seconds
			setTimeout(() => {
				setRefreshingOffers(prev => ({ ...prev, [variables.uuid]: 'idle' }));
			}, 3000);
		},
	});

	return (
		<DashboardLayout>
		<TooltipProvider>
		<div className="container mx-auto px-4 py-6 max-w-7xl">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-page-title">
						Rastreador de Ofertas
					</h1>
					<p className="text-body-sm text-muted-foreground mt-1">
						Monitore ofertas de anúncios do Facebook em tempo real
					</p>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)} size="lg" className="hover-scale shadow-lg">
					<Plus className="mr-2 h-5 w-5" />
					Nova Oferta
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
				<div className="mb-6 grid gap-4 md:grid-cols-4">
					{/* Total Offers */}
					<Card className="overflow-hidden border-info/30 hover-lift">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-overline text-muted-foreground">Total de Ofertas</span>
								<div className="p-2.5 bg-info/10 rounded-xl">
									<Activity className="h-5 w-5 text-info" />
								</div>
							</div>
							<div className="text-4xl font-bold text-foreground mb-1.5">{stats.data.total}</div>
							<div className="text-caption text-muted-foreground">{stats.data.active} ativas</div>
						</CardContent>
					</Card>

					{/* Most Active */}
					<Card className="overflow-hidden border-primary/30 hover-lift">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-overline text-muted-foreground">Mais Ativa</span>
								<div className="p-2.5 bg-primary/10 rounded-xl">
									<Flame className="h-5 w-5 text-primary" />
								</div>
							</div>
							{stats.data.mostActiveOffer ? (
								<>
									<div className="text-xl font-bold truncate mb-1.5" title={stats.data.mostActiveOffer.name}>
										{stats.data.mostActiveOffer.name}
									</div>
									<div className="text-caption text-muted-foreground">
										{stats.data.mostActiveOffer.count} criativos
									</div>
								</>
							) : (
								<div className="text-body-sm text-muted-foreground">Sem dados</div>
							)}
						</CardContent>
					</Card>

					{/* Trends (24h) */}
					<Card className="overflow-hidden border-success/30 hover-lift">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-overline text-muted-foreground">Tendências (24h)</span>
								<div className="p-2.5 bg-success/10 rounded-xl">
									<TrendingUp className="h-5 w-5 text-success" />
								</div>
							</div>
							<div className="flex items-center gap-6">
								<div className="flex items-center gap-2">
									<div className="p-2 bg-success/15 rounded-lg">
										<TrendingUp className="h-4 w-4 text-success" />
									</div>
									<span className="text-3xl font-bold text-success">{stats.data.trendingUp}</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="p-2 bg-danger/15 rounded-lg">
										<TrendingDown className="h-4 w-4 text-danger" />
									</div>
									<span className="text-3xl font-bold text-danger">{stats.data.trendingDown}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Scrape Schedule */}
					<Card className="overflow-hidden border-warning/30 hover-lift">
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-3">
								<span className="text-overline text-muted-foreground">Coletas</span>
								<div className="p-2.5 bg-warning/10 rounded-xl">
									<Clock className="h-5 w-5 text-warning" />
								</div>
							</div>
							<div className="space-y-1.5">
								<div className="text-caption text-muted-foreground">
									Última: <span className="font-semibold text-foreground">{formatDate(stats.data.lastScraped)}</span>
								</div>
								<div className="text-caption text-muted-foreground">
									Próxima: <span className="font-semibold text-foreground">{formatDate(stats.data.nextScrape)}</span>
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
					{/* Search Bar + Sorting */}
					<div className="flex gap-3">
						<div className="relative flex-1">
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
						<Select
							value={searchParams.sortBy || 'creatives-desc'}
							onValueChange={(value) => updateSearch({ sortBy: value as OffersSearch['sortBy'], page: 1 })}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Ordenar por" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="creatives-desc">Mais criativos</SelectItem>
								<SelectItem value="creatives-asc">Menos criativos</SelectItem>
								<SelectItem value="name-asc">Nome (A-Z)</SelectItem>
							</SelectContent>
						</Select>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{Array.from({ length: 12 }).map((_, i) => (
								<div key={i} className="relative rounded-xl border bg-card p-4 h-[240px] overflow-hidden">
									{/* Status stripe skeleton */}
									<Skeleton className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" />

									<div className="flex flex-col gap-3 h-full">
										{/* Header skeleton */}
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 space-y-1.5">
												<Skeleton className="h-5 w-[180px]" />
												<Skeleton className="h-3.5 w-[140px]" />
											</div>
											<Skeleton className="h-7 w-7 rounded-md" />
										</div>

										{/* Metrics skeleton */}
										<div className="flex items-center gap-4">
											<Skeleton className="h-9 w-16" />
											<Skeleton className="h-7 w-16 rounded-md" />
										</div>

										{/* 3-day delta skeleton */}
										<Skeleton className="h-7 w-24 rounded" />

										{/* Divider */}
										<div className="border-t" />

										{/* Footer badges skeleton */}
										<div className="flex flex-col gap-2 mt-auto">
											<div className="flex gap-1">
												<Skeleton className="h-5 w-16 rounded-md" />
												<Skeleton className="h-5 w-14 rounded-md" />
												<Skeleton className="h-5 w-20 rounded-md" />
												<Skeleton className="h-5 w-12 rounded-md" />
											</div>
											<div className="flex gap-1">
												<Skeleton className="h-5 w-16 rounded-md" />
												<Skeleton className="h-5 w-20 rounded-md" />
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : offers.data?.data.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 px-4">
							<div className="relative mb-8">
								<div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
								<div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-8 border-2 border-primary/20 hover-lift">
									<Package className="h-20 w-20 text-primary" />
								</div>
							</div>
							<h3 className="text-section-title mb-3">
								{hasActiveFilters ? "Nenhuma oferta encontrada" : "Nenhuma oferta cadastrada"}
							</h3>
							<p className="text-body text-muted-foreground text-center max-w-lg mb-10 leading-relaxed">
								{hasActiveFilters
									? "Não encontramos ofertas com os filtros aplicados. Tente ajustar os filtros ou criar uma nova oferta."
									: "Comece a rastrear anúncios da Biblioteca de Anúncios do Facebook criando sua primeira oferta e monitore criativos em tempo real."}
							</p>
							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									size="lg"
									onClick={() => setIsCreateModalOpen(true)}
									className="shadow-lg hover:shadow-2xl hover-scale"
								>
									<Plus className="mr-2 h-5 w-5" />
									{hasActiveFilters ? "Adicionar Oferta" : "Criar Primeira Oferta"}
								</Button>
								{hasActiveFilters && (
									<Button
										size="lg"
										variant="outline"
										onClick={clearAllFilters}
										className="hover-lift"
									>
										<X className="mr-2 h-4 w-4" />
										Limpar Filtros
									</Button>
								)}
							</div>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{offers.data?.data
									.slice()
									.sort((a, b) => {
										const sortBy = searchParams.sortBy || 'creatives-desc';
										const deltaA = getDetailedDeltaForOffer(a.id);
										const deltaB = getDetailedDeltaForOffer(b.id);

										if (sortBy === 'creatives-desc') {
											return (deltaB?.current ?? 0) - (deltaA?.current ?? 0);
										} else if (sortBy === 'creatives-asc') {
											return (deltaA?.current ?? 0) - (deltaB?.current ?? 0);
										} else if (sortBy === 'name-asc') {
											return (a.name || '').localeCompare(b.name || '');
										}
										return 0;
									})
									.map((offer) => {
									const detailedDelta = getDetailedDeltaForOffer(offer.id);
									const primaryPage = offer.pages?.find(p => p.isPrimary) || offer.pages?.[0];
									const refreshState = refreshingOffers[offer.uuid] || 'idle';

									return (
										<div key={offer.uuid} className="relative group">
											<Link
												to="/offers/$offerId"
												params={{ offerId: offer.uuid }}
												className="block"
											>
												<Card className="h-[240px] transition-all hover:border-primary/50 hover:shadow-lg relative overflow-hidden">
													{/* Status stripe */}
													<Tooltip>
														<TooltipTrigger asChild>
															<div className={`absolute top-0 left-0 right-0 h-1 ${offer.isActive ? 'bg-success' : 'bg-muted'}`} />
														</TooltipTrigger>
														<TooltipContent>
															<p>{offer.isActive ? 'Oferta ativa' : 'Oferta inativa'}</p>
														</TooltipContent>
													</Tooltip>

													<CardContent className="p-4 h-full flex flex-col gap-3">
														{/* Header: Name + Refresh Button */}
														<div className="flex items-start justify-between gap-2">
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-1.5 mb-0.5">
																	<h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
																		{offer.name}
																	</h3>
																	{offer.hasCloaker && (
																		<Tooltip>
																			<TooltipTrigger asChild>
																				<Lock className="h-3 w-3 text-danger shrink-0" />
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Oferta usa cloaker (redirecionamento)</p>
																			</TooltipContent>
																		</Tooltip>
																	)}
																</div>
																{primaryPage && (
																	<p className="text-xs text-muted-foreground truncate">
																		{primaryPage.pageName || 'Página sem nome'}
																	</p>
																)}
															</div>
															{/* Refresh button */}
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 shrink-0"
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			triggerRefreshMutation.mutate({ uuid: offer.uuid });
																		}}
																		disabled={refreshState === 'loading'}
																	>
																		{refreshState === 'loading' ? (
																			<Loader2 className="h-3.5 w-3.5 animate-spin" />
																		) : refreshState === 'success' ? (
																			<Check className="h-3.5 w-3.5 text-success" />
																		) : refreshState === 'error' ? (
																			<X className="h-3.5 w-3.5 text-danger" />
																		) : (
																			<RefreshCw className="h-3.5 w-3.5" />
																		)}
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Atualizar dados desta oferta</p>
																</TooltipContent>
															</Tooltip>
														</div>

														{/* Metrics Section */}
														<div className="flex items-center gap-4">
															{/* Current count */}
															<Tooltip>
																<TooltipTrigger asChild>
																	<div className="flex items-end gap-2">
																		<div className="text-3xl font-bold text-foreground leading-none">
																			{detailedDelta?.current ?? '-'}
																		</div>
																		<div className="text-xs text-muted-foreground mb-1">criativos</div>
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Total de anúncios ativos encontrados</p>
																</TooltipContent>
															</Tooltip>

															{/* 24h delta */}
															{detailedDelta && detailedDelta.delta24h !== 0 && (
																<Tooltip>
																	<TooltipTrigger asChild>
																		<div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
																			detailedDelta.delta24h > 0
																				? 'bg-success/10 text-success'
																				: 'bg-danger/10 text-danger'
																		}`}>
																			{detailedDelta.delta24h > 0 ? (
																				<TrendingUp className="h-3.5 w-3.5" />
																			) : (
																				<TrendingDown className="h-3.5 w-3.5" />
																			)}
																			<span className="text-sm font-semibold">
																				{detailedDelta.delta24h > 0 ? '+' : ''}{detailedDelta.delta24h}
																			</span>
																		</div>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>Variação nas últimas 24 horas</p>
																	</TooltipContent>
																</Tooltip>
															)}
														</div>

														{/* 3-day delta */}
														{detailedDelta && detailedDelta.delta3d !== 0 && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<div className={`flex items-center gap-1 px-2 py-1 rounded ${
																		detailedDelta.delta3d > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
																	}`}>
																		<span className="text-xs font-medium">
																			3 dias: {detailedDelta.delta3d > 0 ? '+' : ''}{detailedDelta.delta3d}
																		</span>
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Variação nos últimos 3 dias</p>
																</TooltipContent>
															</Tooltip>
														)}

														{/* Divider */}
														<div className="border-t" />

														{/* Footer: Metadata + Badges */}
														<div className="flex flex-col gap-2 mt-auto">
															{/* Metadata badges */}
															{(offer.regionLabel || offer.typeLabel || offer.nicheLabel || offer.strategyLabel) && (
																<div className="flex flex-wrap gap-1">
																	{offer.regionLabel && (
																		<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
																			📍 {offer.regionLabel}
																		</Badge>
																	)}
																	{offer.typeLabel && (
																		<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
																			📦 {offer.typeLabel}
																		</Badge>
																	)}
																	{offer.nicheLabel && (
																		<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
																			🎯 {offer.nicheLabel}
																		</Badge>
																	)}
																	{offer.strategyLabel && (
																		<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
																			🎨 {offer.strategyLabel}
																		</Badge>
																	)}
																</div>
															)}

															{/* Custom badges */}
															{offer.badges && offer.badges.length > 0 && (
																<div className="flex flex-wrap gap-1">
																	{offer.badges.map((badgeName: string) => {
																		const badgeData = allBadges.data?.find(b => b.name === badgeName);
																		return (
																			<Badge
																				key={badgeName}
																				variant="secondary"
																				className="text-[10px] px-1.5 py-0 h-5"
																				style={badgeData?.color ? { backgroundColor: `${badgeData.color}15`, color: badgeData.color, borderColor: `${badgeData.color}30` } : {}}
																			>
																				{badgeData?.icon} {badgeName}
																			</Badge>
																		);
																	})}
																</div>
															)}
														</div>
													</CardContent>
												</Card>
											</Link>
										</div>
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
		</TooltipProvider>
		</DashboardLayout>
	);
}
