import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				{/* Page Content */}
				<div className="flex flex-1 flex-col gap-4 p-4">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
