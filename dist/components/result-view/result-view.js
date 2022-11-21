"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const mobx_1 = require("mobx");
const display_1 = __importDefault(require("./display"));
const status_1 = __importDefault(require("./status"));
const SCROLL_HEIGHT = 600;
let ResultViewComponent = class ResultViewComponent extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.containerTooltip = new atom_1.CompositeDisposable();
        this.buttonTooltip = new atom_1.CompositeDisposable();
        this.closeTooltip = new atom_1.CompositeDisposable();
        this.expanded = false;
        this.getAllText = () => {
            if (!this.el) {
                return "";
            }
            return this.el.innerText ? this.el.innerText : "";
        };
        this.handleClick = (event) => {
            if (event.ctrlKey || event.metaKey) {
                this.openInEditor();
            }
            else {
                this.copyToClipboard();
            }
        };
        this.checkForSelection = (event) => {
            const selection = document.getSelection();
            if (selection && selection.toString()) {
                return;
            }
            else {
                this.handleClick(event);
            }
        };
        this.copyToClipboard = () => {
            atom.clipboard.write(this.getAllText());
            atom.notifications.addSuccess("Copied to clipboard");
        };
        this.openInEditor = () => {
            atom.workspace
                .open()
                .then((editor) => editor.insertText(this.getAllText()));
        };
        this.addCopyTooltip = (element, comp) => {
            if (!element || !comp.disposables || comp.disposables.size > 0) {
                return;
            }
            comp.add(atom.tooltips.add(element, {
                title: `Click to copy,
          ${process.platform === "darwin" ? "Cmd" : "Ctrl"}+Click to open in editor`,
            }));
        };
        this.addCloseButtonTooltip = (element, comp) => {
            if (!element || !comp.disposables || comp.disposables.size > 0) {
                return;
            }
            comp.add(atom.tooltips.add(element, {
                title: this.props.store.executionCount
                    ? `Close (Out[${this.props.store.executionCount}])`
                    : "Close result",
            }));
        };
        this.addCopyButtonTooltip = (element) => {
            this.addCopyTooltip(element, this.buttonTooltip);
        };
        this.onWheel = (element) => {
            return (event) => {
                const clientHeight = element.clientHeight;
                const scrollHeight = element.scrollHeight;
                const clientWidth = element.clientWidth;
                const scrollWidth = element.scrollWidth;
                const scrollTop = element.scrollTop;
                const scrollLeft = element.scrollLeft;
                const atTop = scrollTop !== 0 && event.deltaY < 0;
                const atLeft = scrollLeft !== 0 && event.deltaX < 0;
                const atBottom = scrollTop !== scrollHeight - clientHeight && event.deltaY > 0;
                const atRight = scrollLeft !== scrollWidth - clientWidth && event.deltaX > 0;
                if (clientHeight < scrollHeight && (atTop || atBottom)) {
                    event.stopPropagation();
                }
                else if (clientWidth < scrollWidth && (atLeft || atRight)) {
                    event.stopPropagation();
                }
            };
        };
        this.toggleExpand = () => {
            this.expanded = !this.expanded;
        };
    }
    render() {
        const { outputs, status, isPlain, position } = this.props.store;
        const inlineStyle = {
            marginLeft: `${position.lineLength + position.charWidth}px`,
            marginTop: `-${position.lineHeight}px`,
            userSelect: "text",
        };
        if (outputs.length === 0 || !this.props.showResult) {
            const kernel = this.props.kernel;
            return (react_1.default.createElement(status_1.default, { status: kernel && kernel.executionState !== "busy" && status === "running"
                    ? "error"
                    : status, style: inlineStyle }));
        }
        return (react_1.default.createElement("div", { className: `${isPlain ? "inline-container" : "multiline-container"} native-key-bindings`, tabIndex: -1, onClick: isPlain ? this.checkForSelection : undefined, style: isPlain
                ? inlineStyle
                : {
                    maxWidth: `${position.editorWidth - 2 * position.charWidth}px`,
                    margin: "0px",
                    userSelect: "text",
                }, "hydrogen-wrapoutput": atom.config.get(`Hydrogen.wrapOutput`).toString() },
            react_1.default.createElement("div", { className: "hydrogen_cell_display", ref: (ref) => {
                    if (!ref) {
                        return;
                    }
                    this.el = ref;
                    isPlain
                        ? this.addCopyTooltip(ref, this.containerTooltip)
                        : this.containerTooltip.dispose();
                    if (!this.expanded && !isPlain && ref) {
                        ref.addEventListener("wheel", this.onWheel(ref), {
                            passive: true,
                        });
                    }
                }, style: {
                    maxHeight: this.expanded ? "100%" : `${SCROLL_HEIGHT}px`,
                    overflowY: "auto",
                } }, outputs.map((output, index) => (react_1.default.createElement(display_1.default, { output: output, key: index })))),
            isPlain ? null : (react_1.default.createElement("div", { className: "toolbar" },
                react_1.default.createElement("div", { className: "icon icon-x", onClick: this.props.destroy, ref: (ref) => this.addCloseButtonTooltip(ref, this.closeTooltip) }),
                react_1.default.createElement("div", { style: {
                        flex: 1,
                        minHeight: "0.25em",
                    } }),
                this.getAllText().length > 0 ? (react_1.default.createElement("div", { className: "icon icon-clippy", onClick: this.handleClick, ref: this.addCopyButtonTooltip })) : null,
                this.el && this.el.scrollHeight > SCROLL_HEIGHT ? (react_1.default.createElement("div", { className: `icon icon-${this.expanded ? "fold" : "unfold"}`, onClick: this.toggleExpand })) : null))));
    }
    scrollToBottom() {
        if (!this.el ||
            this.expanded ||
            this.props.store.isPlain ||
            atom.config.get(`Hydrogen.autoScroll`) === false) {
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
    componentWillUnmount() {
        this.containerTooltip.dispose();
        this.buttonTooltip.dispose();
        this.closeTooltip.dispose();
    }
};
__decorate([
    mobx_1.observable,
    __metadata("design:type", Boolean)
], ResultViewComponent.prototype, "expanded", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], ResultViewComponent.prototype, "toggleExpand", void 0);
ResultViewComponent = __decorate([
    mobx_react_1.observer
], ResultViewComponent);
exports.default = ResultViewComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0LXZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy9yZXN1bHQtdmlldy9yZXN1bHQtdmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0Msa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QywrQkFBMEM7QUFDMUMsd0RBQWdDO0FBQ2hDLHNEQUE4QjtBQUc5QixNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFTMUIsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFBeEQ7O1FBRUUscUJBQWdCLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzdDLGtCQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzFDLGlCQUFZLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRXpDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFHLEdBQUcsRUFBRTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRTtnQkFDWixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRixnQkFBVyxHQUFHLENBQUMsS0FBbUQsRUFBRSxFQUFFO1lBQ3BFLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7YUFDckI7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2FBQ3hCO1FBQ0gsQ0FBQyxDQUFDO1FBQ0Ysc0JBQWlCLEdBQUcsQ0FBQyxLQUFtRCxFQUFFLEVBQUU7WUFD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QyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDOUIsQ0FBQztDQUNGLENBQUE7QUFqT0M7SUFBQyxpQkFBVTs7cURBQ2U7QUF3RjFCO0lBQUMsYUFBTTs7eURBR0w7QUFqR0UsbUJBQW1CO0lBRHhCLHFCQUFRO0dBQ0gsbUJBQW1CLENBc094QjtBQUVELGtCQUFlLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgeyBhY3Rpb24sIG9ic2VydmFibGUgfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IERpc3BsYXkgZnJvbSBcIi4vZGlzcGxheVwiO1xuaW1wb3J0IFN0YXR1cyBmcm9tIFwiLi9zdGF0dXNcIjtcbmltcG9ydCB0eXBlIE91dHB1dFN0b3JlIGZyb20gXCIuLi8uLi9zdG9yZS9vdXRwdXRcIjtcbmltcG9ydCB0eXBlIEtlcm5lbCBmcm9tIFwiLi4vLi4va2VybmVsXCI7XG5jb25zdCBTQ1JPTExfSEVJR0hUID0gNjAwO1xudHlwZSBQcm9wcyA9IHtcbiAgc3RvcmU6IE91dHB1dFN0b3JlO1xuICBrZXJuZWw6IEtlcm5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIGRlc3Ryb3k6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnk7XG4gIHNob3dSZXN1bHQ6IGJvb2xlYW47XG59O1xuXG5Ab2JzZXJ2ZXJcbmNsYXNzIFJlc3VsdFZpZXdDb21wb25lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcbiAgZWw6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgY29udGFpbmVyVG9vbHRpcCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIGJ1dHRvblRvb2x0aXAgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICBjbG9zZVRvb2x0aXAgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICBAb2JzZXJ2YWJsZVxuICBleHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBnZXRBbGxUZXh0ID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmVsLmlubmVyVGV4dCA/IHRoaXMuZWwuaW5uZXJUZXh0IDogXCJcIjtcbiAgfTtcbiAgaGFuZGxlQ2xpY2sgPSAoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQsIE1vdXNlRXZlbnQ+KSA9PiB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSkge1xuICAgICAgdGhpcy5vcGVuSW5FZGl0b3IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb3B5VG9DbGlwYm9hcmQoKTtcbiAgICB9XG4gIH07XG4gIGNoZWNrRm9yU2VsZWN0aW9uID0gKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxEaXZFbGVtZW50LCBNb3VzZUV2ZW50PikgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuXG4gICAgaWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24udG9TdHJpbmcoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhhbmRsZUNsaWNrKGV2ZW50KTtcbiAgICB9XG4gIH07XG4gIGNvcHlUb0NsaXBib2FyZCA9ICgpID0+IHtcbiAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0aGlzLmdldEFsbFRleHQoKSk7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoXCJDb3BpZWQgdG8gY2xpcGJvYXJkXCIpO1xuICB9O1xuICBvcGVuSW5FZGl0b3IgPSAoKSA9PiB7XG4gICAgYXRvbS53b3Jrc3BhY2VcbiAgICAgIC5vcGVuKClcbiAgICAgIC50aGVuKChlZGl0b3IpID0+IGVkaXRvci5pbnNlcnRUZXh0KHRoaXMuZ2V0QWxsVGV4dCgpKSk7XG4gIH07XG4gIGFkZENvcHlUb29sdGlwID0gKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBjb21wOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICkgPT4ge1xuICAgIGlmICghZWxlbWVudCB8fCAhY29tcC5kaXNwb3NhYmxlcyB8fCBjb21wLmRpc3Bvc2FibGVzLnNpemUgPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbXAuYWRkKFxuICAgICAgYXRvbS50b29sdGlwcy5hZGQoZWxlbWVudCwge1xuICAgICAgICB0aXRsZTogYENsaWNrIHRvIGNvcHksXG4gICAgICAgICAgJHtcbiAgICAgICAgICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIgPyBcIkNtZFwiIDogXCJDdHJsXCJcbiAgICAgICAgICB9K0NsaWNrIHRvIG9wZW4gaW4gZWRpdG9yYCxcbiAgICAgIH0pXG4gICAgKTtcbiAgfTtcbiAgYWRkQ2xvc2VCdXR0b25Ub29sdGlwID0gKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBjb21wOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICkgPT4ge1xuICAgIGlmICghZWxlbWVudCB8fCAhY29tcC5kaXNwb3NhYmxlcyB8fCBjb21wLmRpc3Bvc2FibGVzLnNpemUgPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbXAuYWRkKFxuICAgICAgYXRvbS50b29sdGlwcy5hZGQoZWxlbWVudCwge1xuICAgICAgICB0aXRsZTogdGhpcy5wcm9wcy5zdG9yZS5leGVjdXRpb25Db3VudFxuICAgICAgICAgID8gYENsb3NlIChPdXRbJHt0aGlzLnByb3BzLnN0b3JlLmV4ZWN1dGlvbkNvdW50fV0pYFxuICAgICAgICAgIDogXCJDbG9zZSByZXN1bHRcIixcbiAgICAgIH0pXG4gICAgKTtcbiAgfTtcbiAgYWRkQ29weUJ1dHRvblRvb2x0aXAgPSAoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgdGhpcy5hZGRDb3B5VG9vbHRpcChlbGVtZW50LCB0aGlzLmJ1dHRvblRvb2x0aXApO1xuICB9O1xuICBvbldoZWVsID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgcmV0dXJuIChldmVudDogV2hlZWxFdmVudCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50SGVpZ2h0ID0gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICBjb25zdCBzY3JvbGxIZWlnaHQgPSBlbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICAgIGNvbnN0IGNsaWVudFdpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgIGNvbnN0IHNjcm9sbFdpZHRoID0gZWxlbWVudC5zY3JvbGxXaWR0aDtcbiAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgIGNvbnN0IGF0VG9wID0gc2Nyb2xsVG9wICE9PSAwICYmIGV2ZW50LmRlbHRhWSA8IDA7XG4gICAgICBjb25zdCBhdExlZnQgPSBzY3JvbGxMZWZ0ICE9PSAwICYmIGV2ZW50LmRlbHRhWCA8IDA7XG4gICAgICBjb25zdCBhdEJvdHRvbSA9XG4gICAgICAgIHNjcm9sbFRvcCAhPT0gc2Nyb2xsSGVpZ2h0IC0gY2xpZW50SGVpZ2h0ICYmIGV2ZW50LmRlbHRhWSA+IDA7XG4gICAgICBjb25zdCBhdFJpZ2h0ID1cbiAgICAgICAgc2Nyb2xsTGVmdCAhPT0gc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCAmJiBldmVudC5kZWx0YVggPiAwO1xuXG4gICAgICBpZiAoY2xpZW50SGVpZ2h0IDwgc2Nyb2xsSGVpZ2h0ICYmIChhdFRvcCB8fCBhdEJvdHRvbSkpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9IGVsc2UgaWYgKGNsaWVudFdpZHRoIDwgc2Nyb2xsV2lkdGggJiYgKGF0TGVmdCB8fCBhdFJpZ2h0KSkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuICBAYWN0aW9uXG4gIHRvZ2dsZUV4cGFuZCA9ICgpID0+IHtcbiAgICB0aGlzLmV4cGFuZGVkID0gIXRoaXMuZXhwYW5kZWQ7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgb3V0cHV0cywgc3RhdHVzLCBpc1BsYWluLCBwb3NpdGlvbiB9ID0gdGhpcy5wcm9wcy5zdG9yZTtcbiAgICBjb25zdCBpbmxpbmVTdHlsZTogUmVhY3QuQ1NTUHJvcGVydGllcyA9IHtcbiAgICAgIG1hcmdpbkxlZnQ6IGAke3Bvc2l0aW9uLmxpbmVMZW5ndGggKyBwb3NpdGlvbi5jaGFyV2lkdGh9cHhgLFxuICAgICAgbWFyZ2luVG9wOiBgLSR7cG9zaXRpb24ubGluZUhlaWdodH1weGAsXG4gICAgICB1c2VyU2VsZWN0OiBcInRleHRcIixcbiAgICB9O1xuXG4gICAgaWYgKG91dHB1dHMubGVuZ3RoID09PSAwIHx8ICF0aGlzLnByb3BzLnNob3dSZXN1bHQpIHtcbiAgICAgIGNvbnN0IGtlcm5lbCA9IHRoaXMucHJvcHMua2VybmVsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFN0YXR1c1xuICAgICAgICAgIHN0YXR1cz17XG4gICAgICAgICAgICBrZXJuZWwgJiYga2VybmVsLmV4ZWN1dGlvblN0YXRlICE9PSBcImJ1c3lcIiAmJiBzdGF0dXMgPT09IFwicnVubmluZ1wiXG4gICAgICAgICAgICAgID8gXCJlcnJvclwiXG4gICAgICAgICAgICAgIDogc3RhdHVzXG4gICAgICAgICAgfVxuICAgICAgICAgIHN0eWxlPXtpbmxpbmVTdHlsZX1cbiAgICAgICAgLz5cbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3NOYW1lPXtgJHtcbiAgICAgICAgICBpc1BsYWluID8gXCJpbmxpbmUtY29udGFpbmVyXCIgOiBcIm11bHRpbGluZS1jb250YWluZXJcIlxuICAgICAgICB9IG5hdGl2ZS1rZXktYmluZGluZ3NgfVxuICAgICAgICB0YWJJbmRleD17LTF9XG4gICAgICAgIG9uQ2xpY2s9e2lzUGxhaW4gPyB0aGlzLmNoZWNrRm9yU2VsZWN0aW9uIDogdW5kZWZpbmVkfVxuICAgICAgICBzdHlsZT17XG4gICAgICAgICAgaXNQbGFpblxuICAgICAgICAgICAgPyBpbmxpbmVTdHlsZVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgbWF4V2lkdGg6IGAke3Bvc2l0aW9uLmVkaXRvcldpZHRoIC0gMiAqIHBvc2l0aW9uLmNoYXJXaWR0aH1weGAsXG4gICAgICAgICAgICAgICAgbWFyZ2luOiBcIjBweFwiLFxuICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6IFwidGV4dFwiLFxuICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaHlkcm9nZW4td3JhcG91dHB1dD17YXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi53cmFwT3V0cHV0YCkudG9TdHJpbmcoKX1cbiAgICAgID5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzTmFtZT1cImh5ZHJvZ2VuX2NlbGxfZGlzcGxheVwiXG4gICAgICAgICAgcmVmPXsocmVmKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlZikge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVsID0gcmVmO1xuICAgICAgICAgICAgaXNQbGFpblxuICAgICAgICAgICAgICA/IHRoaXMuYWRkQ29weVRvb2x0aXAocmVmLCB0aGlzLmNvbnRhaW5lclRvb2x0aXApXG4gICAgICAgICAgICAgIDogdGhpcy5jb250YWluZXJUb29sdGlwLmRpc3Bvc2UoKTtcblxuICAgICAgICAgICAgLy8gQXMgb2YgdGhpcyB3cml0aW5nIFJlYWN0J3MgZXZlbnQgaGFuZGxlciBkb2Vzbid0IHByb3Blcmx5IGhhbmRsZVxuICAgICAgICAgICAgLy8gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkgZm9yIGV2ZW50cyBvdXRzaWRlIHRoZSBSZWFjdCBjb250ZXh0LlxuICAgICAgICAgICAgaWYgKCF0aGlzLmV4cGFuZGVkICYmICFpc1BsYWluICYmIHJlZikge1xuICAgICAgICAgICAgICByZWYuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHRoaXMub25XaGVlbChyZWYpLCB7XG4gICAgICAgICAgICAgICAgcGFzc2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfX1cbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgbWF4SGVpZ2h0OiB0aGlzLmV4cGFuZGVkID8gXCIxMDAlXCIgOiBgJHtTQ1JPTExfSEVJR0hUfXB4YCxcbiAgICAgICAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIHtvdXRwdXRzLm1hcCgob3V0cHV0LCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgPERpc3BsYXkgb3V0cHV0PXtvdXRwdXR9IGtleT17aW5kZXh9IC8+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7aXNQbGFpbiA/IG51bGwgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b29sYmFyXCI+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImljb24gaWNvbi14XCJcbiAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5kZXN0cm95fVxuICAgICAgICAgICAgICByZWY9eyhyZWYpID0+IHRoaXMuYWRkQ2xvc2VCdXR0b25Ub29sdGlwKHJlZiwgdGhpcy5jbG9zZVRvb2x0aXApfVxuICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjAuMjVlbVwiLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAge3RoaXMuZ2V0QWxsVGV4dCgpLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24tY2xpcHB5XCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfVxuICAgICAgICAgICAgICAgIHJlZj17dGhpcy5hZGRDb3B5QnV0dG9uVG9vbHRpcH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgICAgICB7dGhpcy5lbCAmJiB0aGlzLmVsLnNjcm9sbEhlaWdodCA+IFNDUk9MTF9IRUlHSFQgPyAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BpY29uIGljb24tJHt0aGlzLmV4cGFuZGVkID8gXCJmb2xkXCIgOiBcInVuZm9sZFwifWB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVFeHBhbmR9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICBzY3JvbGxUb0JvdHRvbSgpIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5lbCB8fFxuICAgICAgdGhpcy5leHBhbmRlZCB8fFxuICAgICAgdGhpcy5wcm9wcy5zdG9yZS5pc1BsYWluIHx8XG4gICAgICBhdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLmF1dG9TY3JvbGxgKSA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5lbC5zY3JvbGxIZWlnaHQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5lbC5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgbWF4U2Nyb2xsVG9wID0gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0O1xuICAgIHRoaXMuZWwuc2Nyb2xsVG9wID0gbWF4U2Nyb2xsVG9wID4gMCA/IG1heFNjcm9sbFRvcCA6IDA7XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5jb250YWluZXJUb29sdGlwLmRpc3Bvc2UoKTtcbiAgICB0aGlzLmJ1dHRvblRvb2x0aXAuZGlzcG9zZSgpO1xuICAgIHRoaXMuY2xvc2VUb29sdGlwLmRpc3Bvc2UoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZXN1bHRWaWV3Q29tcG9uZW50O1xuIl19