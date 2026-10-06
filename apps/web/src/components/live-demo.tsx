"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_PRESETS, type CatalogDemo } from "@/generated/catalog";

type DemoResponse = {
  via?: "gateway" | "wikipedia";
  tool?: string;
  data?: unknown;
  error?: string;
};

type Preset = CatalogDemo;

const PRESETS: Preset[] = DEMO_PRESETS;

function inputFor(preset: Preset, value: string): Record<string, unknown> {
  if (preset.field === "query") return { ...preset.input, query: value };
  if (preset.field === "place") return { ...preset.input, place: value };
  if (preset.field === "code") return { ...preset.input, code: value };
  if (preset.field === "symbols") return { ...preset.input, symbols: value };
  return preset.input;
}

type Card = { title: string; detail?: string; href?: string | null };

function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function cardsFor(data: unknown): Card[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.results)) {
    return record.results.slice(0, 5).map((row) => {
      const item = row as Record<string, unknown>;
      const authors = Array.isArray(item.authors) ? item.authors.join(", ") : undefined;
      const bits = [
        authors,
        typeof item.year === "number" ? String(item.year) : undefined,
        typeof item.points === "number" ? `${item.points} points` : undefined,
        typeof item.description === "string" ? item.description : undefined,
        typeof item.citedBy === "number" ? `${item.citedBy} citations` : undefined,
      ].filter(Boolean);
      return {
        title: asText(item.title, "Result"),
        detail: bits.join(" · ") || undefined,
        href: typeof item.url === "string" ? item.url : null,
      };
    });
  }
  if (Array.isArray(record.quakes)) {
    return record.quakes.slice(0, 5).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        title: typeof item.place === "string" ? item.place : "Earthquake",
        detail: `M ${asText(item.magnitude, "?")} · ${typeof item.time === "string" ? item.time.slice(0, 16) : ""}`,
        href: typeof item.url === "string" ? item.url : null,
      };
    });
  }
  if (Array.isArray(record.rates)) {
    return record.rates.slice(0, 8).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        title: `${asText(record.base, "USD")} → ${asText(item.currency)}`,
        detail: asText(item.rate),
      };
    });
  }
  if (record.current && typeof record.current === "object") {
    const current = record.current as Record<string, unknown>;
    return [
      {
        title: asText(record.place, "Forecast"),
        detail: `${current.temperatureC}°C · ${current.condition} · wind ${current.windSpeedKmh} km/h`,
      },
    ];
  }
  if (typeof record.name === "string" && typeof record.capital === "string") {
    return [
      {
        title: `${record.name} (${record.code})`,
        detail: `${record.capital} · ${record.region} · ${record.income}`,
      },
    ];
  }
  return [];
}

export function LiveDemo() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [value, setValue] = useState(PRESETS[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResponse | null>(null);
  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[0];

  async function run(nextPreset: Preset, nextValue: string) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool: nextPreset.tool, input: inputFor(nextPreset, nextValue) }),
      });
      setResult((await res.json()) as DemoResponse);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  function pick(next: Preset) {
    setPresetId(next.id);
    setValue(next.value);
    void run(next, next.value);
  }

  const cards = result?.data ? cardsFor(result.data) : [];
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run(PRESETS[0], PRESETS[0].value);
  }, []);

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              pick(item);
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              item.id === preset.id
                ? "bg-white text-zinc-950"
                : "border border-white/10 text-zinc-300 hover:border-white/25"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(preset, value);
        }}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        {preset.field ? (
          <>
            <label className="sr-only" htmlFor="demo-field">
              {preset.label}
            </label>
            <input
              id="demo-field"
              value={value}
              placeholder={preset.placeholder}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-400/40 placeholder:text-zinc-600 focus:ring-2"
            />
          </>
        ) : (
          <p className="flex min-w-0 flex-1 items-center text-sm text-zinc-400">Significant earthquakes, past week.</p>
        )}
        <button
          type="submit"
          disabled={loading || (Boolean(preset.field) && value.trim().length === 0)}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Running" : preset.tool}
        </button>
      </form>
      {result?.error ? <p className="mt-4 text-sm text-red-300">{result.error}</p> : null}
      {result?.data ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            {result.tool} · {result.via === "gateway" ? "gateway /demo/mcp" : "Wikipedia opensearch, same output shape"}
          </p>
          {cards.length > 0 ? (
            <ul className="space-y-3">
              {cards.map((row) => (
                <li key={`${row.title}-${row.href ?? row.detail ?? ""}`} className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                  <p className="font-medium text-white">{row.title}</p>
                  {row.detail ? <p className="mt-1 text-sm text-zinc-400">{row.detail}</p> : null}
                  {row.href ? (
                    <a
                      href={row.href}
                      className="mt-2 inline-block max-w-full truncate font-mono text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
                    >
                      {row.href}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <pre className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
