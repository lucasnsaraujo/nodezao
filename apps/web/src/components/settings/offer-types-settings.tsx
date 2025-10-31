import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OfferTypesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingType, setEditingType] = useState<any>(null);
	const [formData, setFormData] = useState({ label: "" });

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

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir este tipo?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (type: any) => {
		setEditingType(type);
		setFormData({ label: type.label });
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin" />
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

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{types?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="text-center text-muted-foreground">
									Nenhum tipo cadastrado
								</TableCell>
							</TableRow>
						) : (
							types?.map((type) => (
								<TableRow key={type.id}>
									<TableCell className="font-medium">{type.label}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(type)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(type.id)}
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
