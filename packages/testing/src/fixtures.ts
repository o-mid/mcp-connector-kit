import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/** Loads a JSON fixture from disk. */
export async function loadFixture<T>(fixturePath: string): Promise<T> {
  const raw = await readFile(fixturePath, "utf8");
  return JSON.parse(raw) as T;
}

/** Persists a sanitized upstream payload for offline replay tests. */
export async function saveFixture(dir: string, name: string, payload: unknown): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}
