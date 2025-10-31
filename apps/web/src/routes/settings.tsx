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
		<DashboardLayout>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Configurações
					</h1>
					<p className="text-muted-foreground">
						Gerencie regiões, tipos de produto, nichos, estratégias e badges
					</p>
				</div>

				<Tabs defaultValue="regions" className="space-y-4">
					<TabsList>
						<TabsTrigger value="regions">Regiões</TabsTrigger>
						<TabsTrigger value="types">Tipos de Produto</TabsTrigger>
						<TabsTrigger value="niches">Nichos</TabsTrigger>
						<TabsTrigger value="strategies">Estratégias</TabsTrigger>
						<TabsTrigger value="badges">Badges</TabsTrigger>
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
		</DashboardLayout>
	);
}
