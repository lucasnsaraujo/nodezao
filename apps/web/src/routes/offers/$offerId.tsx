import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ComboboxWithCreate } from "@/components/ui/combobox-with-create";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmojiPickerButton } from "@/components/ui/emoji-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Save, Plus, X, Pencil } from "lucide-react";
import { trpc, queryClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/offers/$offerId")({
	component: OfferDetailRoute,
	beforeLoad: ({ context }) => {
		if (!context.queryClient) {
			throw new Error("No session");
		}
	},
});

const chartConfig = {
	creativeCount: {
		label: "Criativos",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

function OfferDetailRoute() {
	const { offerId } = Route.useParams();

	// Edit mode state
	const [isEditing, setIsEditing] = useState(false);

	// Page selector state (for filtering snapshots)
	const [selectedPageId, setSelectedPageId] = useState<number | 'all'>('all');

	const offer = useQuery(trpc.offer.getById.queryOptions({ uuid: offerId }));

	// Config data queries
	const regions = useQuery(trpc.config.regions.getAll.queryOptions());
	const offerTypes = useQuery(trpc.config.offerTypes.getAll.queryOptions());
	const niches = useQuery(trpc.config.niches.getAll.queryOptions());
	const strategies = useQuery(trpc.config.strategies.getAll.queryOptions());
	const badges = useQuery(trpc.config.badges.getAll.queryOptions());

	// Form state
	const [offerData, setOfferData] = useState({
		name: "",
		region: "",
		type: "",
		niche: "",
		strategy: "",
		landingPageUrl: "",
		description: "",
		hasCloaker: false,
		badges: [] as string[],
	});

	// Badge creation dialog state
	const [badgeDialog, setBadgeDialog] = useState({ open: false, name: "", icon: "🏷️", color: "#EF4444" });

	// Page dialog state
	const [pageDialog, setPageDialog] = useState({ open: false, url: "" });

	// Update offer data when loaded (FIX: using useEffect instead of useState)
	useEffect(() => {
		if (offer.data) {
			setOfferData({
				name: offer.data.name || "",
				region: offer.data.region || "",
				type: offer.data.type || "",
				niche: offer.data.niche || "",
				strategy: offer.data.strategy || "",
				landingPageUrl: offer.data.landingPageUrl || "",
				description: offer.data.description || "",
				hasCloaker: offer.data.hasCloaker || false,
				badges: offer.data.badges || [],
			});
		}
	}, [offer.data]);

	// Mutations
	const updateOffer = useMutation(
		trpc.offer.update.mutationOptions({
			onSuccess: () => {
				toast.success("Oferta atualizada com sucesso!");
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
				setIsEditing(false); // Exit edit mode after save
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar: ${error.message}`);
			},
		})
	);

	const createRegion = useMutation(
		trpc.config.regions.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["config", "regions", "getAll"]] });
			},
		})
	);

	const createOfferType = useMutation(
		trpc.config.offerTypes.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["config", "offerTypes", "getAll"]] });
			},
		})
	);

	const createNiche = useMutation(
		trpc.config.niches.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["config", "niches", "getAll"]] });
			},
		})
	);

	const createStrategy = useMutation(
		trpc.config.strategies.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["config", "strategies", "getAll"]] });
			},
		})
	);

	const createBadge = useMutation(
		trpc.config.badges.create.mutationOptions({
			onSuccess: (newBadge) => {
				queryClient.invalidateQueries({ queryKey: [["config", "badges", "getAll"]] });
				if (newBadge) {
					setOfferData((prev) => ({
						...prev,
						badges: [...prev.badges, newBadge.slug],
					}));
				}
				setBadgeDialog({ open: false, name: "", icon: "🏷️", color: "#EF4444" });
				toast.success("Badge criado e adicionado!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar badge: ${error.message}`);
			},
		})
	);

	const addPageMutation = useMutation(
		trpc.offer.addPage.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
				setPageDialog({ open: false, url: "" });
				toast.success("Página adicionada com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao adicionar página: ${error.message}`);
			},
		})
	);

	// Handle functions
	const handleEdit = () => setIsEditing(true);

	const handleCancel = () => {
		setIsEditing(false);
		// Reset to original data
		if (offer.data) {
			setOfferData({
				name: offer.data.name || "",
				region: offer.data.region || "",
				type: offer.data.type || "",
				niche: offer.data.niche || "",
				strategy: offer.data.strategy || "",
				landingPageUrl: offer.data.landingPageUrl || "",
				description: offer.data.description || "",
				hasCloaker: offer.data.hasCloaker || false,
				badges: offer.data.badges || [],
			});
		}
	};

	const handleSave = () => {
		if (!offerData.name.trim()) {
			toast.error("O nome da oferta é obrigatório");
			return;
		}
		updateOffer.mutate({
			uuid: offerId,
			...offerData,
		});
	};

	const toggleBadge = (slug: string) => {
		if (!isEditing) return; // Only allow toggle in edit mode
		setOfferData((prev) => ({
			...prev,
			badges: prev.badges.includes(slug)
				? prev.badges.filter((b) => b !== slug)
				: [...prev.badges, slug],
		}));
	};

	const handleCreateBadge = () => {
		if (!badgeDialog.name.trim()) {
			toast.error("Digite um nome para o badge");
			return;
		}
		createBadge.mutate({
			name: badgeDialog.name,
			icon: badgeDialog.icon,
			color: badgeDialog.color,
		});
	};

	const handleAddPage = () => {
		if (!pageDialog.url.trim()) {
			toast.error("Digite a URL da página do Facebook");
			return;
		}

		if (!offer.data?.id) {
			toast.error("ID da oferta não encontrado");
			return;
		}

		addPageMutation.mutate({
			offerId: offer.data.id,
			url: pageDialog.url.trim(),
		});
	};

	// Filter snapshots by selected page
	const filteredSnapshots = useMemo(() => {
		if (!offer.data?.snapshots) return [];

		if (selectedPageId === 'all') {
			// Aggregate snapshots by date (sum all pages)
			const grouped = new Map<string, number>();

			offer.data.snapshots.forEach(snap => {
				const date = new Date(snap.scrapedAt).toLocaleDateString('pt-BR', {
					day: '2-digit',
					month: '2-digit',
				});
				grouped.set(date, (grouped.get(date) || 0) + snap.creativeCount);
			});

			return Array.from(grouped, ([date, creativeCount]) => ({
				date,
				creativeCount,
				collectedAt: date, // For compatibility with existing code
			})).sort((a, b) => a.date.localeCompare(b.date));
		} else {
			// Filter only the selected page
			return offer.data.snapshots
				.filter(s => s.pageId === selectedPageId)
				.map(s => ({
					...s,
					date: new Date(s.scrapedAt).toLocaleDateString('pt-BR', {
						day: '2-digit',
						month: '2-digit',
					}),
					collectedAt: s.scrapedAt, // Keep original for display
				}))
				.sort((a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime());
		}
	}, [selectedPageId, offer.data?.snapshots]);

	// Loading state
	if (offer.isLoading) {
		return (
			<DashboardLayout>
				<div className="space-y-6">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-[400px] w-full" />
					<div className="grid gap-6 md:grid-cols-2">
						<Skeleton className="h-[300px] w-full" />
						<Skeleton className="h-[300px] w-full" />
					</div>
				</div>
			</DashboardLayout>
		);
	}

	if (!offer.data) {
		return (
			<DashboardLayout>
				<div className="flex h-[50vh] items-center justify-center">
					<p className="text-muted-foreground">Oferta não encontrada</p>
				</div>
			</DashboardLayout>
		);
	}

	const regionData = regions.data?.find((r) => r.slug === offerData.region);
	const typeData = offerTypes.data?.find((t) => t.slug === offerData.type);
	const nicheData = niches.data?.find((n) => n.slug === offerData.niche);
	const strategyData = strategies.data?.find((s) => s.slug === offerData.strategy);

	return (
		<DashboardLayout>
			<div className="space-y-4">
				{/* Header with breadcrumb */}
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<Link to="/offers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar para ofertas
						</Link>
						<h1 className="text-3xl font-bold tracking-tight">{offer.data.name || "Sem nome"}</h1>
						{offer.data.pageName && (
							<p className="text-sm text-muted-foreground">{offer.data.pageName}</p>
						)}
					</div>
					{offer.data.facebookUrl && (
						<Button variant="outline" asChild>
							<a href={offer.data.facebookUrl} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="mr-2 h-4 w-4" />
								Ver no Facebook
							</a>
						</Button>
					)}
				</div>

				{/* Main Details Card with View/Edit Mode */}
				<motion.div
					layout
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<Card className={isEditing ? "border-primary shadow-md" : ""}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Detalhes da Oferta</CardTitle>
									<CardDescription>
										{isEditing ? "Edite as informações da oferta" : "Informações sobre a oferta"}
									</CardDescription>
								</div>
								<AnimatePresence mode="wait">
									{!isEditing ? (
										<motion.div
											key="edit-button"
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											transition={{ duration: 0.2 }}
										>
											<Button variant="outline" size="sm" onClick={handleEdit}>
												<Pencil className="mr-2 h-4 w-4" />
												Editar
											</Button>
										</motion.div>
									) : (
										<motion.div
											key="cancel-button"
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											transition={{ duration: 0.2 }}
										>
											<Button variant="ghost" size="sm" onClick={handleCancel}>
												<X className="mr-2 h-4 w-4" />
												Cancelar
											</Button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</CardHeader>
						<CardContent>
							<AnimatePresence mode="wait">
								{!isEditing ? (
									// VIEW MODE - Compact 3-column layout
									<motion.div
										key="view-mode"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
									>
										{/* Nome */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Nome</Label>
											<p className="text-sm font-medium">{offerData.name || "—"}</p>
										</div>

										{/* Região */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Região</Label>
											{regionData ? (
												<Badge variant="outline">{regionData.name}</Badge>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Tipo */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Tipo de Produto</Label>
											{typeData ? (
												<Badge variant="outline">{typeData.label}</Badge>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Nicho */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Nicho</Label>
											{nicheData ? (
												<Badge variant="outline">{nicheData.label}</Badge>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Estratégia */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Estratégia</Label>
											{strategyData ? (
												<Badge variant="outline">{strategyData.label}</Badge>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Landing Page URL */}
										<div className="space-y-0.5 sm:col-span-2 lg:col-span-3">
											<Label className="text-xs text-muted-foreground">URL da Landing Page</Label>
											{offerData.landingPageUrl ? (
												<a
													href={offerData.landingPageUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-primary hover:underline"
												>
													{offerData.landingPageUrl}
												</a>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Description */}
										<div className="space-y-0.5 sm:col-span-2 lg:col-span-3">
											<Label className="text-xs text-muted-foreground">Descrição</Label>
											{offerData.description ? (
												<p className="text-sm whitespace-pre-wrap">{offerData.description}</p>
											) : (
												<p className="text-sm text-muted-foreground">—</p>
											)}
										</div>

										{/* Has Cloaker */}
										<div className="space-y-0.5">
											<Label className="text-xs text-muted-foreground">Cloaker</Label>
											{offerData.hasCloaker ? (
												<Badge variant="destructive">🔒 Utiliza cloaker</Badge>
											) : (
												<Badge variant="outline">Sem cloaker</Badge>
											)}
										</div>

										{/* Badges */}
										<div className="space-y-0.5 sm:col-span-2 lg:col-span-3">
											<Label className="text-xs text-muted-foreground">Badges</Label>
											<div className="flex flex-wrap gap-2">
												{offerData.badges.length > 0 ? (
													badges.data
														?.filter((badge) => offerData.badges.includes(badge.slug))
														.map((badge) => (
															<Badge
																key={badge.id}
																style={{ backgroundColor: badge.color || '#EF4444' }}
																className="text-white"
															>
																{badge.icon} {badge.name}
															</Badge>
														))
												) : (
													<p className="text-sm text-muted-foreground">Nenhum badge</p>
												)}
											</div>
										</div>
									</motion.div>
								) : (
									// EDIT MODE - Full-width fields
									<motion.div
										key="edit-mode"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="space-y-6"
									>
										{/* Nome */}
										<div className="space-y-2">
											<Label htmlFor="name">Nome da Oferta</Label>
											<Input
												id="name"
												value={offerData.name}
												onChange={(e) => setOfferData({ ...offerData, name: e.target.value })}
												placeholder="Ex: Curso de Marketing Digital"
											/>
										</div>

										{/* Região */}
										<div className="space-y-2">
											<Label>Região</Label>
											<ComboboxWithCreate
												items={regions.data?.map((r) => ({ value: r.slug, label: r.name })) || []}
												value={offerData.region}
												onValueChange={(value) => setOfferData({ ...offerData, region: value })}
												onCreateNew={async (name) => {
													await createRegion.mutateAsync({ name });
												}}
												placeholder="Selecione uma região"
											/>
										</div>

										{/* Tipo */}
										<div className="space-y-2">
											<Label>Tipo de Produto</Label>
											<ComboboxWithCreate
												items={offerTypes.data?.map((t) => ({ value: t.slug, label: t.label })) || []}
												value={offerData.type}
												onValueChange={(value) => setOfferData({ ...offerData, type: value })}
												onCreateNew={async (label) => {
													await createOfferType.mutateAsync({ label });
												}}
												placeholder="Selecione um tipo"
											/>
										</div>

										{/* Nicho */}
										<div className="space-y-2">
											<Label>Nicho (opcional)</Label>
											<ComboboxWithCreate
												items={niches.data?.map((n) => ({ value: n.slug, label: n.label })) || []}
												value={offerData.niche || ""}
												onValueChange={(value) => setOfferData({ ...offerData, niche: value })}
												onCreateNew={async (label) => {
													await createNiche.mutateAsync({ label });
												}}
												placeholder="Selecione um nicho"
											/>
										</div>

										{/* Strategy */}
										<div className="space-y-2">
											<Label>Estratégia (opcional)</Label>
											<ComboboxWithCreate
												items={strategies.data?.map((s) => ({ value: s.slug, label: s.label })) || []}
												value={offerData.strategy || ""}
												onValueChange={(value) => setOfferData({ ...offerData, strategy: value })}
												onCreateNew={async (label) => {
													await createStrategy.mutateAsync({ label });
												}}
												placeholder="Selecione uma estratégia"
											/>
										</div>

										{/* Landing Page URL */}
										<div className="space-y-2">
											<Label htmlFor="landingPageUrl">URL da Landing Page (opcional)</Label>
											<Input
												id="landingPageUrl"
												type="url"
												value={offerData.landingPageUrl}
												onChange={(e) => setOfferData({ ...offerData, landingPageUrl: e.target.value })}
												placeholder="https://exemplo.com/pagina"
											/>
										</div>

										{/* Description */}
										<div className="space-y-2">
											<Label htmlFor="description">Descrição (opcional)</Label>
											<Textarea
												id="description"
												value={offerData.description}
												onChange={(e) => setOfferData({ ...offerData, description: e.target.value })}
												placeholder="Adicione observações, anotações ou detalhes sobre esta oferta..."
												rows={3}
											/>
											<p className="text-xs text-muted-foreground">
												Máximo de 1000 caracteres
											</p>
										</div>

										{/* Has Cloaker */}
										<div className="flex items-center space-x-2">
											<Checkbox
												id="hasCloaker"
												checked={offerData.hasCloaker}
												onCheckedChange={(checked) =>
													setOfferData({ ...offerData, hasCloaker: checked as boolean })
												}
											/>
											<Label
												htmlFor="hasCloaker"
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
											>
												Utiliza cloaker
											</Label>
										</div>

										{/* Badges */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label>Badges</Label>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setBadgeDialog({ ...badgeDialog, open: true })}
												>
													<Plus className="mr-2 h-4 w-4" />
													Novo Badge
												</Button>
											</div>
											<div className="flex flex-wrap gap-2">
												{badges.data?.map((badge) => (
													<Badge
														key={badge.id}
														variant={offerData.badges.includes(badge.slug) ? "default" : "outline"}
														className="cursor-pointer transition-all hover:scale-105"
														style={
															offerData.badges.includes(badge.slug)
																? { backgroundColor: badge.color || '#EF4444', color: 'white' }
																: {}
														}
														onClick={() => toggleBadge(badge.slug)}
													>
														{badge.icon} {badge.name}
													</Badge>
												))}
												{badges.data?.length === 0 && (
													<p className="text-sm text-muted-foreground">
														Nenhum badge disponível. Crie o primeiro!
													</p>
												)}
											</div>
										</div>

										{/* Save Button */}
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.1 }}
											className="flex justify-end gap-2 border-t pt-4"
										>
											<Button variant="outline" onClick={handleCancel}>
												Cancelar
											</Button>
											<Button onClick={handleSave} disabled={updateOffer.isPending}>
												{updateOffer.isPending ? (
													<>Salvando...</>
												) : (
													<>
														<Save className="mr-2 h-4 w-4" />
														Salvar Alterações
													</>
												)}
											</Button>
										</motion.div>
									</motion.div>
								)}
							</AnimatePresence>
						</CardContent>
					</Card>
				</motion.div>

				{/* Page Selector (if multiple pages exist) */}
				{offer.data.pages && offer.data.pages.length > 1 && (
					<Card>
						<CardHeader>
							<CardTitle>Filtrar por Página</CardTitle>
							<CardDescription>Visualize métricas de uma página específica ou o total agregado</CardDescription>
						</CardHeader>
						<CardContent>
							<Select
								value={String(selectedPageId)}
								onValueChange={(v) => setSelectedPageId(v === 'all' ? 'all' : Number(v))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										📊 Todas as Páginas (Total Agregado)
									</SelectItem>
									{offer.data.pages.map(page => (
										<SelectItem key={page.pageId} value={String(page.pageId)}>
											{page.pageName || 'Página sem nome'}
											{page.isPrimary && ' (Principal)'}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>
				)}

				{/* Chart and Pages Section - Side by Side */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Chart Section - Creative Count History */}
					<Card>
						<CardHeader>
							<CardTitle>Histórico de Criativos</CardTitle>
							<CardDescription>
								Evolução do número de criativos ao longo do tempo
								{selectedPageId !== 'all' && offer.data.pages && offer.data.pages.length > 1 &&
									` - ${offer.data.pages.find(p => p.pageId === selectedPageId)?.pageName || 'Página selecionada'}`
								}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{filteredSnapshots.length > 0 ? (
								<ChartContainer config={chartConfig} className="h-[300px] w-full">
									<LineChart data={filteredSnapshots}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="date"
											tickLine={false}
											axisLine={false}
											tickMargin={8}
										/>
										<YAxis
											tickLine={false}
											axisLine={false}
											tickMargin={8}
										/>
										<ChartTooltip content={<ChartTooltipContent />} />
										<Line
											type="monotone"
											dataKey="creativeCount"
											stroke={chartConfig.creativeCount.color}
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
									</LineChart>
								</ChartContainer>
							) : (
								<div className="flex items-center justify-center h-[300px] text-muted-foreground">
									<p className="text-sm">Nenhum dado disponível para exibir</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Monitored Pages Section */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Páginas Monitoradas</CardTitle>
									<CardDescription>
										{offer.data.pages && offer.data.pages.length > 0
											? offer.data.pages.length === 1
												? 'Esta oferta monitora 1 página do Facebook'
												: `Esta oferta monitora ${offer.data.pages.length} páginas do Facebook`
											: 'Adicione páginas do Facebook para monitorar'
										}
									</CardDescription>
								</div>
								<Button variant="outline" size="sm" onClick={() => setPageDialog({ open: true, url: "" })}>
									<Plus className="mr-2 h-4 w-4" />
									Adicionar Página
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{offer.data.pages && offer.data.pages.length > 0 ? (
								offer.data.pages.map((page, idx) => {
									// Get the latest snapshot for this page
									const latestSnapshot = offer.data.snapshots
										?.filter(s => s.pageId === page.pageId)
										.sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())[0];

									return (
										<div
											key={page.pageId}
											className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
										>
											<div className="flex-1">
												<div className="font-medium flex items-center gap-2">
													{page.pageName || `Página ${idx + 1}`}
													<Badge variant={page.isPrimary ? "default" : "secondary"} className="text-xs">
														{page.isPrimary ? 'Principal' : 'Secundária'}
													</Badge>
												</div>
												<a
													href={page.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
												>
													<ExternalLink className="h-3 w-3" />
													{page.url}
												</a>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium">
													{latestSnapshot?.creativeCount || 0} criativos
												</p>
												<p className="text-xs text-muted-foreground">
													{latestSnapshot
														? `Última coleta: ${new Date(latestSnapshot.scrapedAt).toLocaleDateString('pt-BR')} às ${new Date(latestSnapshot.scrapedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
														: 'Nenhuma coleta'
													}
												</p>
											</div>
										</div>
									);
								})
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
									<p className="text-sm">Nenhuma página adicionada ainda</p>
									<p className="text-xs mt-1">Clique em "Adicionar Página" para começar a monitorar</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Create Badge Dialog */}
				<Dialog open={badgeDialog.open} onOpenChange={(open) => setBadgeDialog({ ...badgeDialog, open })}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Badge</DialogTitle>
							<DialogDescription>
								O badge será criado e automaticamente adicionado a esta oferta
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="badge-name">Nome</Label>
								<Input
									id="badge-name"
									value={badgeDialog.name}
									onChange={(e) => setBadgeDialog({ ...badgeDialog, name: e.target.value })}
									placeholder="Ex: Escalando, Top, Verificado"
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label>Emoji</Label>
								<EmojiPickerButton
									emoji={badgeDialog.icon}
									onEmojiSelect={(emoji) => setBadgeDialog({ ...badgeDialog, icon: emoji })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Cor</Label>
								<ColorPicker
									color={badgeDialog.color}
									onChange={(color) => setBadgeDialog({ ...badgeDialog, color })}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setBadgeDialog({ open: false, name: "", icon: "🏷️", color: "#EF4444" })}>
								Cancelar
							</Button>
							<Button onClick={handleCreateBadge} disabled={!badgeDialog.name || createBadge.isPending}>
								{createBadge.isPending ? "Criando..." : "Criar e Adicionar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Add Page Dialog */}
				<Dialog open={pageDialog.open} onOpenChange={(open) => {
					if (!addPageMutation.isPending) {
						setPageDialog({ ...pageDialog, open });
					}
				}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Adicionar Página do Facebook</DialogTitle>
							<DialogDescription>
								Cole a URL da Biblioteca de Anúncios do Facebook para monitorar uma nova página
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="page-url">URL da Biblioteca de Anúncios</Label>
								<Input
									id="page-url"
									type="url"
									value={pageDialog.url}
									onChange={(e) => setPageDialog({ ...pageDialog, url: e.target.value })}
									placeholder="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=..."
									autoFocus
									disabled={addPageMutation.isPending}
								/>
								<p className="text-xs text-muted-foreground">
									Cole a URL completa da página de busca da Biblioteca de Anúncios do Facebook
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setPageDialog({ open: false, url: "" })}
								disabled={addPageMutation.isPending}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleAddPage}
								disabled={!pageDialog.url.trim() || addPageMutation.isPending}
							>
								{addPageMutation.isPending ? "Adicionando..." : "Adicionar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	);
}
