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
exports.PlotlyTransform = void 0;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const React = __importStar(require("react"));
class PlotlyTransform extends React.Component {
    constructor(props) {
        super(props);
        this.plotDivRef = (plotDiv) => {
            this.plotDiv = plotDiv;
        };
        this.getFigure = () => {
            const figure = this.props.data;
            if (typeof figure === "string") {
                return JSON.parse(figure);
            }
            if (Object.isFrozen(figure)) {
                return cloneDeep_1.default(figure);
            }
            const { data = {}, layout = {} } = figure;
            return {
                data,
                layout,
            };
        };
        this.downloadImage = (gd) => {
            this.Plotly.toImage(gd).then(function (dataUrl) {
                const electron = require("electron");
                electron.remote.getCurrentWebContents().downloadURL(dataUrl);
            });
        };
        this.downloadImage = this.downloadImage.bind(this);
    }
    componentDidMount() {
        const figure = this.getFigure();
        this.Plotly = require("@nteract/plotly");
        this.Plotly.newPlot(this.plotDiv, figure.data, figure.layout, {
            modeBarButtonsToRemove: ["toImage"],
            modeBarButtonsToAdd: [
                {
                    name: "Download plot as a png",
                    icon: this.Plotly.Icons.camera,
                    click: this.downloadImage,
                },
            ],
        });
    }
    shouldComponentUpdate(nextProps) {
        return this.props.data !== nextProps.data;
    }
    componentDidUpdate() {
        const figure = this.getFigure();
        if (!this.plotDiv) {
            return;
        }
        const plotDiv = this.plotDiv;
        plotDiv.data = figure.data;
        plotDiv.layout = figure.layout;
        this.Plotly.redraw(plotDiv);
    }
    render() {
        const { layout } = this.getFigure();
        const style = {};
        if (layout && layout.height && !layout.autosize) {
            style.height = layout.height;
        }
        return React.createElement("div", { ref: this.plotDivRef, style: style });
    }
}
exports.PlotlyTransform = PlotlyTransform;
PlotlyTransform.defaultProps = {
    data: "",
    mediaType: "application/vnd.plotly.v1+json",
};
exports.default = PlotlyTransform;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxvdGx5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvcGxvdGx5LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV0EsaUVBQXlDO0FBQ3pDLDZDQUErQjtBQXNCL0IsTUFBYSxlQUFnQixTQUFRLEtBQUssQ0FBQyxTQUFnQjtJQWdCekQsWUFBWSxLQUFZO1FBQ3RCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQXFDZixlQUFVLEdBQUcsQ0FBQyxPQUE4QixFQUFRLEVBQUU7WUFDcEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDekIsQ0FBQyxDQUFDO1FBQ0YsY0FBUyxHQUFHLEdBQVcsRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztZQUUvQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO1lBSUQsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMzQixPQUFPLG1CQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDMUI7WUFFRCxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBQzFDLE9BQU87Z0JBQ0wsSUFBSTtnQkFDSixNQUFNO2FBQ1AsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLGtCQUFhLEdBQUcsQ0FBQyxFQUFPLEVBQUUsRUFBRTtZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxPQUFPO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUE4QixDQUFDO2dCQUVsRSxRQUFRLENBQUMsTUFBTSxDQUFDLHFCQUFxQixFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBaEVBLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELGlCQUFpQjtRQUVmLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQzVELHNCQUFzQixFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ25DLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxJQUFJLEVBQUUsd0JBQXdCO29CQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTTtvQkFDOUIsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhO2lCQUMxQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHFCQUFxQixDQUFDLFNBQWdCO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQztJQUM1QyxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxNQUFNLE9BQU8sR0FBc0IsSUFBSSxDQUFDLE9BQWMsQ0FBQztRQUN2RCxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDM0IsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFnQ0QsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsTUFBTSxLQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUV0QyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUMvQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDOUI7UUFFRCxPQUFPLDZCQUFLLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FBQztJQUNyRCxDQUFDOztBQTdGSCwwQ0E4RkM7QUE3RlEsNEJBQVksR0FBRztJQUNwQixJQUFJLEVBQUUsRUFBRTtJQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7Q0FDNUMsQ0FBQztBQTJGSixrQkFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQWRhcHRlZCBmcm9tXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L250ZXJhY3QvYmxvYi9tYXN0ZXIvcGFja2FnZXMvdHJhbnNmb3JtLXBsb3RseS9zcmMvaW5kZXgudHN4XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNiAtIHByZXNlbnQsIG50ZXJhY3QgY29udHJpYnV0b3JzIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxyXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cclxuICpcclxuICogQE5PVEU6IFRoaXMgYFBsb3RseVRyYW5zZm9ybWAgY29tcG9uZW50IGNvdWxkIGJlIHVzZWQgZXhhY3RseSBzYW1lIGFzIHRoZSBvcmlnaW5hbCBgUGxvdGx5VHJhbnNmb3JtYCBjb21wb25lbnQgb2YgQG50ZXJhY3QvdHJhbnNmb3JtLXBsb3RseSxcclxuICogICAgICAgIGV4Y2VwdCB0aGF0IHRoaXMgZmlsZSBhZGRzIHRoZSBhYmlsaXR5IHRvIGRvd25sb2FkIGEgcGxvdCBmcm9tIGFuIGVsZWN0cm9uIGNvbnRleHQuXHJcbiAqL1xyXG5pbXBvcnQgY2xvbmVEZWVwIGZyb20gXCJsb2Rhc2gvY2xvbmVEZWVwXCI7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xyXG5pbnRlcmZhY2UgUHJvcHMge1xyXG4gIGRhdGE6IHN0cmluZyB8IFJlY29yZDxzdHJpbmcsIGFueT47XHJcbiAgbWVkaWFUeXBlOiBcImFwcGxpY2F0aW9uL3ZuZC5wbG90bHkudjEranNvblwiO1xyXG59XHJcbnR5cGUgT2JqZWN0VHlwZSA9IFJlY29yZDxzdHJpbmcsIGFueT47XHJcbmludGVyZmFjZSBGaWd1cmVMYXlvdXQgZXh0ZW5kcyBPYmplY3RUeXBlIHtcclxuICBoZWlnaHQ/OiBzdHJpbmc7XHJcbiAgYXV0b3NpemU/OiBib29sZWFuO1xyXG59XHJcbmludGVyZmFjZSBGaWd1cmUgZXh0ZW5kcyBPYmplY3RUeXBlIHtcclxuICBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xyXG4gIGxheW91dDogRmlndXJlTGF5b3V0O1xyXG59XHJcblxyXG5kZWNsYXJlIGNsYXNzIFBsb3RseUhUTUxFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xyXG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XHJcbiAgbGF5b3V0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xyXG4gIG5ld1Bsb3Q6ICgpID0+IHZvaWQ7XHJcbiAgcmVkcmF3OiAoKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGxvdGx5VHJhbnNmb3JtIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzPiB7XHJcbiAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGRhdGE6IFwiXCIsXHJcbiAgICBtZWRpYVR5cGU6IFwiYXBwbGljYXRpb24vdm5kLnBsb3RseS52MStqc29uXCIsXHJcbiAgfTtcclxuICBwbG90RGl2OiBIVE1MRGl2RWxlbWVudCB8IG51bGw7XHJcbiAgUGxvdGx5OiB7XHJcbiAgICBuZXdQbG90OiAoXHJcbiAgICAgIGRpdjogSFRNTERpdkVsZW1lbnQgfCBudWxsIHwgdm9pZCxcclxuICAgICAgZGF0YTogUmVjb3JkPHN0cmluZywgYW55PixcclxuICAgICAgbGF5b3V0OiBGaWd1cmVMYXlvdXRcclxuICAgICkgPT4gdm9pZDtcclxuICAgIHJlZHJhdzogKGRpdj86IFBsb3RseUhUTUxFbGVtZW50KSA9PiB2b2lkO1xyXG4gICAgdG9JbWFnZTogKGdkOiBhbnkpID0+IFByb21pc2U8c3RyaW5nPjtcclxuICB9O1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIHRoaXMuZG93bmxvYWRJbWFnZSA9IHRoaXMuZG93bmxvYWRJbWFnZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQoKTogdm9pZCB7XHJcbiAgICAvLyBIYW5kbGUgY2FzZSBvZiBlaXRoZXIgc3RyaW5nIHRvIGJlIGBKU09OLnBhcnNlYGQgb3IgcHVyZSBvYmplY3RcclxuICAgIGNvbnN0IGZpZ3VyZSA9IHRoaXMuZ2V0RmlndXJlKCk7XHJcbiAgICB0aGlzLlBsb3RseSA9IHJlcXVpcmUoXCJAbnRlcmFjdC9wbG90bHlcIik7XHJcbiAgICB0aGlzLlBsb3RseS5uZXdQbG90KHRoaXMucGxvdERpdiwgZmlndXJlLmRhdGEsIGZpZ3VyZS5sYXlvdXQsIHtcclxuICAgICAgbW9kZUJhckJ1dHRvbnNUb1JlbW92ZTogW1widG9JbWFnZVwiXSxcclxuICAgICAgbW9kZUJhckJ1dHRvbnNUb0FkZDogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFwiRG93bmxvYWQgcGxvdCBhcyBhIHBuZ1wiLFxyXG4gICAgICAgICAgaWNvbjogdGhpcy5QbG90bHkuSWNvbnMuY2FtZXJhLFxyXG4gICAgICAgICAgY2xpY2s6IHRoaXMuZG93bmxvYWRJbWFnZSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzOiBQcm9wcyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZGF0YSAhPT0gbmV4dFByb3BzLmRhdGE7XHJcbiAgfVxyXG5cclxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XHJcbiAgICBjb25zdCBmaWd1cmUgPSB0aGlzLmdldEZpZ3VyZSgpO1xyXG5cclxuICAgIGlmICghdGhpcy5wbG90RGl2KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwbG90RGl2OiBQbG90bHlIVE1MRWxlbWVudCA9IHRoaXMucGxvdERpdiBhcyBhbnk7XHJcbiAgICBwbG90RGl2LmRhdGEgPSBmaWd1cmUuZGF0YTtcclxuICAgIHBsb3REaXYubGF5b3V0ID0gZmlndXJlLmxheW91dDtcclxuICAgIHRoaXMuUGxvdGx5LnJlZHJhdyhwbG90RGl2KTtcclxuICB9XHJcblxyXG4gIHBsb3REaXZSZWYgPSAocGxvdERpdjogSFRNTERpdkVsZW1lbnQgfCBudWxsKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLnBsb3REaXYgPSBwbG90RGl2O1xyXG4gIH07XHJcbiAgZ2V0RmlndXJlID0gKCk6IEZpZ3VyZSA9PiB7XHJcbiAgICBjb25zdCBmaWd1cmUgPSB0aGlzLnByb3BzLmRhdGE7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmaWd1cmUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZmlndXJlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGUgUGxvdGx5IEFQSSAqbXV0YXRlcyogdGhlIGZpZ3VyZSB0byBpbmNsdWRlIGEgVUlELCB3aGljaCBtZWFuc1xyXG4gICAgLy8gdGhleSB3b24ndCB0YWtlIG91ciBmcm96ZW4gb2JqZWN0c1xyXG4gICAgaWYgKE9iamVjdC5pc0Zyb3plbihmaWd1cmUpKSB7XHJcbiAgICAgIHJldHVybiBjbG9uZURlZXAoZmlndXJlKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGEgPSB7fSwgbGF5b3V0ID0ge30gfSA9IGZpZ3VyZTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRhdGEsXHJcbiAgICAgIGxheW91dCxcclxuICAgIH07XHJcbiAgfTtcclxuICBkb3dubG9hZEltYWdlID0gKGdkOiBhbnkpID0+IHtcclxuICAgIHRoaXMuUGxvdGx5LnRvSW1hZ2UoZ2QpLnRoZW4oZnVuY3Rpb24gKGRhdGFVcmwpIHtcclxuICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIikgYXMgdHlwZW9mIGltcG9ydChcImVsZWN0cm9uXCIpO1xyXG5cclxuICAgICAgZWxlY3Ryb24ucmVtb3RlLmdldEN1cnJlbnRXZWJDb250ZW50cygpLmRvd25sb2FkVVJMKGRhdGFVcmwpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgcmVuZGVyKCkge1xyXG4gICAgY29uc3QgeyBsYXlvdXQgfSA9IHRoaXMuZ2V0RmlndXJlKCk7XHJcbiAgICBjb25zdCBzdHlsZTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xyXG5cclxuICAgIGlmIChsYXlvdXQgJiYgbGF5b3V0LmhlaWdodCAmJiAhbGF5b3V0LmF1dG9zaXplKSB7XHJcbiAgICAgIHN0eWxlLmhlaWdodCA9IGxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIDxkaXYgcmVmPXt0aGlzLnBsb3REaXZSZWZ9IHN0eWxlPXtzdHlsZX0gLz47XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IFBsb3RseVRyYW5zZm9ybTtcclxuIl19