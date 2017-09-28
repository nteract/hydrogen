"use babel";

import { Range } from "atom";

import MarkerStore from "../../lib/store/markers";

describe("MarkerStore", () => {
  let store;
  beforeEach(() => {
    store = new MarkerStore();
  });

  it("correctly initializes MarkerStore", () => {
    expect(store.markers).toEqual(new Map());
  });

  it("clears markers", () => {
    const bubble1 = jasmine.createSpyObj("bubble1", ["destroy"]);
    const bubble2 = jasmine.createSpyObj("bubble2", ["destroy"]);

    store.markers.set(1, bubble1);
    store.markers.set(2, bubble2);
    expect(store.markers.size).toEqual(2);

    store.clear();

    expect(bubble1.destroy).toHaveBeenCalled();
    expect(bubble2.destroy).toHaveBeenCalled();
    expect(store.markers.size).toEqual(0);
  });

  it("stores a new marker", () => {
    const bubble = { marker: { id: 42 } };

    store.new(bubble);

    expect(store.markers.size).toEqual(1);
    expect(store.markers.get(42)).toEqual(bubble);
  });

  it("deletes a marker", () => {
    const bubble1 = jasmine.createSpyObj("bubble1", ["destroy"]);
    const bubble2 = jasmine.createSpyObj("bubble2", ["destroy"]);

    store.markers.set(1, bubble1);
    store.markers.set(2, bubble2);
    expect(store.markers.size).toEqual(2);

    store.delete(2);

    expect(bubble1.destroy).not.toHaveBeenCalled();
    expect(bubble2.destroy).toHaveBeenCalled();
    expect(store.markers.size).toEqual(1);
    expect(store.markers.get(1)).toEqual(bubble1);
  });

  it("clears bubble on row", () => {
    const bubble = {
      marker: { getBufferRange: () => new Range([5, 1], [5, 3]) }
    };

    spyOn(store, "delete");

    store.markers.set(1, bubble);
    expect(store.markers.size).toEqual(1);

    expect(store.clearOnRow(20)).toEqual(false);
    expect(store.delete).not.toHaveBeenCalled();

    expect(store.clearOnRow(5)).toEqual(true);
    expect(store.delete).toHaveBeenCalledWith(1);
  });
});
