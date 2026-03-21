import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderOrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1 h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Table header */}
              <div className="flex items-center gap-4 border-b px-4 py-3">
                {["w-16", "w-24", "w-20", "w-16", "w-24", "w-20", "w-16", "w-16", "w-16"].map((w, i) => (
                  <Skeleton key={i} className={`h-4 ${w}`} />
                ))}
              </div>
              {/* Table rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
