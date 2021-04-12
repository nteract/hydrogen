export type HydrogenCellType = "codecell" | "markdown";

// Be more specific
export type Message = {
  header: Record<string, any>;
  parent_header: Record<string, any>;
  content: Record<string, any>;
};
