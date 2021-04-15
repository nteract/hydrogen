import { Disposable } from "atom";
import { StatusBar as AtomStatusBar } from "atom/status-bar";
import SignalListView from "./signal-list-view";
import type { Store } from "../../../store";
export declare class StatusBarConsumer {
    signalListView: SignalListView;
    addStatusBar(store: Store, statusBar: AtomStatusBar, handleKernelCommand: (...args: Array<any>) => any): Disposable;
    showKernelCommands(store: Store, handleKernelCommand: (...args: Array<any>) => any): void;
}
declare const statusBarConsumer: StatusBarConsumer;
export default statusBarConsumer;
