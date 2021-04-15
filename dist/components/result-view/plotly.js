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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlotlyTransform = void 0;
const lodash_1 = require("lodash");
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
                return lodash_1.cloneDeep(figure);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxvdGx5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvcGxvdGx5LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV0EsbUNBQW1DO0FBQ25DLDZDQUErQjtBQXNCL0IsTUFBYSxlQUFnQixTQUFRLEtBQUssQ0FBQyxTQUFnQjtJQWdCekQsWUFBWSxLQUFZO1FBQ3RCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQXFDZixlQUFVLEdBQUcsQ0FBQyxPQUE4QixFQUFRLEVBQUU7WUFDcEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDekIsQ0FBQyxDQUFDO1FBQ0YsY0FBUyxHQUFHLEdBQVcsRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztZQUUvQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO1lBSUQsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMzQixPQUFPLGtCQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDMUI7WUFFRCxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBQzFDLE9BQU87Z0JBQ0wsSUFBSTtnQkFDSixNQUFNO2FBQ1AsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUNGLGtCQUFhLEdBQUcsQ0FBQyxFQUFPLEVBQUUsRUFBRTtZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxPQUFPO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUE4QixDQUFDO2dCQUVsRSxRQUFRLENBQUMsTUFBTSxDQUFDLHFCQUFxQixFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBaEVBLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELGlCQUFpQjtRQUVmLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQzVELHNCQUFzQixFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ25DLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxJQUFJLEVBQUUsd0JBQXdCO29CQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTTtvQkFDOUIsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhO2lCQUMxQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHFCQUFxQixDQUFDLFNBQWdCO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQztJQUM1QyxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxNQUFNLE9BQU8sR0FBc0IsSUFBSSxDQUFDLE9BQWMsQ0FBQztRQUN2RCxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDM0IsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFnQ0QsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsTUFBTSxLQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUV0QyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUMvQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDOUI7UUFFRCxPQUFPLDZCQUFLLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FBQztJQUNyRCxDQUFDOztBQTdGSCwwQ0E4RkM7QUE3RlEsNEJBQVksR0FBRztJQUNwQixJQUFJLEVBQUUsRUFBRTtJQUNSLFNBQVMsRUFBRSxnQ0FBZ0M7Q0FDNUMsQ0FBQztBQTJGSixrQkFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFkYXB0ZWQgZnJvbVxuICogaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvbnRlcmFjdC9ibG9iL21hc3Rlci9wYWNrYWdlcy90cmFuc2Zvcm0tcGxvdGx5L3NyYy9pbmRleC50c3hcbiAqIENvcHlyaWdodCAoYykgMjAxNiAtIHByZXNlbnQsIG50ZXJhY3QgY29udHJpYnV0b3JzIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBATk9URTogVGhpcyBgUGxvdGx5VHJhbnNmb3JtYCBjb21wb25lbnQgY291bGQgYmUgdXNlZCBleGFjdGx5IHNhbWUgYXMgdGhlIG9yaWdpbmFsIGBQbG90bHlUcmFuc2Zvcm1gIGNvbXBvbmVudCBvZiBAbnRlcmFjdC90cmFuc2Zvcm0tcGxvdGx5LFxuICogICAgICAgIGV4Y2VwdCB0aGF0IHRoaXMgZmlsZSBhZGRzIHRoZSBhYmlsaXR5IHRvIGRvd25sb2FkIGEgcGxvdCBmcm9tIGFuIGVsZWN0cm9uIGNvbnRleHQuXG4gKi9cbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW50ZXJmYWNlIFByb3BzIHtcbiAgZGF0YTogc3RyaW5nIHwgUmVjb3JkPHN0cmluZywgYW55PjtcbiAgbWVkaWFUeXBlOiBcImFwcGxpY2F0aW9uL3ZuZC5wbG90bHkudjEranNvblwiO1xufVxudHlwZSBPYmplY3RUeXBlID0gUmVjb3JkPHN0cmluZywgYW55PjtcbmludGVyZmFjZSBGaWd1cmVMYXlvdXQgZXh0ZW5kcyBPYmplY3RUeXBlIHtcbiAgaGVpZ2h0Pzogc3RyaW5nO1xuICBhdXRvc2l6ZT86IGJvb2xlYW47XG59XG5pbnRlcmZhY2UgRmlndXJlIGV4dGVuZHMgT2JqZWN0VHlwZSB7XG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGxheW91dDogRmlndXJlTGF5b3V0O1xufVxuXG5kZWNsYXJlIGNsYXNzIFBsb3RseUhUTUxFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBsYXlvdXQ6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIG5ld1Bsb3Q6ICgpID0+IHZvaWQ7XG4gIHJlZHJhdzogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFBsb3RseVRyYW5zZm9ybSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBzdGF0aWMgZGVmYXVsdFByb3BzID0ge1xuICAgIGRhdGE6IFwiXCIsXG4gICAgbWVkaWFUeXBlOiBcImFwcGxpY2F0aW9uL3ZuZC5wbG90bHkudjEranNvblwiLFxuICB9O1xuICBwbG90RGl2OiBIVE1MRGl2RWxlbWVudCB8IG51bGw7XG4gIFBsb3RseToge1xuICAgIG5ld1Bsb3Q6IChcbiAgICAgIGRpdjogSFRNTERpdkVsZW1lbnQgfCBudWxsIHwgdm9pZCxcbiAgICAgIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gICAgICBsYXlvdXQ6IEZpZ3VyZUxheW91dFxuICAgICkgPT4gdm9pZDtcbiAgICByZWRyYXc6IChkaXY/OiBQbG90bHlIVE1MRWxlbWVudCkgPT4gdm9pZDtcbiAgICB0b0ltYWdlOiAoZ2Q6IGFueSkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLmRvd25sb2FkSW1hZ2UgPSB0aGlzLmRvd25sb2FkSW1hZ2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCk6IHZvaWQge1xuICAgIC8vIEhhbmRsZSBjYXNlIG9mIGVpdGhlciBzdHJpbmcgdG8gYmUgYEpTT04ucGFyc2VgZCBvciBwdXJlIG9iamVjdFxuICAgIGNvbnN0IGZpZ3VyZSA9IHRoaXMuZ2V0RmlndXJlKCk7XG4gICAgdGhpcy5QbG90bHkgPSByZXF1aXJlKFwiQG50ZXJhY3QvcGxvdGx5XCIpO1xuICAgIHRoaXMuUGxvdGx5Lm5ld1Bsb3QodGhpcy5wbG90RGl2LCBmaWd1cmUuZGF0YSwgZmlndXJlLmxheW91dCwge1xuICAgICAgbW9kZUJhckJ1dHRvbnNUb1JlbW92ZTogW1widG9JbWFnZVwiXSxcbiAgICAgIG1vZGVCYXJCdXR0b25zVG9BZGQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwiRG93bmxvYWQgcGxvdCBhcyBhIHBuZ1wiLFxuICAgICAgICAgIGljb246IHRoaXMuUGxvdGx5Lkljb25zLmNhbWVyYSxcbiAgICAgICAgICBjbGljazogdGhpcy5kb3dubG9hZEltYWdlLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZShuZXh0UHJvcHM6IFByb3BzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZGF0YSAhPT0gbmV4dFByb3BzLmRhdGE7XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgY29uc3QgZmlndXJlID0gdGhpcy5nZXRGaWd1cmUoKTtcblxuICAgIGlmICghdGhpcy5wbG90RGl2KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxvdERpdjogUGxvdGx5SFRNTEVsZW1lbnQgPSB0aGlzLnBsb3REaXYgYXMgYW55O1xuICAgIHBsb3REaXYuZGF0YSA9IGZpZ3VyZS5kYXRhO1xuICAgIHBsb3REaXYubGF5b3V0ID0gZmlndXJlLmxheW91dDtcbiAgICB0aGlzLlBsb3RseS5yZWRyYXcocGxvdERpdik7XG4gIH1cblxuICBwbG90RGl2UmVmID0gKHBsb3REaXY6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCk6IHZvaWQgPT4ge1xuICAgIHRoaXMucGxvdERpdiA9IHBsb3REaXY7XG4gIH07XG4gIGdldEZpZ3VyZSA9ICgpOiBGaWd1cmUgPT4ge1xuICAgIGNvbnN0IGZpZ3VyZSA9IHRoaXMucHJvcHMuZGF0YTtcblxuICAgIGlmICh0eXBlb2YgZmlndXJlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShmaWd1cmUpO1xuICAgIH1cblxuICAgIC8vIFRoZSBQbG90bHkgQVBJICptdXRhdGVzKiB0aGUgZmlndXJlIHRvIGluY2x1ZGUgYSBVSUQsIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhleSB3b24ndCB0YWtlIG91ciBmcm96ZW4gb2JqZWN0c1xuICAgIGlmIChPYmplY3QuaXNGcm96ZW4oZmlndXJlKSkge1xuICAgICAgcmV0dXJuIGNsb25lRGVlcChmaWd1cmUpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSA9IHt9LCBsYXlvdXQgPSB7fSB9ID0gZmlndXJlO1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhLFxuICAgICAgbGF5b3V0LFxuICAgIH07XG4gIH07XG4gIGRvd25sb2FkSW1hZ2UgPSAoZ2Q6IGFueSkgPT4ge1xuICAgIHRoaXMuUGxvdGx5LnRvSW1hZ2UoZ2QpLnRoZW4oZnVuY3Rpb24gKGRhdGFVcmwpIHtcbiAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJlbGVjdHJvblwiKTtcblxuICAgICAgZWxlY3Ryb24ucmVtb3RlLmdldEN1cnJlbnRXZWJDb250ZW50cygpLmRvd25sb2FkVVJMKGRhdGFVcmwpO1xuICAgIH0pO1xuICB9O1xuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGxheW91dCB9ID0gdGhpcy5nZXRGaWd1cmUoKTtcbiAgICBjb25zdCBzdHlsZTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuXG4gICAgaWYgKGxheW91dCAmJiBsYXlvdXQuaGVpZ2h0ICYmICFsYXlvdXQuYXV0b3NpemUpIHtcbiAgICAgIHN0eWxlLmhlaWdodCA9IGxheW91dC5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxkaXYgcmVmPXt0aGlzLnBsb3REaXZSZWZ9IHN0eWxlPXtzdHlsZX0gLz47XG4gIH1cbn1cbmV4cG9ydCBkZWZhdWx0IFBsb3RseVRyYW5zZm9ybTtcbiJdfQ==