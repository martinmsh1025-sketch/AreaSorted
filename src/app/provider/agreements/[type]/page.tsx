import Link from "next/link";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import { getAgreementAsset } from "@/lib/providers/agreement-access";
import { PrintAgreementButton } from "@/components/providers/print-agreement-button";

type Props = {
  params: Promise<{ type: string }>;
};

export default async function ProviderAgreementPage({ params }: Props) {
  await requireProviderOnboardingAccess();
  const { type } = await params;

  if (type !== "sole-trader" && type !== "company") {
    notFound();
  }

  const agreement = getAgreementAsset(type);
  const agreementFilePath = path.join(process.cwd(), "public", agreement.downloadUrl.replace(/^\//, ""));
  const agreementText = await readFile(agreementFilePath, "utf8");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Provider agreement</p>
          <h1 className="text-2xl font-semibold tracking-tight">{agreement.title}</h1>
          <p className="text-sm text-muted-foreground">Version: {agreement.version}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/provider/onboarding" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Back to onboarding
          </Link>
          <a href={agreement.downloadUrl} download className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700">
            Download text
          </a>
          <PrintAgreementButton />
        </div>
      </div>

      <div className="rounded-xl border bg-background shadow-sm">
        <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap break-words rounded-xl p-6 text-sm leading-7 text-foreground">
          {agreementText}
        </pre>
      </div>
    </main>
  );
}
