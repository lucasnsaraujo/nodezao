import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tantml:react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RegionsSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingRegion, setEditingRegion] = useState<any>(null);
	const [formData, setFormData] = useState({ name: "" });

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

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir esta região?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (region: any) => {
		setEditingRegion(region);
		setFormData({ name: region.name });
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

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{regions?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="text-center text-muted-foreground">
									Nenhuma região cadastrada
								</TableCell>
							</TableRow>
						) : (
							regions?.map((region) => (
								<TableRow key={region.id}>
									<TableCell className="font-medium">{region.name}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(region)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(region.id)}
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
