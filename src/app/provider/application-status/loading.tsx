import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderApplicationStatusLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Status card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}
