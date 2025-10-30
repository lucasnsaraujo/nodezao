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
import { DashboardLayout } from "@/components/dashboard-layout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, ExternalLink, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight, Clock, Flame, X, ChevronDown } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { CreateOfferModal } from "@/components/create-offer-modal";

// Type for search params
type OffersSearch = {
	search?: string;
	region?: string;
	type?: string;
	niche?: string;
	tags?: string[];
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
			tags: (search.tags as string[]) || undefined,
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
	const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
	const [badgesPopoverOpen, setBadgesPopoverOpen] = useState(false);
	const [pendingTags, setPendingTags] = useState<string[]>([]);
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
		tags: searchParams.tags,
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
	const allTags = useQuery(trpc.config.tags.getAll.queryOptions());
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
		searchParams.niche || searchParams.tags?.length || searchParams.badges?.length;

	const formatDate = (date: Date | null) => {
		if (!date) return "N/A";
		return new Date(date).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Handlers para alternar seleções locais (não atualiza URL ainda)
	const togglePendingTag = (tag: string) => {
		setPendingTags(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		);
	};

	const togglePendingBadge = (badge: string) => {
		setPendingBadges(prev =>
			prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
		);
	};

	// Handlers para abrir/fechar Popovers
	const handleTagsPopoverChange = (open: boolean) => {
		if (open) {
			// Ao abrir, carrega os valores atuais da URL
			setPendingTags(searchParams.tags || []);
		} else {
			// Ao fechar, aplica as mudanças na URL
			updateSearch({ tags: pendingTags.length > 0 ? pendingTags : undefined, page: 1 });
		}
		setTagsPopoverOpen(open);
	};

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

	// Handler para remover tag/badge dos pills (atualiza URL imediatamente)
	const toggleTag = (tag: string) => {
		const current = searchParams.tags || [];
		const updated = current.includes(tag)
			? current.filter(t => t !== tag)
			: [...current, tag];
		updateSearch({ tags: updated.length > 0 ? updated : undefined });
	};

	const toggleBadge = (badge: string) => {
		const current = searchParams.badges || [];
		const updated = current.includes(badge)
			? current.filter(b => b !== badge)
			: [...current, badge];
		updateSearch({ badges: updated.length > 0 ? updated : undefined });
	};

	return (
		<DashboardLayout>
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Rastreador de Ofertas
					</h1>
					<p className="text-muted-foreground">
						Monitore ofertas de anúncios do Facebook
					</p>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)}>
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
				<div className="mb-6 grid gap-4 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-[140px]" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-[60px] mb-2" />
								<Skeleton className="h-3 w-[80px]" />
							</CardContent>
						</Card>
					))}
				</div>
			) : stats.data ? (
				<div className="mb-6 grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<TrendingUp className="h-4 w-4" />
								Total de Ofertas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.data.total}</div>
							<div className="text-xs text-muted-foreground mt-1">{stats.data.active} ativas</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Flame className="h-4 w-4" />
								Oferta Mais Ativa
							</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.data.mostActiveOffer ? (
								<>
									<div className="text-lg font-bold truncate">{stats.data.mostActiveOffer.name}</div>
									<div className="text-xs text-muted-foreground">{stats.data.mostActiveOffer.count} criativos</div>
								</>
							) : (
								<div className="text-sm text-muted-foreground">Sem dados</div>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Tendências (24h)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1 text-green-500">
									<TrendingUp className="h-4 w-4" />
									<span className="text-xl font-bold">{stats.data.trendingUp}</span>
								</div>
								<div className="flex items-center gap-1 text-red-500">
									<TrendingDown className="h-4 w-4" />
									<span className="text-xl font-bold">{stats.data.trendingDown}</span>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4" />
								Coletas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">
									Última: {formatDate(stats.data.lastScraped)}
								</div>
								<div className="text-xs text-muted-foreground">
									Próxima: {formatDate(stats.data.nextScrape)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}

			{/* Filters Card - Compact and Organized */}
			<Card className="mb-6">
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
							placeholder="Buscar por nome, página, tags..."
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
								{regions.data?.filter(r => r.isActive).map((r) => (
									<SelectItem key={r.code} value={r.code}>
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
								{types.data?.filter(t => t.isActive).map((t) => (
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
								{niches.data?.filter(n => n.isActive).map((n) => (
									<SelectItem key={n.slug} value={n.slug}>
										{n.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Tags Multi-Select */}
						<Popover open={tagsPopoverOpen} onOpenChange={handleTagsPopoverChange}>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									<span className="truncate">
										{searchParams.tags?.length
											? `Tags (${searchParams.tags.length})`
											: "Tags"}
									</span>
									<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0" align="start">
								<div className="p-3 border-b">
									<div className="text-sm font-medium">Selecione Tags</div>
									<div className="text-xs text-muted-foreground mt-1">
										{pendingTags.length} selecionada{pendingTags.length !== 1 ? 's' : ''}
									</div>
								</div>
								<div className="p-2 max-h-[300px] overflow-y-auto">
									{allTags.data && allTags.data.length > 0 ? (
										<div className="space-y-1">
											{allTags.data.map((tag) => {
												const isChecked = pendingTags.includes(tag.name);
												return (
													<div
														key={tag.id}
														className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer transition-colors"
														onMouseDown={(e) => {
															e.preventDefault();
															togglePendingTag(tag.name);
														}}
													>
														<Checkbox
															id={`tag-${tag.id}`}
															checked={isChecked}
															readOnly
															tabIndex={-1}
														/>
														<label
															htmlFor={`tag-${tag.id}`}
															className="text-sm flex-1 cursor-pointer select-none"
														>
															{tag.name}
														</label>
													</div>
												);
											})}
										</div>
									) : (
										<div className="text-sm text-center text-muted-foreground py-6">
											Nenhuma tag disponível
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>

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
															readOnly
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
									<span>📍 {regions.data?.find(r => r.code === searchParams.region)?.name}</span>
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
							{searchParams.tags?.map((tag) => (
								<Badge key={tag} variant="outline" className="gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
									<span>🏷️ {tag}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											toggleTag(tag);
										}}
										className="ml-0.5 rounded-sm hover:bg-orange-500/20 p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
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
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="rounded-lg border p-2">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0 space-y-2">
											<Skeleton className="h-5 w-[200px]" />
											<Skeleton className="h-4 w-[160px]" />
											<div className="flex gap-1">
												<Skeleton className="h-5 w-[70px]" />
												<Skeleton className="h-5 w-[80px]" />
												<Skeleton className="h-5 w-[60px]" />
											</div>
										</div>
										<div className="text-right flex-shrink-0 space-y-2">
											<Skeleton className="h-6 w-[40px] ml-auto" />
											<Skeleton className="h-3 w-[60px] ml-auto" />
											<Skeleton className="h-4 w-[100px] ml-auto" />
										</div>
									</div>
								</div>
							))}
						</div>
					) : offers.data?.data.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-muted-foreground">
								Nenhuma oferta encontrada com os filtros aplicados.
							</p>
							<Button
								className="mt-4"
								variant="outline"
								onClick={() => setIsCreateModalOpen(true)}
							>
								<Plus className="mr-2 h-4 w-4" />
								Adicionar primeira oferta
							</Button>
						</div>
					) : (
						<>
							<div className="space-y-2">
								{offers.data?.data.map((offer) => {
									const delta = getDeltaForOffer(offer.id);
									return (
										<Link
											key={offer.uuid}
											to="/offers/$offerId"
											params={{ offerId: offer.uuid }}
										>
											<div className="group rounded-lg border p-2 transition-all hover:border-primary hover:shadow-md">
												<div className="flex items-start justify-between gap-3">
													<div className="flex-1 min-w-0">
														<div className="mb-1 flex items-center gap-2">
															<h3 className="font-semibold text-sm group-hover:text-primary truncate">
																{offer.name}
															</h3>
															{!offer.isActive && (
																<Badge variant="secondary" className="text-xs">Inativa</Badge>
															)}
														</div>

														{offer.pageName && (
															<p className="mb-1 text-xs text-muted-foreground truncate">
																{offer.pageName}
															</p>
														)}

														<div className="flex flex-wrap gap-1">
															<Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
																📍 {offer.regionLabel || offer.region}
															</Badge>
															<Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
																📦 {offer.typeLabel || offer.type}
															</Badge>
															{offer.niche && (
																<Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
																	🎯 {offer.nicheLabel || offer.niche}
																</Badge>
															)}
															{offer.tags?.map((tag) => (
																<Badge key={tag} variant="secondary" className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
																	🏷️ {tag}
																</Badge>
															))}
														</div>
													</div>

													<div className="ml-3 text-right flex-shrink-0">
														{delta && (
															<div className="mb-1">
																<div className="text-xl font-bold">
																	{delta.current}
																</div>
																<div className="text-xs text-muted-foreground">
																	criativos
																</div>
																{delta.delta !== 0 && (
																	<div
																		className={delta.delta > 0
																			? "text-green-500 mt-0.5 flex items-center justify-end text-xs"
																			: "text-red-500 mt-0.5 flex items-center justify-end text-xs"
																		}
																	>
																		{delta.delta > 0 ? (
																			<TrendingUp className="mr-0.5 h-3 w-3" />
																		) : (
																			<TrendingDown className="mr-0.5 h-3 w-3" />
																		)}
																		{Math.abs(delta.delta)}
																	</div>
																)}
															</div>
														)}
														<a
															href={offer.facebookUrl}
															target="_blank"
															rel="noopener noreferrer"
															onClick={(e) => e.stopPropagation()}
															className="inline-flex items-center text-xs text-muted-foreground hover:text-primary"
														>
															<ExternalLink className="mr-1 h-3 w-3" />
															Ver no Facebook
														</a>
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
