import { IconTrendingDown, IconTrendingUp, IconFlame, IconPackage } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatsData {
  totalOffers: number
  activeOffers: number
  scalingOffers: number
  totalCreatives: number
  creativesChange: number
}

export function OfferStatsCards({ stats }: { stats: StatsData }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Offers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalOffers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPackage />
              All Offers
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tracking all your offers
          </div>
          <div className="text-muted-foreground">
            Across multiple regions
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Offers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeOffers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 dark:text-green-400">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Currently running ads
          </div>
          <div className="text-muted-foreground">
            {((stats.activeOffers / stats.totalOffers) * 100).toFixed(0)}% of total
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Scaling Offers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.scalingOffers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
              <IconFlame />
              Scaling
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing rapidly <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            High creative velocity
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Creatives</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalCreatives.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.creativesChange > 0 ? (
                <>
                  <IconTrendingUp />
                  +{stats.creativesChange}%
                </>
              ) : (
                <>
                  <IconTrendingDown />
                  {stats.creativesChange}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            24h change {stats.creativesChange > 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Across all offers
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}