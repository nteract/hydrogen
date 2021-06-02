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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0LXZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy9yZXN1bHQtdmlldy9yZXN1bHQtdmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0Msa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QywrQkFBMEM7QUFDMUMsd0RBQWdDO0FBQ2hDLHNEQUE4QjtBQUc5QixNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFTMUIsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFBeEQ7O1FBRUUscUJBQWdCLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzdDLGtCQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzFDLGlCQUFZLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRXpDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFHLEdBQUcsRUFBRTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRTtnQkFDWixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRixnQkFBVyxHQUFHLENBQUMsS0FBbUQsRUFBRSxFQUFFO1lBQ3BFLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7YUFDckI7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2FBQ3hCO1FBQ0gsQ0FBQyxDQUFDO1FBQ0Ysc0JBQWlCLEdBQUcsQ0FBQyxLQUFtRCxFQUFFLEVBQUU7WUFD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QyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDOUIsQ0FBQztDQUNGLENBQUE7QUFoT0M7SUFEQyxpQkFBVTs7cURBQ2U7QUF5RjFCO0lBREMsYUFBTTs7eURBR0w7QUFqR0UsbUJBQW1CO0lBRHhCLHFCQUFRO0dBQ0gsbUJBQW1CLENBc094QjtBQUVELGtCQUFlLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcclxuaW1wb3J0IHsgb2JzZXJ2ZXIgfSBmcm9tIFwibW9ieC1yZWFjdFwiO1xyXG5pbXBvcnQgeyBhY3Rpb24sIG9ic2VydmFibGUgfSBmcm9tIFwibW9ieFwiO1xyXG5pbXBvcnQgRGlzcGxheSBmcm9tIFwiLi9kaXNwbGF5XCI7XHJcbmltcG9ydCBTdGF0dXMgZnJvbSBcIi4vc3RhdHVzXCI7XHJcbmltcG9ydCB0eXBlIE91dHB1dFN0b3JlIGZyb20gXCIuLi8uLi9zdG9yZS9vdXRwdXRcIjtcclxuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi8uLi9rZXJuZWxcIjtcclxuY29uc3QgU0NST0xMX0hFSUdIVCA9IDYwMDtcclxudHlwZSBQcm9wcyA9IHtcclxuICBzdG9yZTogT3V0cHV0U3RvcmU7XHJcbiAga2VybmVsOiBLZXJuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIGRlc3Ryb3k6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnk7XHJcbiAgc2hvd1Jlc3VsdDogYm9vbGVhbjtcclxufTtcclxuXHJcbkBvYnNlcnZlclxyXG5jbGFzcyBSZXN1bHRWaWV3Q29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzPiB7XHJcbiAgZWw6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBjb250YWluZXJUb29sdGlwID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICBidXR0b25Ub29sdGlwID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICBjbG9zZVRvb2x0aXAgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgZXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBnZXRBbGxUZXh0ID0gKCkgPT4ge1xyXG4gICAgaWYgKCF0aGlzLmVsKSB7XHJcbiAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuZWwuaW5uZXJUZXh0ID8gdGhpcy5lbC5pbm5lclRleHQgOiBcIlwiO1xyXG4gIH07XHJcbiAgaGFuZGxlQ2xpY2sgPSAoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQsIE1vdXNlRXZlbnQ+KSA9PiB7XHJcbiAgICBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5KSB7XHJcbiAgICAgIHRoaXMub3BlbkluRWRpdG9yKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvcHlUb0NsaXBib2FyZCgpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgY2hlY2tGb3JTZWxlY3Rpb24gPSAoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQsIE1vdXNlRXZlbnQ+KSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3Rpb24gPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcclxuXHJcbiAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi50b1N0cmluZygpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuaGFuZGxlQ2xpY2soZXZlbnQpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgY29weVRvQ2xpcGJvYXJkID0gKCkgPT4ge1xyXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUodGhpcy5nZXRBbGxUZXh0KCkpO1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoXCJDb3BpZWQgdG8gY2xpcGJvYXJkXCIpO1xyXG4gIH07XHJcbiAgb3BlbkluRWRpdG9yID0gKCkgPT4ge1xyXG4gICAgYXRvbS53b3Jrc3BhY2VcclxuICAgICAgLm9wZW4oKVxyXG4gICAgICAudGhlbigoZWRpdG9yKSA9PiBlZGl0b3IuaW5zZXJ0VGV4dCh0aGlzLmdldEFsbFRleHQoKSkpO1xyXG4gIH07XHJcbiAgYWRkQ29weVRvb2x0aXAgPSAoXHJcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXHJcbiAgICBjb21wOiBDb21wb3NpdGVEaXNwb3NhYmxlXHJcbiAgKSA9PiB7XHJcbiAgICBpZiAoIWVsZW1lbnQgfHwgIWNvbXAuZGlzcG9zYWJsZXMgfHwgY29tcC5kaXNwb3NhYmxlcy5zaXplID4gMCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb21wLmFkZChcclxuICAgICAgYXRvbS50b29sdGlwcy5hZGQoZWxlbWVudCwge1xyXG4gICAgICAgIHRpdGxlOiBgQ2xpY2sgdG8gY29weSxcclxuICAgICAgICAgICR7XHJcbiAgICAgICAgICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIgPyBcIkNtZFwiIDogXCJDdHJsXCJcclxuICAgICAgICAgIH0rQ2xpY2sgdG8gb3BlbiBpbiBlZGl0b3JgLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9O1xyXG4gIGFkZENsb3NlQnV0dG9uVG9vbHRpcCA9IChcclxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuICAgIGNvbXA6IENvbXBvc2l0ZURpc3Bvc2FibGVcclxuICApID0+IHtcclxuICAgIGlmICghZWxlbWVudCB8fCAhY29tcC5kaXNwb3NhYmxlcyB8fCBjb21wLmRpc3Bvc2FibGVzLnNpemUgPiAwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbXAuYWRkKFxyXG4gICAgICBhdG9tLnRvb2x0aXBzLmFkZChlbGVtZW50LCB7XHJcbiAgICAgICAgdGl0bGU6IHRoaXMucHJvcHMuc3RvcmUuZXhlY3V0aW9uQ291bnRcclxuICAgICAgICAgID8gYENsb3NlIChPdXRbJHt0aGlzLnByb3BzLnN0b3JlLmV4ZWN1dGlvbkNvdW50fV0pYFxyXG4gICAgICAgICAgOiBcIkNsb3NlIHJlc3VsdFwiLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9O1xyXG4gIGFkZENvcHlCdXR0b25Ub29sdGlwID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4ge1xyXG4gICAgdGhpcy5hZGRDb3B5VG9vbHRpcChlbGVtZW50LCB0aGlzLmJ1dHRvblRvb2x0aXApO1xyXG4gIH07XHJcbiAgb25XaGVlbCA9IChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4ge1xyXG4gICAgcmV0dXJuIChldmVudDogV2hlZWxFdmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBjbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQ7XHJcbiAgICAgIGNvbnN0IGNsaWVudFdpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgY29uc3Qgc2Nyb2xsV2lkdGggPSBlbGVtZW50LnNjcm9sbFdpZHRoO1xyXG4gICAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcclxuICAgICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcclxuICAgICAgY29uc3QgYXRUb3AgPSBzY3JvbGxUb3AgIT09IDAgJiYgZXZlbnQuZGVsdGFZIDwgMDtcclxuICAgICAgY29uc3QgYXRMZWZ0ID0gc2Nyb2xsTGVmdCAhPT0gMCAmJiBldmVudC5kZWx0YVggPCAwO1xyXG4gICAgICBjb25zdCBhdEJvdHRvbSA9XHJcbiAgICAgICAgc2Nyb2xsVG9wICE9PSBzY3JvbGxIZWlnaHQgLSBjbGllbnRIZWlnaHQgJiYgZXZlbnQuZGVsdGFZID4gMDtcclxuICAgICAgY29uc3QgYXRSaWdodCA9XHJcbiAgICAgICAgc2Nyb2xsTGVmdCAhPT0gc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCAmJiBldmVudC5kZWx0YVggPiAwO1xyXG5cclxuICAgICAgaWYgKGNsaWVudEhlaWdodCA8IHNjcm9sbEhlaWdodCAmJiAoYXRUb3AgfHwgYXRCb3R0b20pKSB7XHJcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoY2xpZW50V2lkdGggPCBzY3JvbGxXaWR0aCAmJiAoYXRMZWZ0IHx8IGF0UmlnaHQpKSB7XHJcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfTtcclxuICBAYWN0aW9uXHJcbiAgdG9nZ2xlRXhwYW5kID0gKCkgPT4ge1xyXG4gICAgdGhpcy5leHBhbmRlZCA9ICF0aGlzLmV4cGFuZGVkO1xyXG4gIH07XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIGNvbnN0IHsgb3V0cHV0cywgc3RhdHVzLCBpc1BsYWluLCBwb3NpdGlvbiB9ID0gdGhpcy5wcm9wcy5zdG9yZTtcclxuICAgIGNvbnN0IGlubGluZVN0eWxlOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0ge1xyXG4gICAgICBtYXJnaW5MZWZ0OiBgJHtwb3NpdGlvbi5saW5lTGVuZ3RoICsgcG9zaXRpb24uY2hhcldpZHRofXB4YCxcclxuICAgICAgbWFyZ2luVG9wOiBgLSR7cG9zaXRpb24ubGluZUhlaWdodH1weGAsXHJcbiAgICAgIHVzZXJTZWxlY3Q6IFwidGV4dFwiLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAob3V0cHV0cy5sZW5ndGggPT09IDAgfHwgIXRoaXMucHJvcHMuc2hvd1Jlc3VsdCkge1xyXG4gICAgICBjb25zdCBrZXJuZWwgPSB0aGlzLnByb3BzLmtlcm5lbDtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICA8U3RhdHVzXHJcbiAgICAgICAgICBzdGF0dXM9e1xyXG4gICAgICAgICAgICBrZXJuZWwgJiYga2VybmVsLmV4ZWN1dGlvblN0YXRlICE9PSBcImJ1c3lcIiAmJiBzdGF0dXMgPT09IFwicnVubmluZ1wiXHJcbiAgICAgICAgICAgICAgPyBcImVycm9yXCJcclxuICAgICAgICAgICAgICA6IHN0YXR1c1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgc3R5bGU9e2lubGluZVN0eWxlfVxyXG4gICAgICAgIC8+XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgPGRpdlxyXG4gICAgICAgIGNsYXNzTmFtZT17YCR7XHJcbiAgICAgICAgICBpc1BsYWluID8gXCJpbmxpbmUtY29udGFpbmVyXCIgOiBcIm11bHRpbGluZS1jb250YWluZXJcIlxyXG4gICAgICAgIH0gbmF0aXZlLWtleS1iaW5kaW5nc2B9XHJcbiAgICAgICAgdGFiSW5kZXg9ey0xfVxyXG4gICAgICAgIG9uQ2xpY2s9e2lzUGxhaW4gPyB0aGlzLmNoZWNrRm9yU2VsZWN0aW9uIDogdW5kZWZpbmVkfVxyXG4gICAgICAgIHN0eWxlPXtcclxuICAgICAgICAgIGlzUGxhaW5cclxuICAgICAgICAgICAgPyBpbmxpbmVTdHlsZVxyXG4gICAgICAgICAgICA6IHtcclxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiBgJHtwb3NpdGlvbi5lZGl0b3JXaWR0aCAtIDIgKiBwb3NpdGlvbi5jaGFyV2lkdGh9cHhgLFxyXG4gICAgICAgICAgICAgICAgbWFyZ2luOiBcIjBweFwiLFxyXG4gICAgICAgICAgICAgICAgdXNlclNlbGVjdDogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBoeWRyb2dlbi13cmFwb3V0cHV0PXthdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLndyYXBPdXRwdXRgKS50b1N0cmluZygpfVxyXG4gICAgICA+XHJcbiAgICAgICAgPGRpdlxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiaHlkcm9nZW5fY2VsbF9kaXNwbGF5XCJcclxuICAgICAgICAgIHJlZj17KHJlZikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXJlZikge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVsID0gcmVmO1xyXG4gICAgICAgICAgICBpc1BsYWluXHJcbiAgICAgICAgICAgICAgPyB0aGlzLmFkZENvcHlUb29sdGlwKHJlZiwgdGhpcy5jb250YWluZXJUb29sdGlwKVxyXG4gICAgICAgICAgICAgIDogdGhpcy5jb250YWluZXJUb29sdGlwLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFzIG9mIHRoaXMgd3JpdGluZyBSZWFjdCdzIGV2ZW50IGhhbmRsZXIgZG9lc24ndCBwcm9wZXJseSBoYW5kbGVcclxuICAgICAgICAgICAgLy8gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkgZm9yIGV2ZW50cyBvdXRzaWRlIHRoZSBSZWFjdCBjb250ZXh0LlxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZXhwYW5kZWQgJiYgIWlzUGxhaW4gJiYgcmVmKSB7XHJcbiAgICAgICAgICAgICAgcmVmLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB0aGlzLm9uV2hlZWwocmVmKSwge1xyXG4gICAgICAgICAgICAgICAgcGFzc2l2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfX1cclxuICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgIG1heEhlaWdodDogdGhpcy5leHBhbmRlZCA/IFwiMTAwJVwiIDogYCR7U0NST0xMX0hFSUdIVH1weGAsXHJcbiAgICAgICAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXHJcbiAgICAgICAgICB9fVxyXG4gICAgICAgID5cclxuICAgICAgICAgIHtvdXRwdXRzLm1hcCgob3V0cHV0LCBpbmRleCkgPT4gKFxyXG4gICAgICAgICAgICA8RGlzcGxheSBvdXRwdXQ9e291dHB1dH0ga2V5PXtpbmRleH0gLz5cclxuICAgICAgICAgICkpfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIHtpc1BsYWluID8gbnVsbCA6IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9vbGJhclwiPlxyXG4gICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaWNvbiBpY29uLXhcIlxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMuZGVzdHJveX1cclxuICAgICAgICAgICAgICByZWY9eyhyZWYpID0+IHRoaXMuYWRkQ2xvc2VCdXR0b25Ub29sdGlwKHJlZiwgdGhpcy5jbG9zZVRvb2x0aXApfVxyXG4gICAgICAgICAgICAvPlxyXG5cclxuICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICBmbGV4OiAxLFxyXG4gICAgICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjAuMjVlbVwiLFxyXG4gICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIC8+XHJcblxyXG4gICAgICAgICAgICB7dGhpcy5nZXRBbGxUZXh0KCkubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24tY2xpcHB5XCJcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9XHJcbiAgICAgICAgICAgICAgICByZWY9e3RoaXMuYWRkQ29weUJ1dHRvblRvb2x0aXB9XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgKSA6IG51bGx9XHJcblxyXG4gICAgICAgICAgICB7dGhpcy5lbCAmJiB0aGlzLmVsLnNjcm9sbEhlaWdodCA+IFNDUk9MTF9IRUlHSFQgPyAoXHJcbiAgICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgaWNvbiBpY29uLSR7dGhpcy5leHBhbmRlZCA/IFwiZm9sZFwiIDogXCJ1bmZvbGRcIn1gfVxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVFeHBhbmR9XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgKSA6IG51bGx9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzY3JvbGxUb0JvdHRvbSgpIHtcclxuICAgIGlmIChcclxuICAgICAgIXRoaXMuZWwgfHxcclxuICAgICAgdGhpcy5leHBhbmRlZCB8fFxyXG4gICAgICB0aGlzLnByb3BzLnN0b3JlLmlzUGxhaW4gfHxcclxuICAgICAgYXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi5hdXRvU2Nyb2xsYCkgPT09IGZhbHNlXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5lbC5zY3JvbGxIZWlnaHQ7XHJcbiAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmVsLmNsaWVudEhlaWdodDtcclxuICAgIGNvbnN0IG1heFNjcm9sbFRvcCA9IHNjcm9sbEhlaWdodCAtIGhlaWdodDtcclxuICAgIHRoaXMuZWwuc2Nyb2xsVG9wID0gbWF4U2Nyb2xsVG9wID4gMCA/IG1heFNjcm9sbFRvcCA6IDA7XHJcbiAgfVxyXG5cclxuICBjb21wb25lbnREaWRVcGRhdGUoKSB7XHJcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICBjb21wb25lbnREaWRNb3VudCgpIHtcclxuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcclxuICB9XHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xyXG4gICAgdGhpcy5jb250YWluZXJUb29sdGlwLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuYnV0dG9uVG9vbHRpcC5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmNsb3NlVG9vbHRpcC5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBSZXN1bHRWaWV3Q29tcG9uZW50O1xyXG4iXX0=