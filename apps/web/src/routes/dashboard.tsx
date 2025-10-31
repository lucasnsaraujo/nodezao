import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { OfferDataTable } from "@/components/offer-data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

// Mock data for the table
const mockData = [
  {
    id: "1",
    name: "Summer Sale Campaign",
    page: {
      name: "Best Deals Store",
      pageId: "page1"
    },
    currentCreatives: 156,
    yesterdayCreatives: 142,
    isScaling: true,
    isDropping: false,
    status: 'active' as const,
    region: { id: "us", name: "USA", flag: "🇺🇸" },
    offerType: { id: "ecom", name: "E-commerce", emoji: "🛒" },
    niche: { id: "fashion", name: "Fashion", emoji: "👗" },
    badges: [
      { id: "hot", name: "Hot", emoji: "🔥" },
      { id: "trending", name: "Trending", emoji: "📈" }
    ]
  },
  {
    id: "2",
    name: "Black Friday Mega Deal",
    page: {
      name: "Tech Paradise",
      pageId: "page2"
    },
    currentCreatives: 234,
    yesterdayCreatives: 198,
    isScaling: true,
    isDropping: false,
    status: 'active' as const,
    region: { id: "br", name: "Brazil", flag: "🇧🇷" },
    offerType: { id: "tech", name: "Technology", emoji: "💻" },
    niche: { id: "electronics", name: "Electronics", emoji: "📱" },
    badges: [
      { id: "new", name: "New", emoji: "✨" }
    ]
  },
  {
    id: "3",
    name: "Weight Loss Secret",
    page: {
      name: "Health Gurus",
      pageId: "page3"
    },
    currentCreatives: 89,
    yesterdayCreatives: 145,
    isScaling: false,
    isDropping: true,
    status: 'active' as const,
    region: { id: "uk", name: "UK", flag: "🇬🇧" },
    offerType: { id: "health", name: "Health", emoji: "💊" },
    niche: { id: "fitness", name: "Fitness", emoji: "💪" },
    badges: []
  },
  {
    id: "4",
    name: "Crypto Trading Bot",
    page: {
      name: "Wealth Builders",
      pageId: "page4"
    },
    currentCreatives: 312,
    yesterdayCreatives: 287,
    isScaling: false,
    isDropping: false,
    status: 'active' as const,
    region: { id: "global", name: "Global", flag: "🌍" },
    offerType: { id: "finance", name: "Finance", emoji: "💰" },
    niche: { id: "crypto", name: "Crypto", emoji: "₿" },
    badges: [
      { id: "verified", name: "Verified", emoji: "✅" }
    ]
  },
  {
    id: "5",
    name: "Online Course Bundle",
    page: {
      name: "Learn Pro Academy",
      pageId: "page5"
    },
    currentCreatives: 67,
    yesterdayCreatives: 82,
    isScaling: false,
    isDropping: true,
    status: 'inactive' as const,
    region: { id: "in", name: "India", flag: "🇮🇳" },
    offerType: { id: "education", name: "Education", emoji: "📚" },
    niche: { id: "courses", name: "Courses", emoji: "🎓" },
    badges: []
  }
];

function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <ChartAreaInteractive />
              <OfferDataTable data={mockData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}