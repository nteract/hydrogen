"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    const sliderRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
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
const History = (0, mobx_react_1.observer)(({ store }) => {
    const output = store.outputs[store.index];
    return output ? (react_1.default.createElement("div", { className: "history output-area" },
        react_1.default.createElement(RangeSlider, { outputStore: store }),
        react_1.default.createElement("div", { className: "multiline-container native-key-bindings", tabIndex: -1, style: {
                fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
            }, "hydrogen-wrapoutput": atom.config.get(`Hydrogen.wrapOutput`).toString() },
            react_1.default.createElement(display_1.default, { output: output })))) : null;
});
exports.default = History;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2hpc3RvcnkudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsK0NBQWlEO0FBQ2pELDJDQUFzQztBQUN0Qyx3REFBZ0M7QUFHaEMsU0FBUyxXQUFXLENBQUMsRUFBRSxXQUFXLEVBQUU7SUFDbEMsTUFBTSxFQUNKLEtBQUssRUFBRSxVQUFVLEVBQ2pCLFFBQVEsRUFBRSxhQUFhLEVBQ3ZCLGNBQWMsRUFDZCxjQUFjLEVBQ2QsT0FBTyxHQUNSLEdBQUcsV0FBVyxDQUFDO0lBQ2hCLE1BQU0sU0FBUyxHQUVYLElBQUEsY0FBTSxHQUFFLENBQUM7SUFDYixJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBTSxRQUFRLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzNDLFFBQVEsQ0FBQyxHQUFHLENBRVYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FDMUQsY0FBYyxFQUFFLENBQ2pCLEVBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FDM0QsY0FBYyxFQUFFLENBQ2pCLENBQ0YsQ0FBQztRQUNGLE9BQU8sR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVQLFNBQVMsYUFBYSxDQUFDLENBQUM7UUFDdEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxPQUFPLENBQ0wsdUNBQUssU0FBUyxFQUFDLFFBQVEsRUFBQyxHQUFHLEVBQUUsU0FBUztRQUNwQyx1Q0FBSyxTQUFTLEVBQUMsZ0JBQWdCO1lBQzdCLHdDQUNFLFNBQVMsRUFBQyxtQ0FBbUMsRUFDN0MsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxjQUFjLEVBQUUsR0FDaEM7WUFDRjtnQkFDRyxVQUFVLEdBQUcsQ0FBQzs7Z0JBQUcsT0FBTyxDQUFDLE1BQU0sQ0FDM0I7WUFDUCx3Q0FDRSxTQUFTLEVBQUMsb0NBQW9DLEVBQzlDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLEdBQ2hDLENBQ0U7UUFDTix5Q0FDRSxTQUFTLEVBQUMsYUFBYSxFQUN2QixHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3ZCLEdBQUcsRUFBQyxHQUFHLEVBQ1AsRUFBRSxFQUFDLGFBQWEsRUFDaEIsUUFBUSxFQUFFLGFBQWEsRUFDdkIsSUFBSSxFQUFDLE9BQU8sRUFDWixLQUFLLEVBQUUsVUFBVSxHQUNqQixDQUNFLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHFCQUFRLEVBQUMsQ0FBQyxFQUFFLEtBQUssRUFBMEIsRUFBRSxFQUFFO0lBQzdELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUNkLHVDQUFLLFNBQVMsRUFBQyxxQkFBcUI7UUFDbEMsOEJBQUMsV0FBVyxJQUFDLFdBQVcsRUFBRSxLQUFLLEdBQUk7UUFDbkMsdUNBQ0UsU0FBUyxFQUFDLHlDQUF5QyxFQUNuRCxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQ1osS0FBSyxFQUFFO2dCQUNMLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLFNBQVM7YUFDdEUseUJBQ29CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUMsUUFBUSxFQUFFO1lBRXRFLDhCQUFDLGlCQUFPLElBQUMsTUFBTSxFQUFFLE1BQU0sR0FBSSxDQUN2QixDQUNGLENBQ1AsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDSCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgb2JzZXJ2ZXIgfSBmcm9tIFwibW9ieC1yZWFjdFwiO1xuaW1wb3J0IERpc3BsYXkgZnJvbSBcIi4vZGlzcGxheVwiO1xuaW1wb3J0IHR5cGUgT3V0cHV0U3RvcmUgZnJvbSBcIi4uLy4uL3N0b3JlL291dHB1dFwiO1xuXG5mdW5jdGlvbiBSYW5nZVNsaWRlcih7IG91dHB1dFN0b3JlIH0pIHtcbiAgY29uc3Qge1xuICAgIGluZGV4OiBzdG9yZUluZGV4LFxuICAgIHNldEluZGV4OiBzZXRTdG9yZUluZGV4LFxuICAgIGluY3JlbWVudEluZGV4LFxuICAgIGRlY3JlbWVudEluZGV4LFxuICAgIG91dHB1dHMsXG4gIH0gPSBvdXRwdXRTdG9yZTtcbiAgY29uc3Qgc2xpZGVyUmVmOiB7XG4gICAgY3VycmVudDogSFRNTERpdkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICB9ID0gdXNlUmVmKCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGRpc3Bvc2VyLmFkZChcbiAgICAgIC8vICRGbG93Rml4TWVcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKHNsaWRlclJlZi5jdXJyZW50LCBcImNvcmU6bW92ZS1sZWZ0XCIsICgpID0+XG4gICAgICAgIGRlY3JlbWVudEluZGV4KClcbiAgICAgICksIC8vICRGbG93Rml4TWVcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKHNsaWRlclJlZi5jdXJyZW50LCBcImNvcmU6bW92ZS1yaWdodFwiLCAoKSA9PlxuICAgICAgICBpbmNyZW1lbnRJbmRleCgpXG4gICAgICApXG4gICAgKTtcbiAgICByZXR1cm4gKCkgPT4gZGlzcG9zZXIuZGlzcG9zZSgpO1xuICB9LCBbXSk7XG5cbiAgZnVuY3Rpb24gb25JbmRleENoYW5nZShlKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBOdW1iZXIoZS50YXJnZXQudmFsdWUpO1xuICAgIHNldFN0b3JlSW5kZXgobmV3SW5kZXgpO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNsaWRlclwiIHJlZj17c2xpZGVyUmVmfT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY3VycmVudC1vdXRwdXRcIj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBjbGFzc05hbWU9XCJidG4gYnRuLXhzIGljb24gaWNvbi1jaGV2cm9uLWxlZnRcIlxuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBkZWNyZW1lbnRJbmRleCgpfVxuICAgICAgICAvPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICB7c3RvcmVJbmRleCArIDF9L3tvdXRwdXRzLmxlbmd0aH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4teHMgaWNvbiBpY29uLWNoZXZyb24tcmlnaHRcIlxuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBpbmNyZW1lbnRJbmRleCgpfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8aW5wdXRcbiAgICAgICAgY2xhc3NOYW1lPVwiaW5wdXQtcmFuZ2VcIlxuICAgICAgICBtYXg9e291dHB1dHMubGVuZ3RoIC0gMX1cbiAgICAgICAgbWluPVwiMFwiXG4gICAgICAgIGlkPVwicmFuZ2UtaW5wdXRcIlxuICAgICAgICBvbkNoYW5nZT17b25JbmRleENoYW5nZX1cbiAgICAgICAgdHlwZT1cInJhbmdlXCJcbiAgICAgICAgdmFsdWU9e3N0b3JlSW5kZXh9XG4gICAgICAvPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5jb25zdCBIaXN0b3J5ID0gb2JzZXJ2ZXIoKHsgc3RvcmUgfTogeyBzdG9yZTogT3V0cHV0U3RvcmUgfSkgPT4ge1xuICBjb25zdCBvdXRwdXQgPSBzdG9yZS5vdXRwdXRzW3N0b3JlLmluZGV4XTtcbiAgcmV0dXJuIG91dHB1dCA/IChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImhpc3Rvcnkgb3V0cHV0LWFyZWFcIj5cbiAgICAgIDxSYW5nZVNsaWRlciBvdXRwdXRTdG9yZT17c3RvcmV9IC8+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzTmFtZT1cIm11bHRpbGluZS1jb250YWluZXIgbmF0aXZlLWtleS1iaW5kaW5nc1wiXG4gICAgICAgIHRhYkluZGV4PXstMX1cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBmb250U2l6ZTogYXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi5vdXRwdXRBcmVhRm9udFNpemVgKSB8fCBcImluaGVyaXRcIixcbiAgICAgICAgfX1cbiAgICAgICAgaHlkcm9nZW4td3JhcG91dHB1dD17YXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi53cmFwT3V0cHV0YCkudG9TdHJpbmcoKX1cbiAgICAgID5cbiAgICAgICAgPERpc3BsYXkgb3V0cHV0PXtvdXRwdXR9IC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKSA6IG51bGw7XG59KTtcbmV4cG9ydCBkZWZhdWx0IEhpc3Rvcnk7XG4iXX0=