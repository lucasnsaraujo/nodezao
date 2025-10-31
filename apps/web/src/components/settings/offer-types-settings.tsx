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

export function OfferTypesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingType, setEditingType] = useState<any>(null);
	const [formData, setFormData] = useState({ label: "" });
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [typeToDelete, setTypeToDelete] = useState<{ id: number; label: string } | null>(null);

	const queryClient = useQueryClient();
	const typesQuery = trpc.config.offerTypes.getAll.queryOptions();
	const { data: types, isLoading } = useQuery(typesQuery);

	const createMutation = useMutation(
		trpc.config.offerTypes.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ label: "" });
				toast.success("Tipo criado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar tipo: ${error.message}`);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.offerTypes.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
				setEditingType(null);
				setFormData({ label: "" });
				toast.success("Tipo atualizado com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar tipo: ${error.message}`);
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.offerTypes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
				toast.success("Tipo excluído com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao excluir tipo: ${error.message}`);
			},
		})
	);

	const handleCreate = () => {
		if (!formData.label.trim()) {
			toast.error("Digite um nome para o tipo");
			return;
		}
		createMutation.mutate({ label: formData.label });
	};

	const handleUpdate = () => {
		if (!editingType) return;
		if (!formData.label.trim()) {
			toast.error("Digite um nome para o tipo");
			return;
		}
		updateMutation.mutate({
			id: editingType.id,
			label: formData.label,
		});
	};

	const handleDeleteClick = (type: { id: number; label: string }) => {
		setTypeToDelete(type);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (typeToDelete) {
			deleteMutation.mutate({ id: typeToDelete.id });
		}
		setDeleteConfirmOpen(false);
		setTypeToDelete(null);
	};

	const openEditDialog = (type: any) => {
		setEditingType(type);
		setFormData({ label: type.label });
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
							Novo Tipo
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Tipo de Produto</DialogTitle>
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
									placeholder="Ex: Produto Físico, Produto Digital"
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Ex: "Produto Físico" → slug: "produto-fisico"
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

			<Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Tipo de Produto</DialogTitle>
						<DialogDescription>
							Atualize o nome do tipo
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-label">Nome</Label>
							<Input
								id="edit-label"
								value={formData.label}
								onChange={(e) => setFormData({ label: e.target.value })}
								placeholder="Ex: Produto Físico, Produto Digital"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingType(null)}>
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
						{types?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="rounded-full bg-muted/50 p-3">
											<Plus className="h-6 w-6 text-muted-foreground" />
										</div>
										<p>Nenhum tipo cadastrado</p>
										<p className="text-sm text-muted-foreground">Clique em "Novo Tipo" para começar</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							types?.map((type) => (
								<TableRow key={type.id} className="hover:bg-muted/50 transition-colors">
									<TableCell className="py-4 px-6 font-medium">{type.label}</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(type)}
												className="h-8 w-8 hover:bg-muted"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDeleteClick({ id: type.id, label: type.label })}
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
							Tem certeza que deseja excluir o tipo "{typeToDelete?.label}"? Esta ação não pode ser desfeita.
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
