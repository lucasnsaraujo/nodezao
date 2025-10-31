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

export function StrategiesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingStrategy, setEditingStrategy] = useState<any>(null);
	const [formData, setFormData] = useState({ label: "" });
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [strategyToDelete, setStrategyToDelete] = useState<{ id: number; label: string } | null>(null);

	const queryClient = useQueryClient();
	const strategiesQuery = trpc.config.strategies.getAll.queryOptions();
	const { data: strategies, isLoading } = useQuery(strategiesQuery);

	const createMutation = useMutation(
		trpc.config.strategies.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: strategiesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ label: "" });
				toast.success("Estratégia criada com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao criar estratégia: ${error.message}`);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.strategies.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: strategiesQuery.queryKey });
				setEditingStrategy(null);
				setFormData({ label: "" });
				toast.success("Estratégia atualizada com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao atualizar estratégia: ${error.message}`);
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.strategies.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: strategiesQuery.queryKey });
				toast.success("Estratégia excluída com sucesso!");
			},
			onError: (error) => {
				toast.error(`Erro ao excluir estratégia: ${error.message}`);
			},
		})
	);

	const handleCreate = () => {
		if (!formData.label.trim()) {
			toast.error("Digite um nome para a estratégia");
			return;
		}
		createMutation.mutate({ label: formData.label });
	};

	const handleUpdate = () => {
		if (!editingStrategy) return;
		if (!formData.label.trim()) {
			toast.error("Digite um nome para a estratégia");
			return;
		}
		updateMutation.mutate({
			id: editingStrategy.id,
			label: formData.label,
		});
	};

	const handleDeleteClick = (strategy: { id: number; label: string }) => {
		setStrategyToDelete(strategy);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (strategyToDelete) {
			deleteMutation.mutate({ id: strategyToDelete.id });
		}
		setDeleteConfirmOpen(false);
		setStrategyToDelete(null);
	};

	const openEditDialog = (strategy: any) => {
		setEditingStrategy(strategy);
		setFormData({ label: strategy.label });
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-9 w-[160px] rounded" />
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
							Nova Estratégia
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Nova Estratégia</DialogTitle>
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
									placeholder="Ex: VSL, Quiz, Landing Page"
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Ex: "Mini VSL" → slug: "mini-vsl"
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

			<Dialog open={!!editingStrategy} onOpenChange={(open) => !open && setEditingStrategy(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Estratégia</DialogTitle>
						<DialogDescription>
							Atualize o nome da estratégia
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-label">Nome</Label>
							<Input
								id="edit-label"
								value={formData.label}
								onChange={(e) => setFormData({ label: e.target.value })}
								placeholder="Ex: VSL, Quiz, Landing Page"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingStrategy(null)}>
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
						{strategies?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="rounded-full bg-muted/50 p-3">
											<Plus className="h-6 w-6 text-muted-foreground" />
										</div>
										<p>Nenhuma estratégia cadastrada</p>
										<p className="text-sm text-muted-foreground">Clique em "Nova Estratégia" para começar</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							strategies?.map((strategy) => (
								<TableRow key={strategy.id} className="hover:bg-muted/50 transition-colors">
									<TableCell className="py-4 px-6 font-medium">{strategy.label}</TableCell>
									<TableCell className="py-4 px-6">
										<div className="flex gap-1 justify-end">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(strategy)}
												className="h-8 w-8 hover:bg-muted"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDeleteClick({ id: strategy.id, label: strategy.label })}
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
							Tem certeza que deseja excluir a estratégia "{strategyToDelete?.label}"? Esta ação não pode ser desfeita.
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
