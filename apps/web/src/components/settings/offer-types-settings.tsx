import { useState } from "react";
import { trpc, queryClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OfferTypesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingType, setEditingType] = useState<any>(null);
	const [formData, setFormData] = useState({ slug: "", label: "", isActive: true });

	const typesQuery = trpc.config.offerTypes.getAll.queryOptions();
	const { data: types, isLoading } = useQuery(typesQuery);

	const createMutation = useMutation(
		trpc.config.offerTypes.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ slug: "", label: "", isActive: true });
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.offerTypes.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
				setEditingType(null);
				setFormData({ slug: "", label: "", isActive: true });
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.offerTypes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: typesQuery.queryKey });
			},
		})
	);

	const handleCreate = () => {
		createMutation.mutate({
			slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
			label: formData.label,
			isActive: formData.isActive,
		});
	};

	const handleUpdate = () => {
		if (!editingType) return;
		updateMutation.mutate({
			id: editingType.id,
			slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
			label: formData.label,
			isActive: formData.isActive,
		});
	};

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir este tipo?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (type: any) => {
		setEditingType(type);
		setFormData({
			slug: type.slug,
			label: type.label,
			isActive: type.isActive,
		});
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
								Adicione um novo tipo de produto para classificar ofertas
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="slug">Slug (ex: physical, digital)</Label>
								<Input
									id="slug"
									value={formData.slug}
									onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
									placeholder="physical"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="label">Nome</Label>
								<Input
									id="label"
									value={formData.label}
									onChange={(e) => setFormData({ ...formData, label: e.target.value })}
									placeholder="Produto Físico"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={!formData.slug || !formData.label || createMutation.isPending}>
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
							Atualize as informações do tipo
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-slug">Slug</Label>
							<Input
								id="edit-slug"
								value={formData.slug}
								onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-label">Nome</Label>
							<Input
								id="edit-label"
								value={formData.label}
								onChange={(e) => setFormData({ ...formData, label: e.target.value })}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingType(null)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={!formData.slug || !formData.label || updateMutation.isPending}>
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
							<TableHead>Slug</TableHead>
							<TableHead>Nome</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{types?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground">
									Nenhum tipo cadastrado
								</TableCell>
							</TableRow>
						) : (
							types?.map((type) => (
								<TableRow key={type.id}>
									<TableCell className="font-mono font-medium">{type.slug}</TableCell>
									<TableCell>{type.label}</TableCell>
									<TableCell>
										{type.isActive ? (
											<Badge variant="default" className="bg-green-500">Ativo</Badge>
										) : (
											<Badge variant="secondary">Inativo</Badge>
										)}
									</TableCell>
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
