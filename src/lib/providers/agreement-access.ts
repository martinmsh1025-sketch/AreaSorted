export function getAgreementAsset(type: string) {
  if (type === "sole-trader") {
    return {
      title: "Sole Trader Agreement",
      version: "sole-trader-v1",
      downloadUrl: "/provider-agreements/sole-trader-v1.txt",
    };
  }

  return {
    title: "Company Provider Agreement",
    version: "company-provider-v1",
    downloadUrl: "/provider-agreements/company-provider-v1.txt",
  };
}
