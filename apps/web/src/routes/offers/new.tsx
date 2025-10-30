import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/offers/new")({
	component: NewOfferRoute,
	beforeLoad: ({ context }) => {
		if (!context.queryClient) {
			throw new Error("No session");
		}
	},
});

function NewOfferRoute() {
	// Redirect to /offers since we now use a modal
	return <Navigate to="/offers" />;
}
