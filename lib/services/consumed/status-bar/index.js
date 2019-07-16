/* @flow */
<<<<<<< HEAD

export { default as StatusBar } from "./status-bar-component";
export { default as SignalListView } from "./signal-list-view";
export { default } from "./status-bar";
=======
import * as statusBarComponent from "./status-bar-component";
import * as signalListView from "./signal-list-view";
import * as statusBar from "./status-bar";

export default { ...statusBarComponent, ...signalListView, ...statusBar };
>>>>>>> Checkout to master to revert the changes
