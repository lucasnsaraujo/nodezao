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

export function TagsSettings() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<any>(null);
	const [formData, setFormData] = useState({ name: "", color: "#FACC15" });

	const queryClient = useQueryClient();
	const tagsQuery = trpc.config.tags.getAll.queryOptions();
	const { data: tags, isLoading } = useQuery(tagsQuery);

	const createMutation = useMutation(
		trpc.config.tags.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: tagsQuery.queryKey });
				setIsCreateOpen(false);
				setFormData({ name: "", color: "#FACC15" });
			},
		})
	);

	const updateMutation = useMutation(
		trpc.config.tags.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: tagsQuery.queryKey });
				setEditingTag(null);
				setFormData({ name: "", color: "#FACC15" });
			},
		})
	);

	const deleteMutation = useMutation(
		trpc.config.tags.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: tagsQuery.queryKey });
			},
		})
	);

	const handleCreate = () => {
		createMutation.mutate({
			name: formData.name,
			color: formData.color,
		});
	};

	const handleUpdate = () => {
		if (!editingTag) return;
		updateMutation.mutate({
			id: editingTag.id,
			name: formData.name,
			color: formData.color,
		});
	};

	const handleDelete = (id: number) => {
		if (confirm("Tem certeza que deseja excluir esta tag?")) {
			deleteMutation.mutate({ id });
		}
	};

	const openEditDialog = (tag: any) => {
		setEditingTag(tag);
		setFormData({
			name: tag.name,
			color: tag.color || "#FACC15",
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-9 w-[110px]" />
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Cor</TableHead>
								<TableHead>Preview</TableHead>
								<TableHead className="w-[100px]">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
									<TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
									<TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
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
							Nova Tag
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Nova Tag</DialogTitle>
							<DialogDescription>
								Adicione uma nova tag para organizar ofertas
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									placeholder="top"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="color">Cor</Label>
								<div className="flex gap-2">
									<Input
										type="color"
										id="color"
										value={formData.color}
										onChange={(e) => setFormData({ ...formData, color: e.target.value })}
										className="h-10 w-20"
									/>
									<Input
										type="text"
										value={formData.color}
										onChange={(e) => setFormData({ ...formData, color: e.target.value })}
										placeholder="#FACC15"
										className="flex-1"
									/>
								</div>
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

			<Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Tag</DialogTitle>
						<DialogDescription>
							Atualize as informações da tag
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Nome</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-color">Cor</Label>
							<div className="flex gap-2">
								<Input
									type="color"
									id="edit-color"
									value={formData.color}
									onChange={(e) => setFormData({ ...formData, color: e.target.value })}
									className="h-10 w-20"
								/>
								<Input
									type="text"
									value={formData.color}
									onChange={(e) => setFormData({ ...formData, color: e.target.value })}
									className="flex-1"
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingTag(null)}>
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
							<TableHead>Cor</TableHead>
							<TableHead>Preview</TableHead>
							<TableHead className="w-[100px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tags?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground">
									Nenhuma tag cadastrada
								</TableCell>
							</TableRow>
						) : (
							tags?.map((tag) => (
								<TableRow key={tag.id}>
									<TableCell className="font-medium">{tag.name}</TableCell>
									<TableCell className="font-mono text-xs">{tag.color}</TableCell>
									<TableCell>
										<Badge style={{ backgroundColor: tag.color || '#FACC15' }} className="text-white">
											{tag.name}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => openEditDialog(tag)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(tag.id)}
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
