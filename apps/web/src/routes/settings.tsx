import { DashboardLayout } from "@/components/dashboard-layout";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionsSettings } from "@/components/settings/regions-settings";
import { OfferTypesSettings } from "@/components/settings/offer-types-settings";
import { NichesSettings } from "@/components/settings/niches-settings";
import { StrategiesSettings } from "@/components/settings/strategies-settings";
import { BadgesSettings } from "@/components/settings/badges-settings";

export const Route = createFileRoute("/settings")({
	component: SettingsRoute,
	beforeLoad: ({ context }) => {
		if (!context.queryClient) {
			throw new Error("No session");
		}
	},
});

function SettingsRoute() {
	return (
		<DashboardLayout title="Configurações">
			<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
				<div className="px-4 lg:px-6">
					<h1 className="text-2xl font-semibold tracking-tight">
						Configurações
					</h1>
					<p className="text-sm text-muted-foreground">
						Gerencie regiões, tipos de produto, nichos, estratégias e badges
					</p>
				</div>

				<div className="px-4 lg:px-6">
					<Tabs defaultValue="regions" className="space-y-6">
						<TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1 bg-muted/50">
							<TabsTrigger value="regions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Regiões</TabsTrigger>
							<TabsTrigger value="types" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Tipos</TabsTrigger>
							<TabsTrigger value="niches" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Nichos</TabsTrigger>
							<TabsTrigger value="strategies" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Estratégias</TabsTrigger>
							<TabsTrigger value="badges" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Badges</TabsTrigger>
						</TabsList>

					<TabsContent value="regions">
						<Card>
							<CardHeader>
								<CardTitle>Regiões</CardTitle>
								<CardDescription>
									Gerencie as regiões disponíveis para classificar ofertas
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RegionsSettings />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="types">
						<Card>
							<CardHeader>
								<CardTitle>Tipos de Produto</CardTitle>
								<CardDescription>
									Gerencie os tipos de produto (físico, digital, serviço, etc.)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<OfferTypesSettings />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="niches">
						<Card>
							<CardHeader>
								<CardTitle>Nichos</CardTitle>
								<CardDescription>
									Gerencie os nichos de mercado para categorizar ofertas
								</CardDescription>
							</CardHeader>
							<CardContent>
								<NichesSettings />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="strategies">
						<Card>
							<CardHeader>
								<CardTitle>Estratégias</CardTitle>
								<CardDescription>
									Gerencie as estratégias de funil (VSL, Quiz, Landing Page, etc.)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<StrategiesSettings />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="badges">
						<Card>
							<CardHeader>
								<CardTitle>Badges</CardTitle>
								<CardDescription>
									Gerencie os badges de status para destacar ofertas
								</CardDescription>
							</CardHeader>
							<CardContent>
								<BadgesSettings />
							</CardContent>
						</Card>
					</TabsContent>
					</Tabs>
				</div>
			</div>
		</DashboardLayout>
	);
}
