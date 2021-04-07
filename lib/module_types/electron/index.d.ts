interface OpenExternalOptions {
  activate?: boolean;
  workingDirectory?: string;
}

declare module "electron" {
  export const shell: {
    openExternal(url: string, options?: OpenExternalOptions): void;
  };
}
