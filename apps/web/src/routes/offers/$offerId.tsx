import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, ExternalLink, Save, Plus, X } from "lucide-react";
import { trpc, queryClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

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
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

function OfferDetailRoute() {
	const { offerId } = Route.useParams();

	const offer = useQuery(trpc.offer.getById.queryOptions({ uuid: offerId }));

	// Config data queries
	const regions = useQuery(trpc.config.regions.getAll.queryOptions());
	const offerTypes = useQuery(trpc.config.offerTypes.getAll.queryOptions());
	const niches = useQuery(trpc.config.niches.getAll.queryOptions());
	const tags = useQuery(trpc.config.tags.getAll.queryOptions());
	const badges = useQuery(trpc.config.badges.getAll.queryOptions());

	// Form state
	const [offerData, setOfferData] = useState({
		name: offer.data?.name || "",
		region: offer.data?.region || "",
		type: offer.data?.type || "",
		niche: offer.data?.niche || "",
		tags: offer.data?.tags || [],
		badges: offer.data?.badges || [],
	});

	// Tag/Badge creation dialog state
	const [tagDialog, setTagDialog] = useState({ open: false, name: "", color: "#FACC15" });
	const [badgeDialog, setBadgeDialog] = useState({ open: false, name: "", icon: "🏷️", color: "#EF4444" });

	// Update offer when data loads
	useState(() => {
		if (offer.data) {
			setOfferData({
				name: offer.data.name || "",
				region: offer.data.region || "",
				type: offer.data.type || "",
				niche: offer.data.niche || "",
				tags: offer.data.tags || [],
				badges: offer.data.badges || [],
			});
		}
	});

	// Mutations
	const updateOffer = useMutation(
		trpc.offer.update.mutationOptions({
			onSuccess: () => {
				toast.success("Oferta atualizada com sucesso!");
				queryClient.invalidateQueries({ queryKey: [["offer", "getById"]] });
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

	const createTag = useMutation(
		trpc.config.tags.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: [["config", "tags", "getAll"]] });
				// Add the tag to the offer
				setOfferData((prev) => ({
					...prev,
					tags: [...prev.tags, data.name],
				}));
				setTagDialog({ open: false, name: "", color: "#FACC15" });
			},
		})
	);

	const createBadge = useMutation(
		trpc.config.badges.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: [["config", "badges", "getAll"]] });
				// Add the badge to the offer
				setOfferData((prev) => ({
					...prev,
					badges: [...prev.badges, data.name],
				}));
				setBadgeDialog({ open: false, name: "", icon: "🏷️", color: "#EF4444" });
			},
		})
	);

	const handleSave = () => {
		updateOffer.mutate({
			uuid: offerId,
			...offerData,
		});
	};

	const toggleTag = (tagName: string) => {
		setOfferData((prev) => ({
			...prev,
			tags: prev.tags.includes(tagName)
				? prev.tags.filter((t) => t !== tagName)
				: [...prev.tags, tagName],
		}));
	};

	const toggleBadge = (badgeName: string) => {
		setOfferData((prev) => ({
			...prev,
			badges: prev.badges.includes(badgeName)
				? prev.badges.filter((b) => b !== badgeName)
				: [...prev.badges, badgeName],
		}));
	};

	const handleCreateTagClick = () => {
		setTagDialog({ open: true, name: "", color: "#FACC15" });
	};

	const handleCreateBadgeClick = () => {
		setBadgeDialog({ open: true, name: "", icon: "🏷️", color: "#EF4444" });
	};

	const handleCreateTag = () => {
		if (!tagDialog.name.trim()) {
			toast.error("Digite um nome para a tag");
			return;
		}
		createTag.mutate({
			name: tagDialog.name,
			color: tagDialog.color,
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

	// Format data for chart (last 7 days)
	const chartData =
		offer.data?.snapshots?.slice(0, 7).reverse().map((snapshot) => ({
			date: new Date(snapshot.scrapedAt).toLocaleDateString("pt-BR", {
				day: "2-digit",
				month: "short",
			}),
			creativeCount: snapshot.creativeCount,
		})) || [];

	if (offer.isLoading) {
		return (
			<DashboardLayout>
				<div>
					<Skeleton className="h-9 w-[140px] mb-4" />
					<div className="flex items-start justify-between">
						<Skeleton className="h-9 w-[300px]" />
						<Skeleton className="h-10 w-[150px]" />
					</div>
					<div className="mt-4 flex flex-wrap gap-2">
						<Skeleton className="h-6 w-[100px]" />
						<Skeleton className="h-6 w-[80px]" />
					</div>
				</div>
			</DashboardLayout>
		);
	}

	if (!offer.data) {
		return (
			<DashboardLayout>
				<div className="container mx-auto py-8">
					<p className="text-center text-muted-foreground">
						Oferta não encontrada
					</p>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<Link to="/offers">
						<Button variant="ghost" size="sm" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar para ofertas
						</Button>
					</Link>

					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">
								{offer.data.name || "Sem nome"}
							</h1>
							{offer.data.pageName && (
								<p className="mt-2 text-muted-foreground">
									{offer.data.pageName}
								</p>
							)}
						</div>
						<a
							href={offer.data.facebookUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center"
						>
							<Button variant="outline">
								<ExternalLink className="mr-2 h-4 w-4" />
								Ver no Facebook
							</Button>
						</a>
					</div>
				</div>

				{/* Form Card */}
				<Card>
					<CardHeader>
						<CardTitle>Detalhes da Oferta</CardTitle>
						<CardDescription>
							Edite as informações e categorização da oferta
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="name">Nome da Oferta</Label>
							<Input
								id="name"
								value={offerData.name}
								onChange={(e) =>
									setOfferData({ ...offerData, name: e.target.value })
								}
								placeholder="Ex: Oferta Emagrecimento Q4"
							/>
						</div>

						{/* Region */}
						<div className="space-y-2">
							<Label>Região</Label>
							<ComboboxWithCreate
								items={
									regions.data?.map((r) => ({
										value: r.slug,
										label: r.name,
									})) || []
								}
								value={offerData.region}
								onValueChange={(value) =>
									setOfferData({ ...offerData, region: value })
								}
								onCreateNew={async (name) => {
									await createRegion.mutateAsync({ name });
								}}
								placeholder="Selecione uma região"
								searchPlaceholder="Buscar região..."
								createNewText="Criar região"
							/>
						</div>

						{/* Type */}
						<div className="space-y-2">
							<Label>Tipo de Produto</Label>
							<ComboboxWithCreate
								items={
									offerTypes.data?.map((t) => ({
										value: t.slug,
										label: t.label,
									})) || []
								}
								value={offerData.type}
								onValueChange={(value) =>
									setOfferData({ ...offerData, type: value })
								}
								onCreateNew={async (label) => {
									await createOfferType.mutateAsync({ label });
								}}
								placeholder="Selecione um tipo"
								searchPlaceholder="Buscar tipo..."
								createNewText="Criar tipo"
							/>
						</div>

						{/* Niche */}
						<div className="space-y-2">
							<Label>Nicho (opcional)</Label>
							<ComboboxWithCreate
								items={
									niches.data?.map((n) => ({
										value: n.slug,
										label: n.label,
									})) || []
								}
								value={offerData.niche}
								onValueChange={(value) =>
									setOfferData({ ...offerData, niche: value })
								}
								onCreateNew={async (label) => {
									await createNiche.mutateAsync({ label });
								}}
								placeholder="Selecione um nicho"
								searchPlaceholder="Buscar nicho..."
								createNewText="Criar nicho"
							/>
						</div>

						{/* Tags */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Tags</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCreateTagClick}
								>
									<Plus className="mr-2 h-4 w-4" />
									Nova Tag
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{tags.data?.map((tag) => (
									<Badge
										key={tag.id}
										variant={
											offerData.tags.includes(tag.name) ? "default" : "outline"
										}
										className="cursor-pointer"
										style={
											offerData.tags.includes(tag.name)
												? { backgroundColor: tag.color || "#FACC15", color: "white" }
												: undefined
										}
										onClick={() => toggleTag(tag.name)}
									>
										{tag.name}
									</Badge>
								))}
								{tags.data?.length === 0 && (
									<p className="text-sm text-muted-foreground">
										Nenhuma tag disponível. Crie uma nova!
									</p>
								)}
							</div>
							{offerData.tags.length > 0 && (
								<p className="text-xs text-muted-foreground">
									{offerData.tags.length} tag(s) selecionada(s)
								</p>
							)}
						</div>

						{/* Badges */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Badges</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCreateBadgeClick}
								>
									<Plus className="mr-2 h-4 w-4" />
									Novo Badge
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{badges.data?.map((badge) => (
									<Badge
										key={badge.id}
										variant={
											offerData.badges.includes(badge.name)
												? "default"
												: "outline"
										}
										className="cursor-pointer"
										style={
											offerData.badges.includes(badge.name)
												? {
														backgroundColor: badge.color || "#EF4444",
														color: "white",
													}
												: undefined
										}
										onClick={() => toggleBadge(badge.name)}
									>
										{badge.icon} {badge.name}
									</Badge>
								))}
								{badges.data?.length === 0 && (
									<p className="text-sm text-muted-foreground">
										Nenhum badge disponível. Crie um novo!
									</p>
								)}
							</div>
							{offerData.badges.length > 0 && (
								<p className="text-xs text-muted-foreground">
									{offerData.badges.length} badge(s) selecionado(s)
								</p>
							)}
						</div>

						{/* Save Button */}
						<div className="flex justify-end pt-4">
							<Button
								onClick={handleSave}
								disabled={updateOffer.isPending}
							>
								<Save className="mr-2 h-4 w-4" />
								{updateOffer.isPending ? "Salvando..." : "Salvar Alterações"}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Chart Card */}
				<Card>
					<CardHeader>
						<CardTitle>Evolução de Criativos (Últimos 7 dias)</CardTitle>
						<CardDescription>
							Número de criativos ativos ao longo do tempo
						</CardDescription>
					</CardHeader>
					<CardContent>
						{chartData.length === 0 ? (
							<div className="flex h-[300px] items-center justify-center text-muted-foreground">
								Aguardando coleta de dados...
							</div>
						) : (
							<ChartContainer config={chartConfig} className="h-[300px] w-full">
								<LineChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis tickLine={false} axisLine={false} tickMargin={8} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Line
										type="monotone"
										dataKey="creativeCount"
										stroke="var(--color-creativeCount)"
										strokeWidth={2}
										dot={{ r: 4 }}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>

				{/* Snapshots History */}
				<Card>
					<CardHeader>
						<CardTitle>Histórico de Coletas</CardTitle>
						<CardDescription>
							Todas as coletas realizadas para esta oferta
						</CardDescription>
					</CardHeader>
					<CardContent>
						{offer.data.snapshots && offer.data.snapshots.length > 0 ? (
							<div className="space-y-2">
								{offer.data.snapshots.map((snapshot) => (
									<div
										key={snapshot.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">
												{snapshot.creativeCount} criativos
											</p>
											<p className="text-sm text-muted-foreground">
												{new Date(snapshot.scrapedAt).toLocaleString("pt-BR", {
													dateStyle: "short",
													timeStyle: "short",
												})}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="py-4 text-center text-muted-foreground">
								Nenhuma coleta realizada ainda
							</p>
						)}
					</CardContent>
				</Card>

				{/* Tag Creation Dialog */}
				<Dialog open={tagDialog.open} onOpenChange={(open) => setTagDialog({ ...tagDialog, open })}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Nova Tag</DialogTitle>
							<DialogDescription>
								Crie uma nova tag com nome e cor personalizados
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="tag-name">Nome</Label>
								<Input
									id="tag-name"
									value={tagDialog.name}
									onChange={(e) =>
										setTagDialog({ ...tagDialog, name: e.target.value })
									}
									placeholder="Ex: blackfriday"
								/>
							</div>
							<div className="space-y-2">
								<Label>Cor</Label>
								<ColorPicker
									color={tagDialog.color}
									onChange={(color) =>
										setTagDialog({ ...tagDialog, color })
									}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setTagDialog({ open: false, name: "", color: "#FACC15" })}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleCreateTag}
								disabled={createTag.isPending}
							>
								{createTag.isPending ? "Criando..." : "Criar Tag"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Badge Creation Dialog */}
				<Dialog open={badgeDialog.open} onOpenChange={(open) => setBadgeDialog({ ...badgeDialog, open })}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Novo Badge</DialogTitle>
							<DialogDescription>
								Crie um novo badge com nome, emoji e cor personalizados
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="badge-name">Nome</Label>
								<Input
									id="badge-name"
									value={badgeDialog.name}
									onChange={(e) =>
										setBadgeDialog({ ...badgeDialog, name: e.target.value })
									}
									placeholder="Ex: Escalando"
								/>
							</div>
							<div className="space-y-2">
								<Label>Emoji</Label>
								<EmojiPickerButton
									emoji={badgeDialog.icon}
									onEmojiSelect={(emoji) =>
										setBadgeDialog({ ...badgeDialog, icon: emoji })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Cor</Label>
								<ColorPicker
									color={badgeDialog.color}
									onChange={(color) =>
										setBadgeDialog({ ...badgeDialog, color })
									}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() =>
									setBadgeDialog({
										open: false,
										name: "",
										icon: "🏷️",
										color: "#EF4444",
									})
								}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleCreateBadge}
								disabled={createBadge.isPending}
							>
								{createBadge.isPending ? "Criando..." : "Criar Badge"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	);
}
