import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderOrderDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb + title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-1 h-8 w-40" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      {/* Action bar placeholder */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="space-y-1">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Detail cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-baseline justify-between gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Back button */}
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  );
}
