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

export function NichesSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingNiche, setEditingNiche] = useState<any>(null);
	const [formData, setFormData] = useState({ slug: "", label: "", isActive: true });

	const nichesQuery = trpc.config.niches.getAll.queryOptions();
	const { data: niches, isLoading } = useQuery(nichesQuery);

	const createMutation = useMutation(
		trpc.config.niches.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ slug: "", label: "", isActive: true });
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.niches.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
				setEditingNiche(null);
				setFormData({ slug: "", label: "", isActive: true });
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.niches.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: nichesQuery.queryKey });
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
		if (!editingNiche) return;
		updateMutation.mutate({
			id: editingNiche.id,
			slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
			label: formData.label,
			isActive: formData.isActive,
		});
	};

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir este nicho?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (niche: any) => {
		setEditingNiche(niche);
		setFormData({
			slug: niche.slug,
			label: niche.label,
			isActive: niche.isActive,
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
							Novo Nicho
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Nicho</DialogTitle>
							<DialogDescription>
								Adicione um novo nicho para categorizar ofertas
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="slug">Slug (ex: weight-loss, finance)</Label>
								<Input
									id="slug"
									value={formData.slug}
									onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
									placeholder="weight-loss"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="label">Nome</Label>
								<Input
									id="label"
									value={formData.label}
									onChange={(e) => setFormData({ ...formData, label: e.target.value })}
									placeholder="Emagrecimento"
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

			<Dialog open={!!editingNiche} onOpenChange={(open) => !open && setEditingNiche(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Nicho</DialogTitle>
						<DialogDescription>
							Atualize as informações do nicho
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
						<Button variant="outline" onClick={() => setEditingNiche(null)}>
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
						{niches?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground">
									Nenhum nicho cadastrado
								</TableCell>
							</TableRow>
						) : (
							niches?.map((niche) => (
								<TableRow key={niche.id}>
									<TableCell className="font-mono font-medium">{niche.slug}</TableCell>
									<TableCell>{niche.label}</TableCell>
									<TableCell>
										{niche.isActive ? (
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
												onClick={() => openEditDialog(niche)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(niche.id)}
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
