import { useState, useEffect, useMemo, useRef } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);
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
import { ArrowLeft, ExternalLink, Save, Plus, X, Pencil, Package, Loader2, Check, RefreshCw, Trash2 } from "lucide-react";
import { trpc, queryClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/offers/$offerId")({
	component: OfferDetailRoute,
	beforeLoad: ({ context }) => {
		if (!context.queryClient) {
			throw new Error("No session");
		}
	},
});

// Chart configuration removed - now using Chart.js directly

function OfferDetailRoute() {
	const { offerId } = Route.useParams();

	// Page selector state (for filtering snapshots)
	const [selectedPageId, setSelectedPageId] = useState<number | 'all'>('all');

	// Time range filter state
	const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

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

	// Save state for notes (keeping for backwards compatibility)
	const [notesSaveState, setNotesSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
	const notesTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	// Generic save state for all fields
	const [fieldSaveStates, setFieldSaveStates] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
	const fieldTimeoutRefs = useRef<Record<string, NodeJS.Timeout | undefined>>({});

	// Delete dialogs state
	const [deletePageDialog, setDeletePageDialog] = useState<{ open: boolean; pageId: number | null; pageName: string | null }>({
		open: false,
		pageId: null,
		pageName: null,
	});
	const [deleteOfferDialog, setDeleteOfferDialog] = useState(false);

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
			onSuccess: (_, variables) => {
				// Find the field that was updated (exclude uuid)
				const field = Object.keys(variables).find(k => k !== 'uuid');
				if (field) {
					setFieldSaveStates(prev => ({ ...prev, [field]: 'saved' }));
					// Reset to idle after 2 seconds
					setTimeout(() => {
						setFieldSaveStates(prev => ({ ...prev, [field]: 'idle' }));
					}, 2000);
				}
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
			},
			onError: (error, variables) => {
				// Find the field that had the error
				const field = Object.keys(variables).find(k => k !== 'uuid');
				if (field) {
					setFieldSaveStates(prev => ({ ...prev, [field]: 'idle' }));
				}
				toast.error(`Erro ao atualizar: ${error.message}`);
			},
		})
	);

	const updateNotesMutation = useMutation(
		trpc.offer.update.mutationOptions({
			onSuccess: () => {
				setNotesSaveState('saved');
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
				// Reset to idle after 2 seconds
				setTimeout(() => setNotesSaveState('idle'), 2000);
			},
			onError: (error) => {
				setNotesSaveState('idle');
				toast.error(`Erro ao salvar anotações: ${error.message}`);
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
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
			queryClient.invalidateQueries({ queryKey: [["snapshot", "getDelta"]] });
			toast.success(data.message || "Dados atualizados com sucesso!");
		},
		onError: (error: Error) => {
			toast.error(`Erro ao atualizar: ${error.message}`);
		},
	});

	// Reset refresh button state after 2 seconds
	useEffect(() => {
		if (triggerRefreshMutation.isSuccess || triggerRefreshMutation.isError) {
			const timer = setTimeout(() => {
				triggerRefreshMutation.reset();
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [triggerRefreshMutation.isSuccess, triggerRefreshMutation.isError]);

	const removePageMutation = useMutation(
		trpc.offer.removePage.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
				setDeletePageDialog({ open: false, pageId: null, pageName: null });
				toast.success("Página removida com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao remover página: ${error.message}`);
			},
		})
	);

	const deleteOfferMutation = useMutation(
		trpc.offer.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Oferta excluída com sucesso!");
				// Redirect to /offers
				window.location.href = "/offers";
			},
			onError: (error) => {
				toast.error(`Erro ao excluir oferta: ${error.message}`);
			},
		})
	);

	// Handle functions - Inline editing with debounce
	const updateField = (field: keyof typeof offerData, value: any) => {
		// Update local state immediately
		setOfferData(prev => ({ ...prev, [field]: value }));
		setFieldSaveStates(prev => ({ ...prev, [field]: 'saving' }));

		// Clear existing timeout for this specific field
		if (fieldTimeoutRefs.current[field]) {
			clearTimeout(fieldTimeoutRefs.current[field]);
		}

		// Validate URL fields before saving
		if (field === 'landingPageUrl' && value) {
			try {
				new URL(value);
			} catch {
				// Invalid URL - don't save, reset state
				setFieldSaveStates(prev => ({ ...prev, [field]: 'idle' }));
				return;
			}
		}

		// Set new timeout for debounced save
		fieldTimeoutRefs.current[field] = setTimeout(() => {
			updateOffer.mutate({
				uuid: offerId,
				[field]: value,
			});
		}, 1000); // 1 second debounce
	};

	const updateNotes = (value: string) => {
		// Update local state immediately
		setOfferData(prev => ({ ...prev, description: value }));
		setNotesSaveState('saving');

		// Clear existing timeout
		if (notesTimeoutRef.current) {
			clearTimeout(notesTimeoutRef.current);
		}

		// Set new timeout for debounced save
		notesTimeoutRef.current = setTimeout(() => {
			updateNotesMutation.mutate({
				uuid: offerId,
				description: value,
			});
		}, 1000); // 1 second debounce
	};

	const toggleBadge = (slug: string) => {
		const newBadges = offerData.badges.includes(slug)
			? offerData.badges.filter((b) => b !== slug)
			: [...offerData.badges, slug];

		setOfferData(prev => ({ ...prev, badges: newBadges }));
		updateOffer.mutate({
			uuid: offerId,
			badges: newBadges,
		});
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

	// Filter snapshots by selected page and time range
	const filteredSnapshots = useMemo(() => {
		if (!offer.data?.snapshots) return [];

		// Calculate time range cutoff
		const now = new Date();
		let cutoffDate: Date | null = null;

		switch (timeRange) {
			case '24h':
				cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case '7d':
				cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case '30d':
				cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case 'all':
			default:
				cutoffDate = null;
				break;
		}

		// Filter snapshots by time range first
		const timeFilteredSnapshots = cutoffDate
			? offer.data.snapshots.filter(s => new Date(s.scrapedAt) >= cutoffDate!)
			: offer.data.snapshots;

		if (selectedPageId === 'all') {
			// Aggregate snapshots by date+time (sum all pages at same timestamp)
			// Group by minute to aggregate snapshots from the same scrape run
			const grouped = new Map<string, { creativeCount: number, timestamp: Date }>();

			timeFilteredSnapshots.forEach(snap => {
				const timestamp = new Date(snap.scrapedAt);
				// Truncate to minute to group snapshots from the same scrape run
				// This ensures that multiple pages scraped together are summed correctly
				const dateKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;

				if (!grouped.has(dateKey)) {
					// Use the truncated timestamp (set seconds and ms to 0)
					const truncatedTimestamp = new Date(timestamp);
					truncatedTimestamp.setSeconds(0, 0);
					grouped.set(dateKey, { creativeCount: 0, timestamp: truncatedTimestamp });
				}
				const existing = grouped.get(dateKey)!;
				existing.creativeCount += snap.creativeCount;
			});

			return Array.from(grouped.values())
				.map(({ creativeCount, timestamp }) => ({
					date: timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
					time: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
					displayLabel: `${timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
					fullDateTime: timestamp.toLocaleString('pt-BR', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					}),
					creativeCount,
					scrapedAt: timestamp.toISOString(),
				}))
				.sort((a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime());
		} else {
			// Filter only the selected page
			return timeFilteredSnapshots
				.filter(s => s.pageId === selectedPageId)
				.map(s => {
					const timestamp = new Date(s.scrapedAt);
					return {
						...s,
						date: timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
						time: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
						displayLabel: `${timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
						fullDateTime: timestamp.toLocaleString('pt-BR', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit'
						}),
					};
				})
				.sort((a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime());
		}
	}, [selectedPageId, timeRange, offer.data?.snapshots]);

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
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => triggerRefreshMutation.mutate({ uuid: offerId })}
							disabled={triggerRefreshMutation.isPending}
						>
							{triggerRefreshMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : triggerRefreshMutation.isSuccess ? (
								<Check className="h-4 w-4 text-green-500 mr-2" />
							) : triggerRefreshMutation.isError ? (
								<X className="h-4 w-4 text-red-500 mr-2" />
							) : (
								<RefreshCw className="h-4 w-4 mr-2" />
							)}
							Atualizar Dados
						</Button>
						{offer.data.facebookUrl && (
							<Button variant="outline" size="sm" asChild>
								<a href={offer.data.facebookUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="mr-2 h-4 w-4" />
									Ver no Facebook
								</a>
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={() => setDeleteOfferDialog(true)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Excluir Oferta
						</Button>
					</div>
				</div>

				{/* 70/30 Layout - Graph + Metadata Panels */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* LEFT COLUMN (70%) - Chart & Pages */}
				<div className="lg:col-span-2 space-y-6">
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

					{/* Chart Section */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-section-title">Histórico de Criativos</CardTitle>
									<CardDescription>
										Evolução do número de criativos ao longo do tempo
										{selectedPageId !== 'all' && offer.data.pages && offer.data.pages.length > 1 &&
											` - ${offer.data.pages.find(p => p.pageId === selectedPageId)?.pageName || 'Página selecionada'}`
										}
									</CardDescription>
								</div>
								<Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
									<TabsList>
										<TabsTrigger value="24h">24h</TabsTrigger>
										<TabsTrigger value="7d">7 dias</TabsTrigger>
										<TabsTrigger value="30d">30 dias</TabsTrigger>
										<TabsTrigger value="all">Tudo</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						</CardHeader>
						<CardContent>
							{filteredSnapshots.length > 0 ? (
								<div className="h-[400px] w-full">
									<Line
										data={{
											labels: filteredSnapshots.map(s => s.displayLabel),
											datasets: [{
												label: 'Criativos',
												data: filteredSnapshots.map(s => s.creativeCount),
												borderColor: '#3b82f6',
												backgroundColor: 'rgba(59, 130, 246, 0.1)',
												borderWidth: 3,
												pointRadius: 6,
												pointHoverRadius: 8,
												pointBackgroundColor: '#3b82f6',
												pointBorderColor: '#ffffff',
												pointBorderWidth: 2,
												pointHoverBackgroundColor: '#2563eb',
												pointHoverBorderColor: '#ffffff',
												pointHoverBorderWidth: 3,
												tension: 0.4,
												fill: true,
											}]
										}}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											plugins: {
												legend: {
													display: false
												},
												tooltip: {
													backgroundColor: '#ffffff',
													titleColor: '#1f2937',
													bodyColor: '#374151',
													borderColor: '#e5e7eb',
													borderWidth: 1,
													padding: 16,
													displayColors: false,
													titleFont: {
														size: 14,
														weight: 'bold' as const
													},
													bodyFont: {
														size: 13
													},
													cornerRadius: 8,
													callbacks: {
														title: (context) => {
															const index = context[0].dataIndex;
															return filteredSnapshots[index].fullDateTime;
														},
														label: (context) => {
															return `${context.parsed.y} criativos`;
														}
													}
												}
											},
											scales: {
												x: {
													ticks: {
														maxRotation: 45,
														minRotation: 45,
														font: {
															size: 12
														},
														color: '#6b7280'
													},
													grid: {
														color: 'rgba(229, 231, 235, 0.5)',
														drawOnChartArea: true
													},
													border: {
														color: '#e5e7eb'
													}
												},
												y: {
													beginAtZero: true,
													ticks: {
														color: '#6b7280',
														font: {
															size: 12
														},
														padding: 8
													},
													grid: {
														color: 'rgba(229, 231, 235, 0.5)'
													},
													border: {
														color: '#e5e7eb'
													}
												}
											},
											interaction: {
												intersect: false,
												mode: 'index'
											}
										} as ChartOptions<'line'>}
									/>
								</div>
							) : (
								<div className="flex items-center justify-center h-[400px] text-muted-foreground">
									<p className="text-body-sm">Nenhum dado disponível para exibir</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Monitored Pages Section */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-section-title">Páginas Monitoradas</CardTitle>
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
									Adicionar
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
											className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
										>
											<div className="flex-1">
												<div className="font-semibold flex items-center gap-2 mb-1">
													{page.pageName || `Página ${idx + 1}`}
													<Badge variant={page.isPrimary ? "default" : "secondary"} className="text-xs">
														{page.isPrimary ? 'Principal' : 'Secundária'}
													</Badge>
												</div>
												<a
													href={page.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-caption text-info hover:underline flex items-center gap-1"
												>
													<ExternalLink className="h-3 w-3" />
													Ver no Facebook
												</a>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-right">
													<p className="text-label font-bold">
														{latestSnapshot?.creativeCount || 0} criativos
													</p>
													<p className="text-caption text-muted-foreground">
														{latestSnapshot
															? `${new Date(latestSnapshot.scrapedAt).toLocaleDateString('pt-BR')}`
															: 'Sem coleta'
														}
													</p>
												</div>
												{offer.data.pages && offer.data.pages.length > 1 && (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:text-danger hover:bg-danger/10"
														onClick={() => {
															setDeletePageDialog({
																open: true,
																pageId: page.pageId!,
																pageName: page.pageName || `Página ${idx + 1}`,
															});
														}}
													>
														<X className="h-4 w-4" />
													</Button>
												)}
											</div>
										</div>
									);
								})
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
									<Package className="h-12 w-12 mb-3 opacity-50" />
									<p className="text-body-sm mb-1">Nenhuma página adicionada ainda</p>
									<p className="text-caption">Clique em "Adicionar" para começar a monitorar</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* RIGHT COLUMN (30%) - Metadata Panels */}
				<div className="space-y-4">
					{/* Metadata Panel - Inline Editable */}
					<Card>
						<CardHeader>
							<CardTitle className="text-card-title">Informações</CardTitle>
							<CardDescription>Edição inline com auto-save</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Nome */}
							<div className="space-y-2">
								<Label htmlFor="name" className="text-label flex items-center gap-2">
									Nome da Oferta
									{fieldSaveStates.name === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.name === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
								<Input
									id="name"
									value={offerData.name}
									onChange={(e) => updateField('name', e.target.value)}
									placeholder="Ex: Curso de Marketing Digital"
								/>
							</div>

							{/* Região */}
							<div className="space-y-2">
								<Label className="text-label flex items-center gap-2">
									Região
									{fieldSaveStates.region === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.region === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
								<ComboboxWithCreate
									items={regions.data?.map((r) => ({ value: r.slug, label: r.name })) || []}
									value={offerData.region}
									onValueChange={(value) => updateField('region', value)}
									onCreateNew={async (name) => {
										await createRegion.mutateAsync({ name });
									}}
									placeholder="Selecione uma região"
								/>
							</div>

							{/* Tipo */}
							<div className="space-y-2">
								<Label className="text-label flex items-center gap-2">
									Tipo de Produto
									{fieldSaveStates.type === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.type === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
								<ComboboxWithCreate
									items={offerTypes.data?.map((t) => ({ value: t.slug, label: t.label })) || []}
									value={offerData.type}
									onValueChange={(value) => updateField('type', value)}
									onCreateNew={async (label) => {
										await createOfferType.mutateAsync({ label });
									}}
									placeholder="Selecione um tipo"
								/>
							</div>

							{/* Nicho */}
							<div className="space-y-2">
								<Label className="text-label flex items-center gap-2">
									Nicho
									{fieldSaveStates.niche === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.niche === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
								<ComboboxWithCreate
									items={niches.data?.map((n) => ({ value: n.slug, label: n.label })) || []}
									value={offerData.niche || ""}
									onValueChange={(value) => updateField('niche', value)}
									onCreateNew={async (label) => {
										await createNiche.mutateAsync({ label });
									}}
									placeholder="Selecione um nicho (opcional)"
								/>
							</div>

							{/* Strategy */}
							<div className="space-y-2">
								<Label className="text-label flex items-center gap-2">
									Estratégia
									{fieldSaveStates.strategy === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.strategy === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
								<ComboboxWithCreate
									items={strategies.data?.map((s) => ({ value: s.slug, label: s.label })) || []}
									value={offerData.strategy || ""}
									onValueChange={(value) => updateField('strategy', value)}
									onCreateNew={async (label) => {
										await createStrategy.mutateAsync({ label });
									}}
									placeholder="Selecione uma estratégia (opcional)"
								/>
							</div>

							{/* Has Cloaker */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="hasCloaker"
									checked={offerData.hasCloaker}
									onCheckedChange={(checked) => updateField('hasCloaker', checked as boolean)}
								/>
								<Label
									htmlFor="hasCloaker"
									className="text-label cursor-pointer flex items-center gap-2"
								>
									🔒 Utiliza cloaker
									{fieldSaveStates.hasCloaker === 'saving' && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
									)}
									{fieldSaveStates.hasCloaker === 'saved' && (
										<Check className="h-3.5 w-3.5 text-success" />
									)}
								</Label>
							</div>
						</CardContent>
					</Card>

					{/* Badges Panel */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-card-title">Badges</CardTitle>
									<CardDescription>Clique para adicionar/remover</CardDescription>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setBadgeDialog({ ...badgeDialog, open: true })}
								>
									<Plus className="mr-2 h-4 w-4" />
									Novo
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{badges.data?.map((badge) => (
									<Badge
										key={badge.id}
										variant={offerData.badges.includes(badge.slug) ? "default" : "outline"}
										className="cursor-pointer hover-scale"
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
									<p className="text-caption text-muted-foreground">
										Nenhum badge disponível. Crie o primeiro!
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Notes Panel */}
					<Card>
						<CardHeader>
							<CardTitle className="text-card-title flex items-center justify-between">
								<span>Anotações</span>
								{notesSaveState === 'saving' && (
									<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
								)}
								{notesSaveState === 'saved' && (
									<Check className="h-3.5 w-3.5 text-success" />
								)}
							</CardTitle>
							<CardDescription>Observações e notas</CardDescription>
						</CardHeader>
						<CardContent>
							<Textarea
								value={offerData.description}
								onChange={(e) => updateNotes(e.target.value)}
								placeholder="Adicione anotações sobre esta oferta..."
								rows={4}
								className="resize-none"
							/>
						</CardContent>
					</Card>

					{/* Landing Page */}
					<Card>
						<CardHeader>
							<CardTitle className="text-card-title flex items-center justify-between">
								<span>Landing Page</span>
								{fieldSaveStates.landingPageUrl === 'saving' && (
									<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
								)}
								{fieldSaveStates.landingPageUrl === 'saved' && (
									<Check className="h-3.5 w-3.5 text-success" />
								)}
							</CardTitle>
							<CardDescription>URL da página de destino</CardDescription>
						</CardHeader>
						<CardContent>
							<Input
								type="url"
								value={offerData.landingPageUrl}
								onChange={(e) => updateField('landingPageUrl', e.target.value)}
								placeholder="https://exemplo.com/pagina"
							/>
							{offerData.landingPageUrl && (
								<a
									href={offerData.landingPageUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-caption text-info hover:underline flex items-center gap-1 mt-2"
								>
									<ExternalLink className="h-3 w-3" />
									Abrir link
								</a>
							)}
						</CardContent>
					</Card>
				</div>
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

				{/* Delete Page Dialog */}
				<Dialog open={deletePageDialog.open} onOpenChange={(open) => setDeletePageDialog({ ...deletePageDialog, open })}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Remover Página Monitorada</DialogTitle>
							<DialogDescription>
								Tem certeza que deseja remover "{deletePageDialog.pageName}"? Esta ação não pode ser desfeita.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDeletePageDialog({ open: false, pageId: null, pageName: null })}
								disabled={removePageMutation.isPending}
							>
								Cancelar
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									if (deletePageDialog.pageId) {
										removePageMutation.mutate({
											offerUuid: offerId,
											pageId: deletePageDialog.pageId
										});
									}
								}}
								disabled={removePageMutation.isPending}
							>
								{removePageMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										Removendo...
									</>
								) : (
									"Remover"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete Offer Dialog */}
				<Dialog open={deleteOfferDialog} onOpenChange={setDeleteOfferDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Excluir Oferta</DialogTitle>
							<DialogDescription>
								Tem certeza que deseja excluir "{offer.data.name || 'esta oferta'}"? Esta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDeleteOfferDialog(false)}
								disabled={deleteOfferMutation.isPending}
							>
								Cancelar
							</Button>
							<Button
								variant="destructive"
								onClick={() => deleteOfferMutation.mutate({ uuid: offerId })}
								disabled={deleteOfferMutation.isPending}
							>
								{deleteOfferMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										Excluindo...
									</>
								) : (
									"Excluir"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	);
}
