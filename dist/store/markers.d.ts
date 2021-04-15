import type ResultView from "../components/result-view";
export default class MarkerStore {
    markers: Map<number, ResultView>;
    clear(): void;
    clearOnRow(row: number): boolean;
    new(bubble: ResultView): void;
    delete(key: number): void;
}
