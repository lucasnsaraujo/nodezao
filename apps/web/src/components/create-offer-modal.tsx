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
			onMutate: async (newOffer) => {
				// Cancel any outgoing refetches to avoid overwriting optimistic update
				await queryClient.cancelQueries({ queryKey: [["offer", "getAll"]] });

				// Snapshot the previous value
				const previousOffers = queryClient.getQueryData([["offer", "getAll"]]);

				// Optimistically update to the new value (show in list immediately)
				queryClient.setQueryData([["offer", "getAll"]], (old: any) => {
					if (!old?.data) return old;

					const optimisticOffer = {
						uuid: `temp-${Date.now()}`, // Temporary ID
						name: "Coletando dados...",
						isActive: true,
						createdAt: new Date().toISOString(),
						pages: [],
						badges: [],
						facebookUrls: newOffer.facebookUrls,
					};

					return {
						...old,
						data: [optimisticOffer, ...old.data],
					};
				});

				// Return context with snapshot for rollback on error
				return { previousOffers };
			},
			onSuccess: (data) => {
				toast.success("Oferta criada! Coletando dados da página...");
				queryClient.invalidateQueries({ queryKey: [["offer", "getAll"]] });
				onOpenChange(false);
				setFacebookUrl("");
				// Redirect to offer detail page
				if (data) {
					navigate({ to: `/offers/${data.uuid}` });
				}
			},
			onError: (error, _newOffer, context) => {
				// Rollback on error
				if (context?.previousOffers) {
					queryClient.setQueryData([["offer", "getAll"]], context.previousOffers);
				}
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
					<DialogTitle className="text-section-title">Nova Oferta</DialogTitle>
					<DialogDescription>
						Cole o link do Facebook Ad Library para começar a rastrear.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-3">
						<Label htmlFor="facebook-url" className="text-label">URL do Facebook Ad Library</Label>
						<Input
							id="facebook-url"
							type="url"
							value={facebookUrl}
							onChange={(e) => setFacebookUrl(e.target.value)}
							placeholder="https://facebook.com/ads/library/?active_status=..."
							required
							autoFocus
							className="h-11"
						/>
						<p className="text-caption text-muted-foreground">
							A oferta aparecerá na lista instantaneamente enquanto coletamos os dados
						</p>
					</div>

					<DialogFooter className="gap-2">
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
						<Button
							type="submit"
							disabled={createMutation.isPending}
							className="hover-scale"
						>
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
