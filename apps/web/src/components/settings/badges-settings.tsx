import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmojiPickerButton } from "@/components/ui/emoji-picker";
import { toast } from "sonner";

export function BadgesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingBadge, setEditingBadge] = useState<any>(null);
	const [formData, setFormData] = useState({ name: "", icon: "", color: "#EF4444" });
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [badgeToDelete, setBadgeToDelete] = useState<{ id: number; name: string } | null>(null);

	const queryClient = useQueryClient();
	const badgesQuery = trpc.config.badges.getAll.queryOptions();
	const { data: badges, isLoading } = useQuery(badgesQuery);

	const createMutation = useMutation(
		trpc.config.badges.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: badgesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ name: "", icon: "", color: "#EF4444" });
				toast.success("Badge criado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar badge: ${error.message}`);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.badges.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: badgesQuery.queryKey });
				setEditingBadge(null);
				setFormData({ name: "", icon: "", color: "#EF4444" });
				toast.success("Badge atualizado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar badge: ${error.message}`);
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.badges.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: badgesQuery.queryKey });
				toast.success("Badge excluído com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao excluir badge: ${error.message}`);
			},
		})
	);

	const handleCreate = () => {
		if (!formData.name.trim()) {
			toast.error("Digite um nome para o badge");
			return;
		}
		createMutation.mutate({
			name: formData.name,
			icon: formData.icon,
			color: formData.color,
		});
	};

	const handleUpdate = () => {
		if (!editingBadge) return;
		if (!formData.name.trim()) {
			toast.error("Digite um nome para o badge");
			return;
		}
		updateMutation.mutate({
			id: editingBadge.id,
			name: formData.name,
			icon: formData.icon,
			color: formData.color,
		});
	};

	const handleDeleteClick = (badge: { id: number; name: string }) => {
		setBadgeToDelete(badge);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (badgeToDelete) {
			deleteMutation.mutate({ id: badgeToDelete.id });
		}
		setDeleteConfirmOpen(false);
		setBadgeToDelete(null);
	};

	const openEditDialog = (badge: any) => {
		setEditingBadge(badge);
		setFormData({
			name: badge.name,
			icon: badge.icon || "",
			color: badge.color || "#EF4444",
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-9 w-[120px] rounded" />
				</div>
				<div className="rounded-lg border border-border/50 overflow-hidden bg-gradient-to-br from-background via-background to-muted/5">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-b">
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Nome</TableHead>
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Ícone</TableHead>
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Cor</TableHead>
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Preview</TableHead>
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell className="py-4 px-6">
										<Skeleton className="h-5 w-[100px]" />
									</TableCell>
									<TableCell className="py-4 px-6">
										<Skeleton className="h-8 w-8 rounded" />
									</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6 rounded" />
											<Skeleton className="h-4 w-[60px]" />
										</div>
									</TableCell>
									<TableCell className="py-4 px-6">
										<Skeleton className="h-6 w-[120px] rounded-full" />
									</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Skeleton className="h-8 w-8 rounded" />
											<Skeleton className="h-8 w-8 rounded" />
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Novo Badge
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Badge</DialogTitle>
							<DialogDescription>
								Adicione um novo badge para destacar ofertas
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									placeholder="Ex: Escalando, Top, Verificado"
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label>Emoji (opcional)</Label>
								<EmojiPickerButton
									emoji={formData.icon}
									onEmojiSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Cor</Label>
								<ColorPicker
									color={formData.color}
									onChange={(color) => setFormData({ ...formData, color })}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
								{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Criar
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog open={!!editingBadge} onOpenChange={(open) => !open && setEditingBadge(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Badge</DialogTitle>
						<DialogDescription>
							Atualize as informações do badge
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Nome</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="Ex: Escalando, Top, Verificado"
							/>
						</div>
						<div className="space-y-2">
							<Label>Emoji (opcional)</Label>
							<EmojiPickerButton
								emoji={formData.icon}
								onEmojiSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
							/>
						</div>
						<div className="space-y-2">
							<Label>Cor</Label>
							<ColorPicker
								color={formData.color}
								onChange={(color) => setFormData({ ...formData, color })}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingBadge(null)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
							{updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Salvar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="rounded-lg border border-border/50 overflow-hidden bg-gradient-to-br from-background via-background to-muted/5">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent border-b">
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Nome</TableHead>
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Ícone</TableHead>
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Cor</TableHead>
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Preview</TableHead>
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{badges?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="rounded-full bg-muted/50 p-3">
											<Plus className="h-6 w-6 text-muted-foreground" />
										</div>
										<p>Nenhum badge cadastrado</p>
										<p className="text-sm text-muted-foreground">Clique em "Novo Badge" para começar</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							badges?.map((badge, index) => (
								<TableRow key={badge.id} className="hover:bg-muted/50 transition-colors">
									<TableCell className="py-4 px-6 font-medium">{badge.name}</TableCell>
									<TableCell className="py-4 px-6">
										{badge.icon ? <span className="text-2xl inline-block">{badge.icon}</span> : <span className="text-xs text-muted-foreground">-</span>}
									</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex items-center gap-2">
											<div
												className="w-6 h-6 rounded border border-border"
												style={{ backgroundColor: badge.color || '#EF4444' }}
											/>
											<span className="font-mono text-xs text-muted-foreground">{badge.color}</span>
										</div>
									</TableCell>
									<TableCell className="py-4 px-6">
										<Badge
											style={{
												backgroundColor: badge.color ? `${badge.color}15` : '#EF444415',
												color: badge.color || '#EF4444',
												borderColor: badge.color ? `${badge.color}30` : '#EF444430'
											}}
											className="border font-medium"
										>
											{badge.icon && `${badge.icon} `}{badge.name}
										</Badge>
									</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(badge)}
												className="h-8 w-8 hover:bg-muted"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDeleteClick({ id: badge.id, name: badge.name })}
												disabled={deleteMutation.isPending}
												className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmar exclusão</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir o badge "{badgeToDelete?.name}"? Esta ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
							{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
