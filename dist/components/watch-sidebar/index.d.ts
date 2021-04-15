declare type store = typeof import("../../store").default;
declare const Watches: ({ store: { kernel } }: {
    store: store;
}) => JSX.Element;
export default Watches;
