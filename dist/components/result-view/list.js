"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const display_1 = __importDefault(require("./display"));
let ScrollList = class ScrollList extends react_1.default.Component {
    scrollToBottom() {
        if (!this.el) {
            return;
        }
        const scrollHeight = this.el.scrollHeight;
        const height = this.el.clientHeight;
        const maxScrollTop = scrollHeight - height;
        this.el.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
    componentDidUpdate() {
        this.scrollToBottom();
    }
    componentDidMount() {
        this.scrollToBottom();
    }
    render() {
        if (this.props.outputs.length === 0) {
            return null;
        }
        return (react_1.default.createElement("div", { className: "scroll-list multiline-container native-key-bindings", tabIndex: -1, style: {
                fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
            }, ref: (el) => {
                this.el = el;
            }, "hydrogen-wrapoutput": atom.config.get(`Hydrogen.wrapOutput`).toString() }, this.props.outputs.map((output, index) => (react_1.default.createElement("div", { className: "scroll-list-item" },
            react_1.default.createElement(display_1.default, { output: output, key: index }))))));
    }
};
ScrollList = __decorate([
    mobx_react_1.observer
], ScrollList);
exports.default = ScrollList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2xpc3QudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0Qyx3REFBZ0M7QUFNaEMsSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLGVBQUssQ0FBQyxTQUFnQjtJQUc3QyxjQUFjO1FBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDWixPQUFPO1NBQ1I7UUFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQztRQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQztRQUNwQyxNQUFNLFlBQVksR0FBRyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQzNDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxrQkFBa0I7UUFDaEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxpQkFBaUI7UUFDZixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sQ0FDTCx1Q0FDRSxTQUFTLEVBQUMscURBQXFELEVBQy9ELFFBQVEsRUFBRSxDQUFDLENBQUMsRUFDWixLQUFLLEVBQUU7Z0JBQ0wsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksU0FBUzthQUN0RSxFQUNELEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNWLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ2YsQ0FBQyx5QkFDb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFFckUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FDekMsdUNBQUssU0FBUyxFQUFDLGtCQUFrQjtZQUMvQiw4QkFBQyxpQkFBTyxJQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssR0FBSSxDQUNuQyxDQUNQLENBQUMsQ0FDRSxDQUNQLENBQUM7SUFDSixDQUFDO0NBQ0YsQ0FBQTtBQTdDSyxVQUFVO0lBRGYscUJBQVE7R0FDSCxVQUFVLENBNkNmO0FBRUQsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgb2JzZXJ2ZXIgfSBmcm9tIFwibW9ieC1yZWFjdFwiO1xuaW1wb3J0IERpc3BsYXkgZnJvbSBcIi4vZGlzcGxheVwiO1xudHlwZSBQcm9wcyA9IHtcbiAgb3V0cHV0czogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj47XG59O1xuXG5Ab2JzZXJ2ZXJcbmNsYXNzIFNjcm9sbExpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcbiAgZWw6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICBzY3JvbGxUb0JvdHRvbSgpIHtcbiAgICBpZiAoIXRoaXMuZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5lbC5zY3JvbGxIZWlnaHQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5lbC5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgbWF4U2Nyb2xsVG9wID0gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0O1xuICAgIHRoaXMuZWwuc2Nyb2xsVG9wID0gbWF4U2Nyb2xsVG9wID4gMCA/IG1heFNjcm9sbFRvcCA6IDA7XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLnByb3BzLm91dHB1dHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3NOYW1lPVwic2Nyb2xsLWxpc3QgbXVsdGlsaW5lLWNvbnRhaW5lciBuYXRpdmUta2V5LWJpbmRpbmdzXCJcbiAgICAgICAgdGFiSW5kZXg9ey0xfVxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIGZvbnRTaXplOiBhdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLm91dHB1dEFyZWFGb250U2l6ZWApIHx8IFwiaW5oZXJpdFwiLFxuICAgICAgICB9fVxuICAgICAgICByZWY9eyhlbCkgPT4ge1xuICAgICAgICAgIHRoaXMuZWwgPSBlbDtcbiAgICAgICAgfX1cbiAgICAgICAgaHlkcm9nZW4td3JhcG91dHB1dD17YXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi53cmFwT3V0cHV0YCkudG9TdHJpbmcoKX1cbiAgICAgID5cbiAgICAgICAge3RoaXMucHJvcHMub3V0cHV0cy5tYXAoKG91dHB1dCwgaW5kZXgpID0+IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNjcm9sbC1saXN0LWl0ZW1cIj5cbiAgICAgICAgICAgIDxEaXNwbGF5IG91dHB1dD17b3V0cHV0fSBrZXk9e2luZGV4fSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2Nyb2xsTGlzdDtcbiJdfQ==