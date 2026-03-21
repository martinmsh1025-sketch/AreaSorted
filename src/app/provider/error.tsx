"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ProviderError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                  {error.message || "An unexpected error occurred in the provider portal."}
                </p>
              </div>
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="size-3.5" />
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
