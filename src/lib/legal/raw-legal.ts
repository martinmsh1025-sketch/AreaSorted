import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readRawLegalFile(fileName: string) {
  const filePath = path.join(process.cwd(), "src/content/legal", fileName);
  return readFile(filePath, "utf8");
}
