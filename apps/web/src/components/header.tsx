import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				{/* Logo */}
				<Link
					to="/"
					className="flex items-center space-x-2 transition-opacity hover:opacity-80"
				>
					<span className="text-2xl font-bold bg-gradient-to-r from-[#FACC15] to-[#F59E0B] dark:from-[#FACC15] dark:to-[#F59E0B] bg-clip-text text-transparent">
						AdScope
					</span>
				</Link>

				{/* Right side actions */}
				<div className="flex items-center gap-3">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
