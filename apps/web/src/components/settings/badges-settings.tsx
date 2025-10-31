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
	const [formData, setFormData] = useState({ name: "", icon: "🔥", color: "#EF4444" });

	const queryClient = useQueryClient();
	const badgesQuery = trpc.config.badges.getAll.queryOptions();
	const { data: badges, isLoading } = useQuery(badgesQuery);

	const createMutation = useMutation(
		trpc.config.badges.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: badgesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ name: "", icon: "🔥", color: "#EF4444" });
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
				setFormData({ name: "", icon: "🔥", color: "#EF4444" });
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

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir este badge?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (badge: any) => {
		setEditingBadge(badge);
		setFormData({
			name: badge.name,
			icon: badge.icon || "🔥",
			color: badge.color || "#EF4444",
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-9 w-[120px]" />
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Ícone</TableHead>
								<TableHead>Cor</TableHead>
								<TableHead>Preview</TableHead>
								<TableHead className="w-[100px]">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
									<TableCell><Skeleton className="h-6 w-[40px]" /></TableCell>
									<TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
									<TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Skeleton className="h-8 w-8" />
											<Skeleton className="h-8 w-8" />
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
								<Label>Emoji</Label>
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
							<Label>Emoji</Label>
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

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Ícone</TableHead>
							<TableHead>Cor</TableHead>
							<TableHead>Preview</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{badges?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground">
									Nenhum badge cadastrado
								</TableCell>
							</TableRow>
						) : (
							badges?.map((badge) => (
								<TableRow key={badge.id}>
									<TableCell className="font-medium">{badge.name}</TableCell>
									<TableCell className="text-2xl">{badge.icon}</TableCell>
									<TableCell className="font-mono text-xs">{badge.color}</TableCell>
									<TableCell>
										<Badge style={{ backgroundColor: badge.color || '#EF4444' }} className="text-white">
											{badge.icon} {badge.name}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(badge)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(badge.id)}
												disabled={deleteMutation.isPending}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
