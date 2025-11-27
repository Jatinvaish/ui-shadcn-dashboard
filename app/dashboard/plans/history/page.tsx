"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  fetchSubscriptionHistory, 
  selectSubscriptionHistory, 
  selectSubscriptionLoading, 
  selectSubscriptionError 
} from "@/store/slices/subscriptionSlice"
import type { AppDispatch } from "@/store/store"
import { Loader2, AlertCircle, ArrowUp, ArrowDown, RefreshCw, XCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

export default function SubscriptionHistoryPage() {
  const dispatch = useDispatch<AppDispatch>()
  const history = useSelector(selectSubscriptionHistory)
  const isLoading = useSelector(selectSubscriptionLoading)
  const error = useSelector(selectSubscriptionError)

  useEffect(() => {
    dispatch(fetchSubscriptionHistory())
  }, [dispatch])

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "upgrade":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "downgrade":
        return <ArrowDown className="h-4 w-4 text-orange-600" />
      case "cancel":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "initial":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    const variants: Record<string, any> = {
      upgrade: "default",
      downgrade: "secondary",
      cancel: "destructive",
      initial: "outline",
      change: "secondary"
    }

    return (
      <Badge variant={variants[changeType] || "secondary"} className="capitalize">
        {changeType}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription History</h1>
        <p className="text-muted-foreground mt-2">View all changes to your subscription plan</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No subscription history found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item: any, index: number) => (
            <Card key={item.id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getChangeIcon(item.change_type)}
                      <CardTitle className="text-lg">
                        {item.change_type === "initial" 
                          ? "Subscription Started" 
                          : `Plan ${item.change_type}`}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {format(new Date(item.created_at), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  {getChangeTypeBadge(item.change_type)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan Change Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  {item.from_plan_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">From Plan</p>
                      <p className="font-medium">{item.from_plan_name}</p>
                    </div>
                  )}
                  {item.to_plan_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">To Plan</p>
                      <p className="font-medium">{item.to_plan_name}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Additional Details */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  {item.price_at_change && (
                    <div>
                      <p className="text-muted-foreground mb-1">Price</p>
                      <p className="font-medium">
                        {item.currency || "USD"} ${item.price_at_change}
                      </p>
                    </div>
                  )}
                  {item.billing_cycle && (
                    <div>
                      <p className="text-muted-foreground mb-1">Billing Cycle</p>
                      <p className="font-medium capitalize">{item.billing_cycle}</p>
                    </div>
                  )}
                  {item.effective_date && (
                    <div>
                      <p className="text-muted-foreground mb-1">Effective Date</p>
                      <p className="font-medium">{format(new Date(item.effective_date), "PP")}</p>
                    </div>
                  )}
                </div>

                {/* Change Reason */}
                {item.change_reason && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{item.change_reason}</p>
                    </div>
                  </>
                )}

                {/* Changed By */}
                {(item.changed_by_first_name || item.changed_by_email) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Changed by:</span>
                      <span className="font-medium text-foreground">
                        {item.changed_by_first_name && item.changed_by_last_name
                          ? `${item.changed_by_first_name} ${item.changed_by_last_name}`
                          : item.changed_by_email}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}