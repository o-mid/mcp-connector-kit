export type CatalogTier = "free" | "paid";

export type DemoField = "query" | "place" | "code" | "symbols";

export type CatalogTool = {
  name: string;
  description: string;
};

export type CatalogDemo = {
  id: string;
  label: string;
  tool: string;
  field?: DemoField;
  placeholder?: string;
  value: string;
  input: Record<string, unknown>;
};

export type CatalogSource = {
  id: string;
  title: string;
  tier: CatalogTier;
  package: string;
  hosts: string[];
  note: string;
  tools: CatalogTool[];
  demo: CatalogDemo | null;
};

export type CatalogFile = {
  profiles: Record<string, string[]>;
  sources: CatalogSource[];
};
