import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trpc, queryClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateOfferModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateOfferModal({ open, onOpenChange }: CreateOfferModalProps) {
	const navigate = useNavigate();
	const [facebookUrl, setFacebookUrl] = useState("");

	const createMutation = useMutation(
		trpc.offer.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Oferta criada! Preencha os detalhes.");
				queryClient.invalidateQueries({ queryKey: [["offer", "getAll"]] });
				onOpenChange(false);
				setFacebookUrl("");
				// Redirect to offer detail page
				if (data) {
					navigate({ to: `/offers/${data.uuid}` });
				}
			},
			onError: (error) => {
				toast.error(`Erro ao criar oferta: ${error.message}`);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const trimmedUrl = facebookUrl.trim();

		if (!trimmedUrl) {
			toast.error("Cole a URL do Facebook Ad Library");
			return;
		}

		// Validate Facebook URL
		const fbUrlRegex = /^https?:\/\/(www\.)?facebook\.com\/ads\/library\//i;
		if (!fbUrlRegex.test(trimmedUrl)) {
			toast.error("URL deve ser do Facebook Ad Library");
			return;
		}

		createMutation.mutate({
			facebookUrls: [trimmedUrl],
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Nova Oferta</DialogTitle>
					<DialogDescription>
						Cole o link do Facebook Ad Library para começar a rastrear.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="facebook-url">URL do Facebook Ad Library</Label>
						<Input
							id="facebook-url"
							type="url"
							value={facebookUrl}
							onChange={(e) => setFacebookUrl(e.target.value)}
							placeholder="https://facebook.com/ads/library/?active_status=..."
							required
							autoFocus
						/>
						<p className="text-xs text-muted-foreground">
							Você poderá adicionar mais páginas depois na tela de edição
						</p>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								onOpenChange(false);
								setFacebookUrl("");
							}}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Criando...
								</>
							) : (
								"Criar Oferta"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
