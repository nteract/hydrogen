"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const mathjax_1 = require("@nteract/mathjax");
const mathjax_electron_1 = require("mathjax-electron");
const utils_1 = require("../../utils");
const output_1 = __importDefault(require("../../store/output"));
const result_view_1 = __importDefault(require("./result-view"));
class ResultView {
    constructor(markerStore, kernel, editor, row, showResult = true) {
        this.destroy = () => {
            const editor = atom.workspace.getActiveTextEditor();
            if (editor != null) {
                editor.element.focus();
            }
            this.disposer.dispose();
            this.marker.destroy();
        };
        const element = document.createElement("div");
        element.classList.add("hydrogen", "marker");
        this.disposer = new atom_1.CompositeDisposable();
        markerStore.clearOnRow(row);
        this.marker = editor.markBufferPosition([row, Infinity], {
            invalidate: "touch",
        });
        this.outputStore = new output_1.default();
        this.outputStore.updatePosition({
            lineLength: editor.element.pixelPositionForBufferPosition([row, Infinity])
                .left,
            lineHeight: editor.getLineHeightInPixels(),
            editorWidth: editor.element.getWidth(),
            charWidth: editor.getDefaultCharWidth(),
        });
        editor.decorateMarker(this.marker, {
            type: "block",
            item: element,
            position: "after",
        });
        this.marker.onDidChange((event) => {
            if (!event.isValid) {
                markerStore.delete(this.marker.id);
            }
            else {
                this.outputStore.updatePosition({
                    lineLength: editor.element.pixelPositionForBufferPosition(this.marker.getStartBufferPosition()).left,
                    lineHeight: editor.getLineHeightInPixels(),
                    editorWidth: editor.element.getWidth(),
                    charWidth: editor.getDefaultCharWidth(),
                });
            }
        });
        markerStore.new(this);
        (0, utils_1.reactFactory)(react_1.default.createElement(mathjax_1.Provider, { src: mathjax_electron_1.mathJaxPath },
            react_1.default.createElement(result_view_1.default, { store: this.outputStore, kernel: kernel, destroy: this.destroy, showResult: showResult })), element, null, this.disposer);
    }
}
exports.default = ResultView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy9yZXN1bHQtdmlldy9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFBc0U7QUFDdEUsa0RBQTBCO0FBQzFCLDhDQUE0QztBQUM1Qyx1REFBK0M7QUFDL0MsdUNBQTJDO0FBQzNDLGdFQUE2QztBQUM3QyxnRUFBZ0Q7QUFHaEQsTUFBcUIsVUFBVTtJQWU3QixZQUNFLFdBQXdCLEVBQ3hCLE1BQWlDLEVBQ2pDLE1BQWtCLEVBQ2xCLEdBQVcsRUFDWCxhQUFzQixJQUFJO1FBaEI1QixZQUFPLEdBQUcsR0FBRyxFQUFFO1lBQ2IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRXBELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtnQkFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUN4QjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixDQUFDLENBQUM7UUFTQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUMxQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ3ZELFVBQVUsRUFBRSxPQUFPO1NBQ3BCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxnQkFBVyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUM7WUFDOUIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3ZFLElBQUk7WUFDUCxVQUFVLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixFQUFFO1lBQzFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUN0QyxTQUFTLEVBQUUsTUFBTSxDQUFDLG1CQUFtQixFQUFFO1NBQ3hDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxJQUFJLEVBQUUsT0FBTztZQUNiLElBQUksRUFBRSxPQUFPO1lBQ2IsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtnQkFDbEIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDO29CQUM5QixVQUFVLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FDdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUNyQyxDQUFDLElBQUk7b0JBQ04sVUFBVSxFQUFFLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRTtvQkFDMUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO29CQUN0QyxTQUFTLEVBQUUsTUFBTSxDQUFDLG1CQUFtQixFQUFFO2lCQUN4QyxDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixJQUFBLG9CQUFZLEVBQ1YsOEJBQUMsa0JBQVEsSUFBQyxHQUFHLEVBQUUsOEJBQVc7WUFDeEIsOEJBQUMscUJBQW1CLElBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxFQUN2QixNQUFNLEVBQUUsTUFBTSxFQUNkLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUNyQixVQUFVLEVBQUUsVUFBVSxHQUN0QixDQUNPLEVBQ1gsT0FBTyxFQUNQLElBQUksRUFDSixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF2RUQsNkJBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgVGV4dEVkaXRvciwgRGlzcGxheU1hcmtlciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gXCJAbnRlcmFjdC9tYXRoamF4XCI7XG5pbXBvcnQgeyBtYXRoSmF4UGF0aCB9IGZyb20gXCJtYXRoamF4LWVsZWN0cm9uXCI7XG5pbXBvcnQgeyByZWFjdEZhY3RvcnkgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcbmltcG9ydCBPdXRwdXRTdG9yZSBmcm9tIFwiLi4vLi4vc3RvcmUvb3V0cHV0XCI7XG5pbXBvcnQgUmVzdWx0Vmlld0NvbXBvbmVudCBmcm9tIFwiLi9yZXN1bHQtdmlld1wiO1xuaW1wb3J0IHR5cGUgTWFya2VyU3RvcmUgZnJvbSBcIi4uLy4uL3N0b3JlL21hcmtlcnNcIjtcbmltcG9ydCB0eXBlIEtlcm5lbCBmcm9tIFwiLi4vLi4va2VybmVsXCI7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXN1bHRWaWV3IHtcbiAgZGlzcG9zZXI6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gIG1hcmtlcjogRGlzcGxheU1hcmtlcjtcbiAgb3V0cHV0U3RvcmU6IE91dHB1dFN0b3JlO1xuICBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcblxuICAgIGlmIChlZGl0b3IgIT0gbnVsbCkge1xuICAgICAgZWRpdG9yLmVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLm1hcmtlci5kZXN0cm95KCk7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbWFya2VyU3RvcmU6IE1hcmtlclN0b3JlLFxuICAgIGtlcm5lbDogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcm93OiBudW1iZXIsXG4gICAgc2hvd1Jlc3VsdDogYm9vbGVhbiA9IHRydWVcbiAgKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaHlkcm9nZW5cIiwgXCJtYXJrZXJcIik7XG4gICAgdGhpcy5kaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgbWFya2VyU3RvcmUuY2xlYXJPblJvdyhyb3cpO1xuICAgIHRoaXMubWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihbcm93LCBJbmZpbml0eV0sIHtcbiAgICAgIGludmFsaWRhdGU6IFwidG91Y2hcIixcbiAgICB9KTtcbiAgICB0aGlzLm91dHB1dFN0b3JlID0gbmV3IE91dHB1dFN0b3JlKCk7XG4gICAgdGhpcy5vdXRwdXRTdG9yZS51cGRhdGVQb3NpdGlvbih7XG4gICAgICBsaW5lTGVuZ3RoOiBlZGl0b3IuZWxlbWVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgSW5maW5pdHldKVxuICAgICAgICAubGVmdCxcbiAgICAgIGxpbmVIZWlnaHQ6IGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSxcbiAgICAgIGVkaXRvcldpZHRoOiBlZGl0b3IuZWxlbWVudC5nZXRXaWR0aCgpLFxuICAgICAgY2hhcldpZHRoOiBlZGl0b3IuZ2V0RGVmYXVsdENoYXJXaWR0aCgpLFxuICAgIH0pO1xuICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLm1hcmtlciwge1xuICAgICAgdHlwZTogXCJibG9ja1wiLFxuICAgICAgaXRlbTogZWxlbWVudCxcbiAgICAgIHBvc2l0aW9uOiBcImFmdGVyXCIsXG4gICAgfSk7XG4gICAgdGhpcy5tYXJrZXIub25EaWRDaGFuZ2UoKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWV2ZW50LmlzVmFsaWQpIHtcbiAgICAgICAgbWFya2VyU3RvcmUuZGVsZXRlKHRoaXMubWFya2VyLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub3V0cHV0U3RvcmUudXBkYXRlUG9zaXRpb24oe1xuICAgICAgICAgIGxpbmVMZW5ndGg6IGVkaXRvci5lbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICAgICkubGVmdCxcbiAgICAgICAgICBsaW5lSGVpZ2h0OiBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCksXG4gICAgICAgICAgZWRpdG9yV2lkdGg6IGVkaXRvci5lbGVtZW50LmdldFdpZHRoKCksXG4gICAgICAgICAgY2hhcldpZHRoOiBlZGl0b3IuZ2V0RGVmYXVsdENoYXJXaWR0aCgpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtYXJrZXJTdG9yZS5uZXcodGhpcyk7XG4gICAgcmVhY3RGYWN0b3J5KFxuICAgICAgPFByb3ZpZGVyIHNyYz17bWF0aEpheFBhdGh9PlxuICAgICAgICA8UmVzdWx0Vmlld0NvbXBvbmVudFxuICAgICAgICAgIHN0b3JlPXt0aGlzLm91dHB1dFN0b3JlfVxuICAgICAgICAgIGtlcm5lbD17a2VybmVsfVxuICAgICAgICAgIGRlc3Ryb3k9e3RoaXMuZGVzdHJveX1cbiAgICAgICAgICBzaG93UmVzdWx0PXtzaG93UmVzdWx0fVxuICAgICAgICAvPlxuICAgICAgPC9Qcm92aWRlcj4sXG4gICAgICBlbGVtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIHRoaXMuZGlzcG9zZXJcbiAgICApO1xuICB9XG59XG4iXX0=