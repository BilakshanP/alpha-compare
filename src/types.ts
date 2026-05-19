export interface CameraIndex {
  id: string;
  brand: string;
  label: string;
  model: string;
  mount: string;
  year: number;
  color: string;
  tags: string[];
}

export interface Spec {
  label: string;
  value: number | null;
  unit: string | null;
  display: string | null;
  note?: string;
}

export interface Section {
  id: string;
  label: string;
  specs: Spec[];
}

export interface CameraData {
  id: string;
  src: string;
  price: PriceData;
  sections: Section[];
  pros: string[];
  cons: string[];
}

export type Rule = "higher" | "lower" | "manual" | "tie";

export interface SpecMeta {
  rule: Rule;
}

export type SpecsMetaMap = Record<string, SpecMeta>;
export type NotesMap = Record<string, string>;

export interface CurrencyConfig {
  symbol: string;
  label: string;
}

export type CurrenciesMap = Record<string, CurrencyConfig>;
export type PppMap = Record<string, number>;
export type PriceMap = Record<string, number | null>;

export interface PriceData {
  current: Record<string, number>;
  launch: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
}
