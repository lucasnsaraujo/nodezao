"use client"

import * as React from "react"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconFlame,
  IconClock,
  IconEye,
  IconBrandFacebook,
  IconCalendar,
  IconMap,
  IconTag,
  IconTarget,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OfferData {
  id: string
  name: string
  page?: {
    name: string
    pageId: string
  }
  currentCreatives: number
  yesterdayCreatives: number
  isScaling: boolean
  isDropping: boolean
  status?: 'active' | 'inactive'
  region?: { id: string; name: string; flag: string }
  offerType?: { id: string; name: string; emoji: string }
  niche?: { id: string; name: string; emoji: string }
  badges?: Array<{ id: string; name: string; emoji: string }>
}

interface OfferDetailDrawerProps {
  offer: OfferData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OfferDetailDrawer({ offer, open, onOpenChange }: OfferDetailDrawerProps) {
  if (!offer) return null

  const delta = offer.currentCreatives - offer.yesterdayCreatives
  const percentChange = offer.yesterdayCreatives > 0
    ? ((delta / offer.yesterdayCreatives) * 100).toFixed(0)
    : 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="fixed inset-x-0 bottom-0 max-h-[90vh]">
        <DrawerHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">
                {offer.name}
              </DrawerTitle>
              {offer.page && (
                <DrawerDescription className="mt-1">
                  <span className="inline-flex items-center gap-1">
                    <IconBrandFacebook className="size-3" />
                    {offer.page.name}
                  </span>
                </DrawerDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {offer.isScaling && (
                <Badge variant="default" className="gap-1">
                  <IconFlame className="size-3" />
                  Scaling
                </Badge>
              )}
              {offer.isDropping && (
                <Badge variant="secondary" className="gap-1">
                  <IconClock className="size-3" />
                  Dropping
                </Badge>
              )}
              {!offer.isScaling && !offer.isDropping && (
                <Badge variant="outline">Stable</Badge>
              )}
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="creatives">Creatives</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{offer.currentCreatives}</p>
                      <p className="text-xs text-muted-foreground">Current Creatives</p>
                    </div>
                    <div className="text-right">
                      {delta !== 0 && (
                        <div className="flex items-center gap-1">
                          {delta > 0 ? (
                            <IconTrendingUp className="size-4 text-green-500" />
                          ) : (
                            <IconTrendingDown className="size-4 text-red-500" />
                          )}
                          <span className={delta > 0 ? "text-green-500" : "text-red-500"}>
                            {delta > 0 ? "+" : ""}{delta} ({percentChange}%)
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">vs Yesterday</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {offer.region && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconMap className="size-4" />
                        Region
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        {offer.region.flag} {offer.region.name}
                      </span>
                    </div>
                  )}
                  {offer.offerType && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconTarget className="size-4" />
                        Type
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        {offer.offerType.emoji} {offer.offerType.name}
                      </span>
                    </div>
                  )}
                  {offer.niche && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconTag className="size-4" />
                        Niche
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        {offer.niche.emoji} {offer.niche.name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {offer.badges && offer.badges.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {offer.badges.map((badge) => (
                        <Badge key={badge.id} variant="outline">
                          {badge.emoji} {badge.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="creatives" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Creative Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of creative performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Creative analysis coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Historical Data</CardTitle>
                  <CardDescription>
                    Track changes over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Historical tracking coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={`/offers/${offer.id}`}>
                <IconEye className="mr-2 size-4" />
                View Full Details
              </a>
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Close</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}