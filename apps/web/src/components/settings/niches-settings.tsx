import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NichesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingNiche, setEditingNiche] = useState<any>(null);
	const [formData, setFormData] = useState({ label: "" });
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [nicheToDelete, setNicheToDelete] = useState<{ id: number; label: string } | null>(null);

	const queryClient = useQueryClient();
	const nichesQuery = trpc.config.niches.getAll.queryOptions();
	const { data: niches, isLoading } = useQuery(nichesQuery);

	const createMutation = useMutation(
		trpc.config.niches.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ label: "" });
				toast.success("Nicho criado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar nicho: ${error.message}`);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.niches.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
				setEditingNiche(null);
				setFormData({ label: "" });
				toast.success("Nicho atualizado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar nicho: ${error.message}`);
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.niches.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
				toast.success("Nicho excluído com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao excluir nicho: ${error.message}`);
			},
		})
	);

	const handleCreate = () => {
		if (!formData.label.trim()) {
			toast.error("Digite um nome para o nicho");
			return;
		}
		createMutation.mutate({ label: formData.label });
	};

	const handleUpdate = () => {
		if (!editingNiche) return;
		if (!formData.label.trim()) {
			toast.error("Digite um nome para o nicho");
			return;
		}
		updateMutation.mutate({
			id: editingNiche.id,
			label: formData.label,
		});
	};

	const handleDeleteClick = (niche: { id: number; label: string }) => {
		setNicheToDelete(niche);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (nicheToDelete) {
			deleteMutation.mutate({ id: nicheToDelete.id });
		}
		setDeleteConfirmOpen(false);
		setNicheToDelete(null);
	};

	const openEditDialog = (niche: any) => {
		setEditingNiche(niche);
		setFormData({ label: niche.label });
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-9 w-[140px] rounded" />
				</div>
				<div className="rounded-lg border border-border/50 overflow-hidden bg-gradient-to-br from-background via-background to-muted/5">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-b">
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground">Nome</TableHead>
								<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell className="py-4 px-6">
										<Skeleton className="h-5 w-[120px]" />
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
							Novo Nicho
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Nicho</DialogTitle>
							<DialogDescription>
								O slug será gerado automaticamente a partir do nome
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="label">Nome</Label>
								<Input
									id="label"
									value={formData.label}
									onChange={(e) => setFormData({ label: e.target.value })}
									placeholder="Ex: Emagrecimento, Finanças"
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Ex: "Emagrecimento" → slug: "emagrecimento"
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={!formData.label || createMutation.isPending}>
								{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Criar
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog open={!!editingNiche} onOpenChange={(open) => !open && setEditingNiche(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Nicho</DialogTitle>
						<DialogDescription>
							Atualize o nome do nicho
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-label">Nome</Label>
							<Input
								id="edit-label"
								value={formData.label}
								onChange={(e) => setFormData({ label: e.target.value })}
								placeholder="Ex: Emagrecimento, Finanças"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingNiche(null)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={!formData.label || updateMutation.isPending}>
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
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{niches?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="rounded-full bg-muted/50 p-3">
											<Plus className="h-6 w-6 text-muted-foreground" />
										</div>
										<p>Nenhum nicho cadastrado</p>
										<p className="text-sm text-muted-foreground">Clique em "Novo Nicho" para começar</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							niches?.map((niche) => (
								<TableRow key={niche.id} className="hover:bg-muted/50 transition-colors">
									<TableCell className="py-4 px-6 font-medium">{niche.label}</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(niche)}
												className="h-8 w-8 hover:bg-muted"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDeleteClick({ id: niche.id, label: niche.label })}
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
							Tem certeza que deseja excluir o nicho "{nicheToDelete?.label}"? Esta ação não pode ser desfeita.
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
