import { TextEditor, CompositeDisposable, Disposable } from "atom";
import { AutocompleteWatchEditor as AtomAutocompleteWatchEditor } from "atom/autocomplete-plus";
import type { Store } from "../../store";
import type WatchesStore from "../../store/watches";
import type WatchStore from "../../store/watch";
export declare class AutocompleteWatchEditor {
    disposables: CompositeDisposable;
    addAutocompleteToEditor: (editor: TextEditor, labels: Array<string>) => Disposable;
    isEnabeled: boolean;
    consume(store: Store, watchEditor: AtomAutocompleteWatchEditor): Disposable;
    disable(store: Store): void;
    addAutocompleteToWatch(watchesStore: WatchesStore, watch: WatchStore): void;
    removeAutocompleteFromWatch(watchesStore: WatchesStore, watch: WatchStore): void;
    dispose(disposable: Disposable | CompositeDisposable): void;
    register(disposable: Disposable | CompositeDisposable): void;
}
declare const autocompleteConsumer: AutocompleteWatchEditor;
export default autocompleteConsumer;
