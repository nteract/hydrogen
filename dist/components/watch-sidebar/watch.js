"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const atom_1 = require("atom");
const history_1 = __importDefault(require("../result-view/history"));
class Watch extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.subscriptions = new atom_1.CompositeDisposable();
    }
    componentDidMount() {
        if (!this.container) {
            return;
        }
        const container = this.container;
        container.insertBefore(this.props.store.editor.element, container.firstChild);
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        return (react_1.default.createElement("div", { className: "hydrogen watch-view", ref: (c) => {
                this.container = c;
            } },
            react_1.default.createElement(history_1.default, { store: this.props.store.outputStore })));
    }
}
exports.default = Watch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy93YXRjaC1zaWRlYmFyL3dhdGNoLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBMkM7QUFDM0MscUVBQTZDO0FBRTdDLE1BQXFCLEtBQU0sU0FBUSxlQUFLLENBQUMsU0FFdkM7SUFGRjs7UUFJRSxrQkFBYSxHQUF3QixJQUFJLDBCQUFtQixFQUFFLENBQUM7SUE2QmpFLENBQUM7SUEzQkMsaUJBQWlCO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbkIsT0FBTztTQUNSO1FBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNqQyxTQUFTLENBQUMsWUFBWSxDQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUMvQixTQUFTLENBQUMsVUFBVSxDQUNyQixDQUFDO0lBQ0osQ0FBQztJQUVELG9CQUFvQjtRQUNsQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxDQUNMLHVDQUNFLFNBQVMsRUFBQyxxQkFBcUIsRUFDL0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELDhCQUFDLGlCQUFPLElBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBSSxDQUM1QyxDQUNQLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFqQ0Qsd0JBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgSGlzdG9yeSBmcm9tIFwiLi4vcmVzdWx0LXZpZXcvaGlzdG9yeVwiO1xuaW1wb3J0IHR5cGUgV2F0Y2hTdG9yZSBmcm9tIFwiLi4vLi4vc3RvcmUvd2F0Y2hcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhdGNoIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PHtcbiAgc3RvcmU6IFdhdGNoU3RvcmU7XG59PiB7XG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyO1xuICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoXG4gICAgICB0aGlzLnByb3BzLnN0b3JlLmVkaXRvci5lbGVtZW50LFxuICAgICAgY29udGFpbmVyLmZpcnN0Q2hpbGRcbiAgICApO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdlxuICAgICAgICBjbGFzc05hbWU9XCJoeWRyb2dlbiB3YXRjaC12aWV3XCJcbiAgICAgICAgcmVmPXsoYykgPT4ge1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gYztcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgPEhpc3Rvcnkgc3RvcmU9e3RoaXMucHJvcHMuc3RvcmUub3V0cHV0U3RvcmV9IC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG4iXX0=