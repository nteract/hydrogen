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
        if (outputs.length === 0 || this.props.showResult === false) {
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
            this.expanded === true ||
            this.props.store.isPlain === true ||
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0LXZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy9yZXN1bHQtdmlldy9yZXN1bHQtdmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0Msa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QywrQkFBMEM7QUFDMUMsd0RBQWdDO0FBQ2hDLHNEQUE4QjtBQUc5QixNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFTMUIsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFBeEQ7O1FBRUUscUJBQWdCLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzdDLGtCQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzFDLGlCQUFZLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRXpDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFHLEdBQUcsRUFBRTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRTtnQkFDWixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRixnQkFBVyxHQUFHLENBQUMsS0FBbUQsRUFBRSxFQUFFO1lBQ3BFLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7YUFDckI7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2FBQ3hCO1FBQ0gsQ0FBQyxDQUFDO1FBQ0Ysc0JBQWlCLEdBQUcsQ0FBQyxLQUFtRCxFQUFFLEVBQUU7WUFD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UUFDbEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5QixDQUFDO0NBQ0YsQ0FBQTtBQWhPQztJQURDLGlCQUFVOztxREFDZTtBQXlGMUI7SUFEQyxhQUFNOzt5REFHTDtBQWpHRSxtQkFBbUI7SUFEeEIscUJBQVE7R0FDSCxtQkFBbUIsQ0FzT3hCO0FBRUQsa0JBQWUsbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbmltcG9ydCB7IGFjdGlvbiwgb2JzZXJ2YWJsZSB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQgRGlzcGxheSBmcm9tIFwiLi9kaXNwbGF5XCI7XG5pbXBvcnQgU3RhdHVzIGZyb20gXCIuL3N0YXR1c1wiO1xuaW1wb3J0IHR5cGUgT3V0cHV0U3RvcmUgZnJvbSBcIi4uLy4uL3N0b3JlL291dHB1dFwiO1xuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi8uLi9rZXJuZWxcIjtcbmNvbnN0IFNDUk9MTF9IRUlHSFQgPSA2MDA7XG50eXBlIFByb3BzID0ge1xuICBzdG9yZTogT3V0cHV0U3RvcmU7XG4gIGtlcm5lbDogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgZGVzdHJveTogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueTtcbiAgc2hvd1Jlc3VsdDogYm9vbGVhbjtcbn07XG5cbkBvYnNlcnZlclxuY2xhc3MgUmVzdWx0Vmlld0NvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBlbDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBjb250YWluZXJUb29sdGlwID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgYnV0dG9uVG9vbHRpcCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIGNsb3NlVG9vbHRpcCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIEBvYnNlcnZhYmxlXG4gIGV4cGFuZGVkOiBib29sZWFuID0gZmFsc2U7XG4gIGdldEFsbFRleHQgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLmVsKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWwuaW5uZXJUZXh0ID8gdGhpcy5lbC5pbm5lclRleHQgOiBcIlwiO1xuICB9O1xuICBoYW5kbGVDbGljayA9IChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRGl2RWxlbWVudCwgTW91c2VFdmVudD4pID0+IHtcbiAgICBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5KSB7XG4gICAgICB0aGlzLm9wZW5JbkVkaXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvcHlUb0NsaXBib2FyZCgpO1xuICAgIH1cbiAgfTtcbiAgY2hlY2tGb3JTZWxlY3Rpb24gPSAoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQsIE1vdXNlRXZlbnQ+KSA9PiB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XG5cbiAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi50b1N0cmluZygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFuZGxlQ2xpY2soZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgY29weVRvQ2xpcGJvYXJkID0gKCkgPT4ge1xuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRoaXMuZ2V0QWxsVGV4dCgpKTtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyhcIkNvcGllZCB0byBjbGlwYm9hcmRcIik7XG4gIH07XG4gIG9wZW5JbkVkaXRvciA9ICgpID0+IHtcbiAgICBhdG9tLndvcmtzcGFjZVxuICAgICAgLm9wZW4oKVxuICAgICAgLnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLmluc2VydFRleHQodGhpcy5nZXRBbGxUZXh0KCkpKTtcbiAgfTtcbiAgYWRkQ29weVRvb2x0aXAgPSAoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGNvbXA6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgKSA9PiB7XG4gICAgaWYgKCFlbGVtZW50IHx8ICFjb21wLmRpc3Bvc2FibGVzIHx8IGNvbXAuZGlzcG9zYWJsZXMuc2l6ZSA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29tcC5hZGQoXG4gICAgICBhdG9tLnRvb2x0aXBzLmFkZChlbGVtZW50LCB7XG4gICAgICAgIHRpdGxlOiBgQ2xpY2sgdG8gY29weSxcbiAgICAgICAgICAke1xuICAgICAgICAgICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIiA/IFwiQ21kXCIgOiBcIkN0cmxcIlxuICAgICAgICAgIH0rQ2xpY2sgdG8gb3BlbiBpbiBlZGl0b3JgLFxuICAgICAgfSlcbiAgICApO1xuICB9O1xuICBhZGRDbG9zZUJ1dHRvblRvb2x0aXAgPSAoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGNvbXA6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgKSA9PiB7XG4gICAgaWYgKCFlbGVtZW50IHx8ICFjb21wLmRpc3Bvc2FibGVzIHx8IGNvbXAuZGlzcG9zYWJsZXMuc2l6ZSA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29tcC5hZGQoXG4gICAgICBhdG9tLnRvb2x0aXBzLmFkZChlbGVtZW50LCB7XG4gICAgICAgIHRpdGxlOiB0aGlzLnByb3BzLnN0b3JlLmV4ZWN1dGlvbkNvdW50XG4gICAgICAgICAgPyBgQ2xvc2UgKE91dFske3RoaXMucHJvcHMuc3RvcmUuZXhlY3V0aW9uQ291bnR9XSlgXG4gICAgICAgICAgOiBcIkNsb3NlIHJlc3VsdFwiLFxuICAgICAgfSlcbiAgICApO1xuICB9O1xuICBhZGRDb3B5QnV0dG9uVG9vbHRpcCA9IChlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQpID0+IHtcbiAgICB0aGlzLmFkZENvcHlUb29sdGlwKGVsZW1lbnQsIHRoaXMuYnV0dG9uVG9vbHRpcCk7XG4gIH07XG4gIG9uV2hlZWwgPSAoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgIGNvbnN0IHNjcm9sbEhlaWdodCA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgICAgY29uc3QgY2xpZW50V2lkdGggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgY29uc3Qgc2Nyb2xsV2lkdGggPSBlbGVtZW50LnNjcm9sbFdpZHRoO1xuICAgICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICBjb25zdCBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgY29uc3QgYXRUb3AgPSBzY3JvbGxUb3AgIT09IDAgJiYgZXZlbnQuZGVsdGFZIDwgMDtcbiAgICAgIGNvbnN0IGF0TGVmdCA9IHNjcm9sbExlZnQgIT09IDAgJiYgZXZlbnQuZGVsdGFYIDwgMDtcbiAgICAgIGNvbnN0IGF0Qm90dG9tID1cbiAgICAgICAgc2Nyb2xsVG9wICE9PSBzY3JvbGxIZWlnaHQgLSBjbGllbnRIZWlnaHQgJiYgZXZlbnQuZGVsdGFZID4gMDtcbiAgICAgIGNvbnN0IGF0UmlnaHQgPVxuICAgICAgICBzY3JvbGxMZWZ0ICE9PSBzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoICYmIGV2ZW50LmRlbHRhWCA+IDA7XG5cbiAgICAgIGlmIChjbGllbnRIZWlnaHQgPCBzY3JvbGxIZWlnaHQgJiYgKGF0VG9wIHx8IGF0Qm90dG9tKSkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoY2xpZW50V2lkdGggPCBzY3JvbGxXaWR0aCAmJiAoYXRMZWZ0IHx8IGF0UmlnaHQpKSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG4gIEBhY3Rpb25cbiAgdG9nZ2xlRXhwYW5kID0gKCkgPT4ge1xuICAgIHRoaXMuZXhwYW5kZWQgPSAhdGhpcy5leHBhbmRlZDtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBvdXRwdXRzLCBzdGF0dXMsIGlzUGxhaW4sIHBvc2l0aW9uIH0gPSB0aGlzLnByb3BzLnN0b3JlO1xuICAgIGNvbnN0IGlubGluZVN0eWxlOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0ge1xuICAgICAgbWFyZ2luTGVmdDogYCR7cG9zaXRpb24ubGluZUxlbmd0aCArIHBvc2l0aW9uLmNoYXJXaWR0aH1weGAsXG4gICAgICBtYXJnaW5Ub3A6IGAtJHtwb3NpdGlvbi5saW5lSGVpZ2h0fXB4YCxcbiAgICAgIHVzZXJTZWxlY3Q6IFwidGV4dFwiLFxuICAgIH07XG5cbiAgICBpZiAob3V0cHV0cy5sZW5ndGggPT09IDAgfHwgdGhpcy5wcm9wcy5zaG93UmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgY29uc3Qga2VybmVsID0gdGhpcy5wcm9wcy5rZXJuZWw7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U3RhdHVzXG4gICAgICAgICAgc3RhdHVzPXtcbiAgICAgICAgICAgIGtlcm5lbCAmJiBrZXJuZWwuZXhlY3V0aW9uU3RhdGUgIT09IFwiYnVzeVwiICYmIHN0YXR1cyA9PT0gXCJydW5uaW5nXCJcbiAgICAgICAgICAgICAgPyBcImVycm9yXCJcbiAgICAgICAgICAgICAgOiBzdGF0dXNcbiAgICAgICAgICB9XG4gICAgICAgICAgc3R5bGU9e2lubGluZVN0eWxlfVxuICAgICAgICAvPlxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdlxuICAgICAgICBjbGFzc05hbWU9e2Ake1xuICAgICAgICAgIGlzUGxhaW4gPyBcImlubGluZS1jb250YWluZXJcIiA6IFwibXVsdGlsaW5lLWNvbnRhaW5lclwiXG4gICAgICAgIH0gbmF0aXZlLWtleS1iaW5kaW5nc2B9XG4gICAgICAgIHRhYkluZGV4PXstMX1cbiAgICAgICAgb25DbGljaz17aXNQbGFpbiA/IHRoaXMuY2hlY2tGb3JTZWxlY3Rpb24gOiB1bmRlZmluZWR9XG4gICAgICAgIHN0eWxlPXtcbiAgICAgICAgICBpc1BsYWluXG4gICAgICAgICAgICA/IGlubGluZVN0eWxlXG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogYCR7cG9zaXRpb24uZWRpdG9yV2lkdGggLSAyICogcG9zaXRpb24uY2hhcldpZHRofXB4YCxcbiAgICAgICAgICAgICAgICBtYXJnaW46IFwiMHB4XCIsXG4gICAgICAgICAgICAgICAgdXNlclNlbGVjdDogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBoeWRyb2dlbi13cmFwb3V0cHV0PXthdG9tLmNvbmZpZy5nZXQoYEh5ZHJvZ2VuLndyYXBPdXRwdXRgKS50b1N0cmluZygpfVxuICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3NOYW1lPVwiaHlkcm9nZW5fY2VsbF9kaXNwbGF5XCJcbiAgICAgICAgICByZWY9eyhyZWYpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVmKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWwgPSByZWY7XG4gICAgICAgICAgICBpc1BsYWluXG4gICAgICAgICAgICAgID8gdGhpcy5hZGRDb3B5VG9vbHRpcChyZWYsIHRoaXMuY29udGFpbmVyVG9vbHRpcClcbiAgICAgICAgICAgICAgOiB0aGlzLmNvbnRhaW5lclRvb2x0aXAuZGlzcG9zZSgpO1xuXG4gICAgICAgICAgICAvLyBBcyBvZiB0aGlzIHdyaXRpbmcgUmVhY3QncyBldmVudCBoYW5kbGVyIGRvZXNuJ3QgcHJvcGVybHkgaGFuZGxlXG4gICAgICAgICAgICAvLyBldmVudC5zdG9wUHJvcGFnYXRpb24oKSBmb3IgZXZlbnRzIG91dHNpZGUgdGhlIFJlYWN0IGNvbnRleHQuXG4gICAgICAgICAgICBpZiAoIXRoaXMuZXhwYW5kZWQgJiYgIWlzUGxhaW4gJiYgcmVmKSB7XG4gICAgICAgICAgICAgIHJlZi5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5vbldoZWVsKHJlZiksIHtcbiAgICAgICAgICAgICAgICBwYXNzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9fVxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBtYXhIZWlnaHQ6IHRoaXMuZXhwYW5kZWQgPyBcIjEwMCVcIiA6IGAke1NDUk9MTF9IRUlHSFR9cHhgLFxuICAgICAgICAgICAgb3ZlcmZsb3dZOiBcImF1dG9cIixcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAge291dHB1dHMubWFwKChvdXRwdXQsIGluZGV4KSA9PiAoXG4gICAgICAgICAgICA8RGlzcGxheSBvdXRwdXQ9e291dHB1dH0ga2V5PXtpbmRleH0gLz5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtpc1BsYWluID8gbnVsbCA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvb2xiYXJcIj5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaWNvbiBpY29uLXhcIlxuICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLmRlc3Ryb3l9XG4gICAgICAgICAgICAgIHJlZj17KHJlZikgPT4gdGhpcy5hZGRDbG9zZUJ1dHRvblRvb2x0aXAocmVmLCB0aGlzLmNsb3NlVG9vbHRpcCl9XG4gICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMC4yNWVtXCIsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICB7dGhpcy5nZXRBbGxUZXh0KCkubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImljb24gaWNvbi1jbGlwcHlcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9XG4gICAgICAgICAgICAgICAgcmVmPXt0aGlzLmFkZENvcHlCdXR0b25Ub29sdGlwfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAgICAgIHt0aGlzLmVsICYmIHRoaXMuZWwuc2Nyb2xsSGVpZ2h0ID4gU0NST0xMX0hFSUdIVCA/IChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGljb24gaWNvbi0ke3RoaXMuZXhwYW5kZWQgPyBcImZvbGRcIiA6IFwidW5mb2xkXCJ9YH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnRvZ2dsZUV4cGFuZH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIHNjcm9sbFRvQm90dG9tKCkge1xuICAgIGlmIChcbiAgICAgICF0aGlzLmVsIHx8XG4gICAgICB0aGlzLmV4cGFuZGVkID09PSB0cnVlIHx8XG4gICAgICB0aGlzLnByb3BzLnN0b3JlLmlzUGxhaW4gPT09IHRydWUgfHxcbiAgICAgIGF0b20uY29uZmlnLmdldChgSHlkcm9nZW4uYXV0b1Njcm9sbGApID09PSBmYWxzZVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzY3JvbGxIZWlnaHQgPSB0aGlzLmVsLnNjcm9sbEhlaWdodDtcbiAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmVsLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCBtYXhTY3JvbGxUb3AgPSBzY3JvbGxIZWlnaHQgLSBoZWlnaHQ7XG4gICAgdGhpcy5lbC5zY3JvbGxUb3AgPSBtYXhTY3JvbGxUb3AgPiAwID8gbWF4U2Nyb2xsVG9wIDogMDtcbiAgfVxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gIH1cblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLmNvbnRhaW5lclRvb2x0aXAuZGlzcG9zZSgpO1xuICAgIHRoaXMuYnV0dG9uVG9vbHRpcC5kaXNwb3NlKCk7XG4gICAgdGhpcy5jbG9zZVRvb2x0aXAuZGlzcG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlc3VsdFZpZXdDb21wb25lbnQ7XG4iXX0=