/* @flow */

import type ResultView from "./../components/result-view";

export default class MarkerStore {
  markers: Map<number, ResultView> = new Map();

  clear() {
    this.markers.forEach((bubble: ResultView) => bubble.destroy());
    this.markers.clear();
  }

  clearOnRow(row: number) {
    let destroyed = false;
    this.markers.forEach((bubble: ResultView, key: number) => {
      const { start, end } = bubble.marker.getBufferRange();
      if (start.row <= row && row <= end.row) {
        this.delete(key);
        destroyed = true;
      }
    });
    return destroyed;
  }

  new(bubble: ResultView) {
    this.markers.set(bubble.marker.id, bubble);
  }

  delete(key: number) {
    const bubble = this.markers.get(key);
    if (bubble) bubble.destroy();
    this.markers.delete(key);
  }
}
