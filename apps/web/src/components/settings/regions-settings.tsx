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

export function RegionsSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingRegion, setEditingRegion] = useState<any>(null);
	const [formData, setFormData] = useState({ name: "" });
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [regionToDelete, setRegionToDelete] = useState<{ id: number; name: string } | null>(null);

	const queryClient = useQueryClient();
	const regionsQuery = trpc.config.regions.getAll.queryOptions();
	const { data: regions, isLoading } = useQuery(regionsQuery);

	const createMutation = useMutation(
		trpc.config.regions.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: regionsQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ name: "" });
				toast.success("Região criada com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar região: ${error.message}`);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.regions.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: regionsQuery.queryKey });
				setEditingRegion(null);
				setFormData({ name: "" });
				toast.success("Região atualizada com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar região: ${error.message}`);
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.regions.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: regionsQuery.queryKey });
				toast.success("Região excluída com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao excluir região: ${error.message}`);
			},
		})
	);

	const handleCreate = () => {
		if (!formData.name.trim()) {
			toast.error("Digite um nome para a região");
			return;
		}
		createMutation.mutate({ name: formData.name });
	};

	const handleUpdate = () => {
		if (!editingRegion) return;
		if (!formData.name.trim()) {
			toast.error("Digite um nome para a região");
			return;
		}
		updateMutation.mutate({
			id: editingRegion.id,
			name: formData.name,
		});
	};

	const handleDeleteClick = (region: { id: number; name: string }) => {
		setRegionToDelete(region);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (regionToDelete) {
			deleteMutation.mutate({ id: regionToDelete.id });
		}
		setDeleteConfirmOpen(false);
		setRegionToDelete(null);
	};

	const openEditDialog = (region: any) => {
		setEditingRegion(region);
		setFormData({ name: region.name });
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
							Nova Região
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Nova Região</DialogTitle>
							<DialogDescription>
								O slug será gerado automaticamente a partir do nome
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ name: e.target.value })}
									placeholder="Ex: Brasil, Estados Unidos"
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Ex: "São Paulo" → slug: "sao-paulo"
								</p>
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

			<Dialog open={!!editingRegion} onOpenChange={(open) => !open && setEditingRegion(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Região</DialogTitle>
						<DialogDescription>
							Atualize o nome da região
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Nome</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) => setFormData({ name: e.target.value })}
								placeholder="Ex: Brasil, Estados Unidos"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingRegion(null)}>
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
							<TableHead className="h-12 px-6 text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{regions?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="rounded-full bg-muted/50 p-3">
											<Plus className="h-6 w-6 text-muted-foreground" />
										</div>
										<p>Nenhuma região cadastrada</p>
										<p className="text-sm text-muted-foreground">Clique em "Nova Região" para começar</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							regions?.map((region) => (
								<TableRow key={region.id} className="hover:bg-muted/50 transition-colors">
									<TableCell className="py-4 px-6 font-medium">{region.name}</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(region)}
												className="h-8 w-8 hover:bg-muted"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDeleteClick({ id: region.id, name: region.name })}
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
							Tem certeza que deseja excluir a região "{regionToDelete?.name}"? Esta ação não pode ser desfeita.
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
