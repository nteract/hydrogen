export declare type HydrogenCellType = "codecell" | "markdown";
export declare type Message = {
    header: Record<string, any>;
    parent_header: Record<string, any>;
    content: Record<string, any>;
};
