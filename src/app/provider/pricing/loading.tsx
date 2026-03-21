import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderPricingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Price preview */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-52" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* Create / update rule */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Area overrides */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-44" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column (1/3) */}
        <div className="space-y-6">
          {/* Platform fees */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>

          {/* Pricing readiness */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
