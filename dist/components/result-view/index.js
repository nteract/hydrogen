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
        utils_1.reactFactory(react_1.default.createElement(mathjax_1.Provider, { src: mathjax_electron_1.mathJaxPath },
            react_1.default.createElement(result_view_1.default, { store: this.outputStore, kernel: kernel, destroy: this.destroy, showResult: showResult })), element, null, this.disposer);
    }
}
exports.default = ResultView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy9yZXN1bHQtdmlldy9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFBc0U7QUFDdEUsa0RBQTBCO0FBQzFCLDhDQUE0QztBQUM1Qyx1REFBK0M7QUFDL0MsdUNBQTJDO0FBQzNDLGdFQUE2QztBQUM3QyxnRUFBZ0Q7QUFHaEQsTUFBcUIsVUFBVTtJQWU3QixZQUNFLFdBQXdCLEVBQ3hCLE1BQWlDLEVBQ2pDLE1BQWtCLEVBQ2xCLEdBQVcsRUFDWCxhQUFzQixJQUFJO1FBaEI1QixZQUFPLEdBQUcsR0FBRyxFQUFFO1lBQ2IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRXBELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtnQkFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUN4QjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixDQUFDLENBQUM7UUFTQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUMxQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ3ZELFVBQVUsRUFBRSxPQUFPO1NBQ3BCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxnQkFBVyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUM7WUFDOUIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3ZFLElBQUk7WUFDUCxVQUFVLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixFQUFFO1lBQzFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUN0QyxTQUFTLEVBQUUsTUFBTSxDQUFDLG1CQUFtQixFQUFFO1NBQ3hDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxJQUFJLEVBQUUsT0FBTztZQUNiLElBQUksRUFBRSxPQUFPO1lBQ2IsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtnQkFDbEIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDO29CQUM5QixVQUFVLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FDdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUNyQyxDQUFDLElBQUk7b0JBQ04sVUFBVSxFQUFFLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRTtvQkFDMUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO29CQUN0QyxTQUFTLEVBQUUsTUFBTSxDQUFDLG1CQUFtQixFQUFFO2lCQUN4QyxDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixvQkFBWSxDQUNWLDhCQUFDLGtCQUFRLElBQUMsR0FBRyxFQUFFLDhCQUFXO1lBQ3hCLDhCQUFDLHFCQUFtQixJQUNsQixLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFDdkIsTUFBTSxFQUFFLE1BQU0sRUFDZCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFDckIsVUFBVSxFQUFFLFVBQVUsR0FDdEIsQ0FDTyxFQUNYLE9BQU8sRUFDUCxJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdkVELDZCQXVFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIFRleHRFZGl0b3IsIERpc3BsYXlNYXJrZXIgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tIFwiQG50ZXJhY3QvbWF0aGpheFwiO1xuaW1wb3J0IHsgbWF0aEpheFBhdGggfSBmcm9tIFwibWF0aGpheC1lbGVjdHJvblwiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5IH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XG5pbXBvcnQgT3V0cHV0U3RvcmUgZnJvbSBcIi4uLy4uL3N0b3JlL291dHB1dFwiO1xuaW1wb3J0IFJlc3VsdFZpZXdDb21wb25lbnQgZnJvbSBcIi4vcmVzdWx0LXZpZXdcIjtcbmltcG9ydCB0eXBlIE1hcmtlclN0b3JlIGZyb20gXCIuLi8uLi9zdG9yZS9tYXJrZXJzXCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4uLy4uL2tlcm5lbFwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVzdWx0VmlldyB7XG4gIGRpc3Bvc2VyOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBtYXJrZXI6IERpc3BsYXlNYXJrZXI7XG4gIG91dHB1dFN0b3JlOiBPdXRwdXRTdG9yZTtcbiAgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICBpZiAoZWRpdG9yICE9IG51bGwpIHtcbiAgICAgIGVkaXRvci5lbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5tYXJrZXIuZGVzdHJveSgpO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG1hcmtlclN0b3JlOiBNYXJrZXJTdG9yZSxcbiAgICBrZXJuZWw6IEtlcm5lbCB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHJvdzogbnVtYmVyLFxuICAgIHNob3dSZXN1bHQ6IGJvb2xlYW4gPSB0cnVlXG4gICkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImh5ZHJvZ2VuXCIsIFwibWFya2VyXCIpO1xuICAgIHRoaXMuZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIG1hcmtlclN0b3JlLmNsZWFyT25Sb3cocm93KTtcbiAgICB0aGlzLm1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24oW3JvdywgSW5maW5pdHldLCB7XG4gICAgICBpbnZhbGlkYXRlOiBcInRvdWNoXCIsXG4gICAgfSk7XG4gICAgdGhpcy5vdXRwdXRTdG9yZSA9IG5ldyBPdXRwdXRTdG9yZSgpO1xuICAgIHRoaXMub3V0cHV0U3RvcmUudXBkYXRlUG9zaXRpb24oe1xuICAgICAgbGluZUxlbmd0aDogZWRpdG9yLmVsZW1lbnQucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtyb3csIEluZmluaXR5XSlcbiAgICAgICAgLmxlZnQsXG4gICAgICBsaW5lSGVpZ2h0OiBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCksXG4gICAgICBlZGl0b3JXaWR0aDogZWRpdG9yLmVsZW1lbnQuZ2V0V2lkdGgoKSxcbiAgICAgIGNoYXJXaWR0aDogZWRpdG9yLmdldERlZmF1bHRDaGFyV2lkdGgoKSxcbiAgICB9KTtcbiAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5tYXJrZXIsIHtcbiAgICAgIHR5cGU6IFwiYmxvY2tcIixcbiAgICAgIGl0ZW06IGVsZW1lbnQsXG4gICAgICBwb3NpdGlvbjogXCJhZnRlclwiLFxuICAgIH0pO1xuICAgIHRoaXMubWFya2VyLm9uRGlkQ2hhbmdlKChldmVudCkgPT4ge1xuICAgICAgaWYgKCFldmVudC5pc1ZhbGlkKSB7XG4gICAgICAgIG1hcmtlclN0b3JlLmRlbGV0ZSh0aGlzLm1hcmtlci5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm91dHB1dFN0b3JlLnVwZGF0ZVBvc2l0aW9uKHtcbiAgICAgICAgICBsaW5lTGVuZ3RoOiBlZGl0b3IuZWxlbWVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oXG4gICAgICAgICAgICB0aGlzLm1hcmtlci5nZXRTdGFydEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgICApLmxlZnQsXG4gICAgICAgICAgbGluZUhlaWdodDogZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpLFxuICAgICAgICAgIGVkaXRvcldpZHRoOiBlZGl0b3IuZWxlbWVudC5nZXRXaWR0aCgpLFxuICAgICAgICAgIGNoYXJXaWR0aDogZWRpdG9yLmdldERlZmF1bHRDaGFyV2lkdGgoKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbWFya2VyU3RvcmUubmV3KHRoaXMpO1xuICAgIHJlYWN0RmFjdG9yeShcbiAgICAgIDxQcm92aWRlciBzcmM9e21hdGhKYXhQYXRofT5cbiAgICAgICAgPFJlc3VsdFZpZXdDb21wb25lbnRcbiAgICAgICAgICBzdG9yZT17dGhpcy5vdXRwdXRTdG9yZX1cbiAgICAgICAgICBrZXJuZWw9e2tlcm5lbH1cbiAgICAgICAgICBkZXN0cm95PXt0aGlzLmRlc3Ryb3l9XG4gICAgICAgICAgc2hvd1Jlc3VsdD17c2hvd1Jlc3VsdH1cbiAgICAgICAgLz5cbiAgICAgIDwvUHJvdmlkZXI+LFxuICAgICAgZWxlbWVudCxcbiAgICAgIG51bGwsXG4gICAgICB0aGlzLmRpc3Bvc2VyXG4gICAgKTtcbiAgfVxufVxuIl19