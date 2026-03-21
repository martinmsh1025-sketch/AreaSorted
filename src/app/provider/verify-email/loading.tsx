import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderVerifyEmailLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Skeleton className="mx-auto size-10 rounded-full" />
          <Skeleton className="mx-auto h-6 w-36" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="mx-auto h-4 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}
