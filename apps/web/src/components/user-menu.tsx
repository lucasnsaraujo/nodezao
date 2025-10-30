import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";

export default function UserMenu() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link to="/login">Entrar</Link>
			</Button>
		);
	}

	return (
		<Button asChild>
			<Link to="/offers">Dashboard</Link>
		</Button>
	);
}
