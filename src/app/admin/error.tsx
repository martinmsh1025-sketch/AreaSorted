"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/context";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-destructive mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangle className="size-5" />
          </div>
          <CardTitle className="text-lg">{t.common.somethingWentWrong}</CardTitle>
          <CardDescription>
            {t.common.unexpectedError}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} variant="default">
            {t.common.tryAgain}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
