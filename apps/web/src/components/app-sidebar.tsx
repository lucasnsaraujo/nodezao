"use client"

import * as React from "react"
import {
	IconListDetails,
	IconSettings,
	IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Ofertas",
			url: "/offers",
			icon: IconListDetails,
		},
	],
	navSecondary: [
		{
			title: "Configurações",
			url: "/settings",
			icon: IconSettings,
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	// Update user data with session info
	const userData = React.useMemo(() => ({
		name: session?.user?.name || "Usuário",
		email: session?.user?.email || "email@example.com",
		avatar: "/avatars/shadcn.jpg",
	}), [session]);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<Link to="/offers">
								<IconInnerShadowTop className="!size-5" />
								<span className="text-base font-semibold">AdScope</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
		</Sidebar>
	)
}
