export type PayloadRow = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export type GroupPreset = {
  id: string;
  name: string;
  endpoint: string;
  rows: PayloadRow[];
  createdAt: number;
  updatedAt: number;
};

export type LogItem = {
  id: string;
  ts: number;
  level: "info" | "warn" | "error";
  msg: string;
};
