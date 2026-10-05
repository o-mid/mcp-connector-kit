import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

/** Loads a JSON fixture from a source fixtures directory. */
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

/** Contract test: fixture must satisfy upstream schema and match snapshot output. */
export function assertContract<TUpstream, TOutput>(
  upstreamSchema: z.ZodType<TUpstream>,
  outputSchema: z.ZodType<TOutput>,
  fixture: unknown,
  normalize: (upstream: TUpstream) => TOutput,
  expected: TOutput,
): void {
  const upstream = upstreamSchema.parse(fixture);
  const output = outputSchema.parse(normalize(upstream));
  expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
}

// vitest expect global in test files; here use simple throw
function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);
      }
    },
  };
}

/** Mutates a fixture field to assert drift detection in tests. */
export function mutateFixture<T extends Record<string, unknown>>(fixture: T, key: string): T {
  const copy = { ...fixture, [key]: undefined };
  delete copy[key];
  return copy;
}
