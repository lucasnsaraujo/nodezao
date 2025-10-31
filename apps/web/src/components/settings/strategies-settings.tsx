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

export function StrategiesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingStrategy, setEditingStrategy] = useState<any>(null);
	const [formData, setFormData] = useState({ label: "" });

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

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir esta estratégia?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (strategy: any) => {
		setEditingStrategy(strategy);
		setFormData({ label: strategy.label });
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

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{strategies?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="text-center text-muted-foreground">
									Nenhuma estratégia cadastrada
								</TableCell>
							</TableRow>
						) : (
							strategies?.map((strategy) => (
								<TableRow key={strategy.id}>
									<TableCell className="font-medium">{strategy.label}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(strategy)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(strategy.id)}
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
