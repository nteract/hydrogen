import type Kernel from "../kernel";
declare type Props = {
    store: {
        kernel: Kernel | null | undefined;
    };
};
declare const Inspector: ({ store: { kernel } }: Props) => any;
export default Inspector;
