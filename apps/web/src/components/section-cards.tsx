import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card bg-gradient-to-br from-background via-background to-blue-500/5 border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs">Total de Ofertas</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
            1,250
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="h-5 text-xs px-1.5">
              <IconTrendingUp className="size-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="pt-2 pb-3">
          <div className="text-xs text-muted-foreground">
            Crescendo este mês
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-br from-background via-background to-green-500/5 border-border/50 shadow-sm hover:shadow-md transition-all hover:border-success/20">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs">Mais Ativas</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
            234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="h-5 text-xs px-1.5">
              <IconTrendingUp className="size-3" />
              +20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="pt-2 pb-3">
          <div className="text-xs text-muted-foreground">
            Oportunidades em alta
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-br from-background via-background to-purple-500/5 border-border/50 shadow-sm hover:shadow-md transition-all hover:border-purple-500/20">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs">Tendências</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
            45
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="h-5 text-xs px-1.5">
              <IconTrendingDown className="size-3" />
              -12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="pt-2 pb-3">
          <div className="text-xs text-muted-foreground">
            Mudanças detectadas
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-br from-background via-background to-orange-500/5 border-border/50 shadow-sm hover:shadow-md transition-all hover:border-orange-500/20">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs">Coletas Hoje</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="h-5 text-xs px-1.5">
              <IconTrendingUp className="size-3" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="pt-2 pb-3">
          <div className="text-xs text-muted-foreground">
            Dados atualizados
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}