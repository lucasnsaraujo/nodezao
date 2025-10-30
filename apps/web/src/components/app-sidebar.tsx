import { ChevronUp, LogOut, Package, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
	{
		title: "Ofertas",
		url: "/offers",
		icon: Package,
	},
	{
		title: "Configurações",
		url: "/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate({ to: "/" });
	};

	return (
		<Sidebar collapsible="icon">
			{/* Header */}
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/offers">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FACC15] to-[#F59E0B] text-sidebar-primary-foreground">
									<span className="text-lg font-bold">A</span>
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">AdScope</span>
									<span className="truncate text-xs">Monitoramento de Ads</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			{/* Content */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Footer */}
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarFallback className="rounded-lg bg-gradient-to-br from-[#FACC15] to-[#F59E0B] text-sidebar-primary-foreground">
											{session?.user?.name?.charAt(0).toUpperCase() || "U"}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{session?.user?.name || "Usuário"}
										</span>
										<span className="truncate text-xs">
											{session?.user?.email || "email@example.com"}
										</span>
									</div>
									<ChevronUp className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="top"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Sair</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
