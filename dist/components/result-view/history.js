"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importStar(require("react"));
const mobx_react_1 = require("mobx-react");
const display_1 = __importDefault(require("./display"));
function RangeSlider({ outputStore }) {
    const { index: storeIndex, setIndex: setStoreIndex, incrementIndex, decrementIndex, outputs, } = outputStore;
    const sliderRef = react_1.useRef();
    react_1.useEffect(() => {
        const disposer = new atom_1.CompositeDisposable();
        disposer.add(atom.commands.add(sliderRef.current, "core:move-left", () => decrementIndex()), atom.commands.add(sliderRef.current, "core:move-right", () => incrementIndex()));
        return () => disposer.dispose();
    }, []);
    function onIndexChange(e) {
        const newIndex = Number(e.target.value);
        setStoreIndex(newIndex);
    }
    return (react_1.default.createElement("div", { className: "slider", ref: sliderRef },
        react_1.default.createElement("div", { className: "current-output" },
            react_1.default.createElement("span", { className: "btn btn-xs icon icon-chevron-left", onClick: (e) => decrementIndex() }),
            react_1.default.createElement("span", null,
                storeIndex + 1,
                "/",
                outputs.length),
            react_1.default.createElement("span", { className: "btn btn-xs icon icon-chevron-right", onClick: (e) => incrementIndex() })),
        react_1.default.createElement("input", { className: "input-range", max: outputs.length - 1, min: "0", id: "range-input", onChange: onIndexChange, type: "range", value: storeIndex })));
}
const History = mobx_react_1.observer(({ store }) => {
    const output = store.outputs[store.index];
    return output ? (react_1.default.createElement("div", { className: "history output-area" },
        react_1.default.createElement(RangeSlider, { outputStore: store }),
        react_1.default.createElement("div", { className: "multiline-container native-key-bindings", tabIndex: -1, style: {
                fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
            }, "hydrogen-wrapoutput": atom.config.get(`Hydrogen.wrapOutput`).toString() },
            react_1.default.createElement(display_1.default, { output: output })))) : null;
});
exports.default = History;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2hpc3RvcnkudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUEyQztBQUMzQywrQ0FBaUQ7QUFDakQsMkNBQXNDO0FBQ3RDLHdEQUFnQztBQUdoQyxTQUFTLFdBQVcsQ0FBQyxFQUFFLFdBQVcsRUFBRTtJQUNsQyxNQUFNLEVBQ0osS0FBSyxFQUFFLFVBQVUsRUFDakIsUUFBUSxFQUFFLGFBQWEsRUFDdkIsY0FBYyxFQUNkLGNBQWMsRUFDZCxPQUFPLEdBQ1IsR0FBRyxXQUFXLENBQUM7SUFDaEIsTUFBTSxTQUFTLEdBRVgsY0FBTSxFQUFFLENBQUM7SUFDYixpQkFBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLE1BQU0sUUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUMzQyxRQUFRLENBQUMsR0FBRyxDQUVWLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQzFELGNBQWMsRUFBRSxDQUNqQixFQUNELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQzNELGNBQWMsRUFBRSxDQUNqQixDQUNGLENBQUM7UUFDRixPQUFPLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFUCxTQUFTLGFBQWEsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRUQsT0FBTyxDQUNMLHVDQUFLLFNBQVMsRUFBQyxRQUFRLEVBQUMsR0FBRyxFQUFFLFNBQVM7UUFDcEMsdUNBQUssU0FBUyxFQUFDLGdCQUFnQjtZQUM3Qix3Q0FDRSxTQUFTLEVBQUMsbUNBQW1DLEVBQzdDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLEdBQ2hDO1lBQ0Y7Z0JBQ0csVUFBVSxHQUFHLENBQUM7O2dCQUFHLE9BQU8sQ0FBQyxNQUFNLENBQzNCO1lBQ1Asd0NBQ0UsU0FBUyxFQUFDLG9DQUFvQyxFQUM5QyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxHQUNoQyxDQUNFO1FBQ04seUNBQ0UsU0FBUyxFQUFDLGFBQWEsRUFDdkIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN2QixHQUFHLEVBQUMsR0FBRyxFQUNQLEVBQUUsRUFBQyxhQUFhLEVBQ2hCLFFBQVEsRUFBRSxhQUFhLEVBQ3ZCLElBQUksRUFBQyxPQUFPLEVBQ1osS0FBSyxFQUFFLFVBQVUsR0FDakIsQ0FDRSxDQUNQLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxPQUFPLEdBQUcscUJBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUEwQixFQUFFLEVBQUU7SUFDN0QsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQ2QsdUNBQUssU0FBUyxFQUFDLHFCQUFxQjtRQUNsQyw4QkFBQyxXQUFXLElBQUMsV0FBVyxFQUFFLEtBQUssR0FBSTtRQUNuQyx1Q0FDRSxTQUFTLEVBQUMseUNBQXlDLEVBQ25ELFFBQVEsRUFBRSxDQUFDLENBQUMsRUFDWixLQUFLLEVBQUU7Z0JBQ0wsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksU0FBUzthQUN0RSx5QkFDb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFFdEUsOEJBQUMsaUJBQU8sSUFBQyxNQUFNLEVBQUUsTUFBTSxHQUFJLENBQ3ZCLENBQ0YsQ0FDUCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQztBQUNILGtCQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgRGlzcGxheSBmcm9tIFwiLi9kaXNwbGF5XCI7XG5pbXBvcnQgdHlwZSBPdXRwdXRTdG9yZSBmcm9tIFwiLi4vLi4vc3RvcmUvb3V0cHV0XCI7XG5cbmZ1bmN0aW9uIFJhbmdlU2xpZGVyKHsgb3V0cHV0U3RvcmUgfSkge1xuICBjb25zdCB7XG4gICAgaW5kZXg6IHN0b3JlSW5kZXgsXG4gICAgc2V0SW5kZXg6IHNldFN0b3JlSW5kZXgsXG4gICAgaW5jcmVtZW50SW5kZXgsXG4gICAgZGVjcmVtZW50SW5kZXgsXG4gICAgb3V0cHV0cyxcbiAgfSA9IG91dHB1dFN0b3JlO1xuICBjb25zdCBzbGlkZXJSZWY6IHtcbiAgICBjdXJyZW50OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH0gPSB1c2VSZWYoKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBkaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgZGlzcG9zZXIuYWRkKFxuICAgICAgLy8gJEZsb3dGaXhNZVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoc2xpZGVyUmVmLmN1cnJlbnQsIFwiY29yZTptb3ZlLWxlZnRcIiwgKCkgPT5cbiAgICAgICAgZGVjcmVtZW50SW5kZXgoKVxuICAgICAgKSwgLy8gJEZsb3dGaXhNZVxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoc2xpZGVyUmVmLmN1cnJlbnQsIFwiY29yZTptb3ZlLXJpZ2h0XCIsICgpID0+XG4gICAgICAgIGluY3JlbWVudEluZGV4KClcbiAgICAgIClcbiAgICApO1xuICAgIHJldHVybiAoKSA9PiBkaXNwb3Nlci5kaXNwb3NlKCk7XG4gIH0sIFtdKTtcblxuICBmdW5jdGlvbiBvbkluZGV4Q2hhbmdlKGUpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IE51bWJlcihlLnRhcmdldC52YWx1ZSk7XG4gICAgc2V0U3RvcmVJbmRleChuZXdJbmRleCk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic2xpZGVyXCIgcmVmPXtzbGlkZXJSZWZ9PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjdXJyZW50LW91dHB1dFwiPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4teHMgaWNvbiBpY29uLWNoZXZyb24tbGVmdFwiXG4gICAgICAgICAgb25DbGljaz17KGUpID0+IGRlY3JlbWVudEluZGV4KCl9XG4gICAgICAgIC8+XG4gICAgICAgIDxzcGFuPlxuICAgICAgICAgIHtzdG9yZUluZGV4ICsgMX0ve291dHB1dHMubGVuZ3RofVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBpY29uIGljb24tY2hldnJvbi1yaWdodFwiXG4gICAgICAgICAgb25DbGljaz17KGUpID0+IGluY3JlbWVudEluZGV4KCl9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxpbnB1dFxuICAgICAgICBjbGFzc05hbWU9XCJpbnB1dC1yYW5nZVwiXG4gICAgICAgIG1heD17b3V0cHV0cy5sZW5ndGggLSAxfVxuICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgaWQ9XCJyYW5nZS1pbnB1dFwiXG4gICAgICAgIG9uQ2hhbmdlPXtvbkluZGV4Q2hhbmdlfVxuICAgICAgICB0eXBlPVwicmFuZ2VcIlxuICAgICAgICB2YWx1ZT17c3RvcmVJbmRleH1cbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmNvbnN0IEhpc3RvcnkgPSBvYnNlcnZlcigoeyBzdG9yZSB9OiB7IHN0b3JlOiBPdXRwdXRTdG9yZSB9KSA9PiB7XG4gIGNvbnN0IG91dHB1dCA9IHN0b3JlLm91dHB1dHNbc3RvcmUuaW5kZXhdO1xuICByZXR1cm4gb3V0cHV0ID8gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlzdG9yeSBvdXRwdXQtYXJlYVwiPlxuICAgICAgPFJhbmdlU2xpZGVyIG91dHB1dFN0b3JlPXtzdG9yZX0gLz5cbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3NOYW1lPVwibXVsdGlsaW5lLWNvbnRhaW5lciBuYXRpdmUta2V5LWJpbmRpbmdzXCJcbiAgICAgICAgdGFiSW5kZXg9ey0xfVxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIGZvbnRTaXplOiBhdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLm91dHB1dEFyZWFGb250U2l6ZWApIHx8IFwiaW5oZXJpdFwiLFxuICAgICAgICB9fVxuICAgICAgICBoeWRyb2dlbi13cmFwb3V0cHV0PXthdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLndyYXBPdXRwdXRgKS50b1N0cmluZygpfVxuICAgICAgPlxuICAgICAgICA8RGlzcGxheSBvdXRwdXQ9e291dHB1dH0gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApIDogbnVsbDtcbn0pO1xuZXhwb3J0IGRlZmF1bHQgSGlzdG9yeTtcbiJdfQ==