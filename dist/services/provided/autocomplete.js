"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideAutocompleteResults = void 0;
const head_1 = __importDefault(require("lodash/head"));
const anser_1 = __importDefault(require("anser"));
const utils_1 = require("../../utils");
const iconHTML = `<img src='${__dirname}/../../../static/logo.svg' style='width: 100%;'>`;
const regexes = {
    r: /([^\W\d]|\.)[\w$.]*$/,
    python: /([^\W\d]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/,
    php: /[$A-Z_a-z\x7f-\xff][\w\x7f-\xff]*$/,
};
function parseCompletions(results, prefix) {
    const { matches, metadata } = results;
    const cursor_start = (0, utils_1.char_idx_to_js_idx)(results.cursor_start, prefix);
    const cursor_end = (0, utils_1.char_idx_to_js_idx)(results.cursor_end, prefix);
    if (metadata && metadata._jupyter_types_experimental) {
        const comps = metadata._jupyter_types_experimental;
        if (comps.length > 0 && comps[0].text) {
            return comps.map((match) => {
                const text = match.text;
                const start = match.start && match.end ? match.start : cursor_start;
                const end = match.start && match.end ? match.end : cursor_end;
                const replacementPrefix = prefix.slice(start, end);
                const replacedText = prefix.slice(0, start) + text;
                const type = match.type;
                return {
                    text,
                    replacementPrefix,
                    replacedText,
                    iconHTML: !type || type === "<unknown>" ? iconHTML : undefined,
                    type,
                };
            });
        }
    }
    const replacementPrefix = prefix.slice(cursor_start, cursor_end);
    return matches.map((match) => {
        const text = match;
        const replacedText = prefix.slice(0, cursor_start) + text;
        return {
            text,
            replacementPrefix,
            replacedText,
            iconHTML,
        };
    });
}
function provideAutocompleteResults(store) {
    const autocompleteProvider = {
        enabled: atom.config.get("Hydrogen.autocomplete"),
        selector: ".source",
        disableForSelector: ".comment",
        inclusionPriority: 1,
        suggestionPriority: atom.config.get("Hydrogen.autocompleteSuggestionPriority"),
        excludeLowerPriority: false,
        suggestionDetailsEnabled: atom.config.get("Hydrogen.showInspectorResultsInAutocomplete"),
        getSuggestions({ editor, bufferPosition, prefix }) {
            if (!this.enabled) {
                return null;
            }
            const kernel = store.kernel;
            if (!kernel || kernel.executionState !== "idle") {
                return null;
            }
            const line = editor.getTextInBufferRange([
                [bufferPosition.row, 0],
                bufferPosition,
            ]);
            const regex = regexes[kernel.language];
            if (regex) {
                prefix = (0, head_1.default)(line.match(regex)) || "";
            }
            else {
                prefix = line;
            }
            if (prefix.trimRight().length < prefix.length) {
                return null;
            }
            let minimumWordLength = atom.config.get("autocomplete-plus.minimumWordLength");
            if (typeof minimumWordLength !== "number") {
                minimumWordLength = 3;
            }
            if (prefix.trim().length < minimumWordLength) {
                return null;
            }
            (0, utils_1.log)("autocompleteProvider: request:", line, bufferPosition, prefix);
            const promise = new Promise((resolve) => {
                kernel.complete(prefix, (results) => {
                    return resolve(parseCompletions(results, prefix));
                });
            });
            return Promise.race([promise, this.timeout()]);
        },
        getSuggestionDetailsOnSelect({ text, replacementPrefix, replacedText, iconHTML, type, }) {
            if (!this.suggestionDetailsEnabled) {
                return null;
            }
            const kernel = store.kernel;
            if (!kernel || kernel.executionState !== "idle") {
                return null;
            }
            const promise = new Promise((resolve) => {
                kernel.inspect(replacedText, replacedText.length, ({ found, data }) => {
                    if (!found || !data["text/plain"]) {
                        resolve(null);
                        return;
                    }
                    const description = anser_1.default.ansiToText(data["text/plain"]);
                    resolve({
                        text,
                        replacementPrefix,
                        replacedText,
                        iconHTML,
                        type,
                        description,
                    });
                });
            });
            return Promise.race([promise, this.timeout()]);
        },
        timeout() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(null);
                }, 1000);
            });
        },
    };
    store.subscriptions.add(atom.config.observe("Hydrogen.autocomplete", (v) => {
        autocompleteProvider.enabled = v;
    }), atom.config.observe("Hydrogen.autocompleteSuggestionPriority", (v) => {
        autocompleteProvider.suggestionPriority = v;
    }), atom.config.observe("Hydrogen.showInspectorResultsInAutocomplete", (v) => {
        autocompleteProvider.suggestionDetailsEnabled = v;
    }));
    return autocompleteProvider;
}
exports.provideAutocompleteResults = provideAutocompleteResults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL3NlcnZpY2VzL3Byb3ZpZGVkL2F1dG9jb21wbGV0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1REFBK0I7QUFDL0Isa0RBQTBCO0FBQzFCLHVDQUFzRDtBQWV0RCxNQUFNLFFBQVEsR0FBRyxhQUFhLFNBQVMsa0RBQWtELENBQUM7QUFDMUYsTUFBTSxPQUFPLEdBQUc7SUFFZCxDQUFDLEVBQUUsc0JBQXNCO0lBRXpCLE1BQU0sRUFBRSwrQ0FBK0M7SUFFdkQsR0FBRyxFQUFFLG9DQUFvQztDQUMxQyxDQUFDO0FBRUYsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFzQixFQUFFLE1BQWM7SUFDOUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFHdEMsTUFBTSxZQUFZLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sVUFBVSxHQUFHLElBQUEsMEJBQWtCLEVBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUVsRSxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsMkJBQTJCLEVBQUU7UUFDcEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLDJCQUEyQixDQUFDO1FBRW5ELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtZQUNyQyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDeEIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FB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eUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ25FLG9CQUFvQixDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUM5QyxDQUFDLENBQUMsRUFDRixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyw2Q0FBNkMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ3ZFLG9CQUFvQixDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQztJQUNwRCxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0YsT0FBTyxvQkFBb0IsQ0FBQztBQUM5QixDQUFDO0FBckhELGdFQXFIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dG9jb21wbGV0ZVByb3ZpZGVyIH0gZnJvbSBcImF0b20vYXV0b2NvbXBsZXRlLXBsdXNcIjtcbmltcG9ydCBoZWFkIGZyb20gXCJsb2Rhc2gvaGVhZFwiO1xuaW1wb3J0IEFuc2VyIGZyb20gXCJhbnNlclwiO1xuaW1wb3J0IHsgbG9nLCBjaGFyX2lkeF90b19qc19pZHggfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tIFwiLi4vLi4vc3RvcmVcIjtcbnR5cGUgQ29tcGxldGVSZXBseSA9IHtcbiAgbWF0Y2hlczogQXJyYXk8c3RyaW5nPjtcbiAgY3Vyc29yX3N0YXJ0OiBudW1iZXI7XG4gIGN1cnNvcl9lbmQ6IG51bWJlcjtcbiAgbWV0YWRhdGE/OiB7XG4gICAgX2p1cHl0ZXJfdHlwZXNfZXhwZXJpbWVudGFsPzogQXJyYXk8e1xuICAgICAgc3RhcnQ/OiBudW1iZXI7XG4gICAgICBlbmQ/OiBudW1iZXI7XG4gICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICB0eXBlPzogc3RyaW5nO1xuICAgIH0+O1xuICB9O1xufTtcbmNvbnN0IGljb25IVE1MID0gYDxpbWcgc3JjPScke19fZGlybmFtZX0vLi4vLi4vLi4vc3RhdGljL2xvZ28uc3ZnJyBzdHlsZT0nd2lkdGg6IDEwMCU7Jz5gO1xuY29uc3QgcmVnZXhlcyA9IHtcbiAgLy8gcHJldHR5IGRvZGd5LCBhZGFwdGVkIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODM5NjY1OFxuICByOiAvKFteXFxXXFxkXXxcXC4pW1xcdyQuXSokLyxcbiAgLy8gYWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzU0NzQwMDhcbiAgcHl0aG9uOiAvKFteXFxXXFxkXXxbXFx1MDBBMC1cXHVGRkZGXSlbXFx3LlxcdTAwQTAtXFx1RkZGRl0qJC8sXG4gIC8vIGFkYXB0ZWQgZnJvbSBodHRwOi8vcGhwLm5ldC9tYW51YWwvZW4vbGFuZ3VhZ2UudmFyaWFibGVzLmJhc2ljcy5waHBcbiAgcGhwOiAvWyRBLVpfYS16XFx4N2YtXFx4ZmZdW1xcd1xceDdmLVxceGZmXSokLyxcbn07XG5cbmZ1bmN0aW9uIHBhcnNlQ29tcGxldGlvbnMocmVzdWx0czogQ29tcGxldGVSZXBseSwgcHJlZml4OiBzdHJpbmcpIHtcbiAgY29uc3QgeyBtYXRjaGVzLCBtZXRhZGF0YSB9ID0gcmVzdWx0cztcbiAgLy8gQE5PVEU6IFRoaXMgY2FuIG1ha2UgaW52YWxpZCBgcmVwbGFjZWRQcmVmaXhgIGFuZCBgcmVwbGFjZWRUZXh0YCB3aGVuIGEgbGluZSBpbmNsdWRlcyB1bmljb2RlIGNoYXJhY3RlcnNcbiAgLy8gQFRPRE8gKEBhdmlhdGVzayk6IFVzZSBgUmVnZXhgIHRvIGRldGVjdCB0aGVtIHJlZ2FyZGxlc3Mgb2YgdGhlIGByZXN1bHRzLmN1cnNvcl8qYCBmZWVkYmFja3MgZnJvbSBrZXJuZWxzXG4gIGNvbnN0IGN1cnNvcl9zdGFydCA9IGNoYXJfaWR4X3RvX2pzX2lkeChyZXN1bHRzLmN1cnNvcl9zdGFydCwgcHJlZml4KTtcbiAgY29uc3QgY3Vyc29yX2VuZCA9IGNoYXJfaWR4X3RvX2pzX2lkeChyZXN1bHRzLmN1cnNvcl9lbmQsIHByZWZpeCk7XG5cbiAgaWYgKG1ldGFkYXRhICYmIG1ldGFkYXRhLl9qdXB5dGVyX3R5cGVzX2V4cGVyaW1lbnRhbCkge1xuICAgIGNvbnN0IGNvbXBzID0gbWV0YWRhdGEuX2p1cHl0ZXJfdHlwZXNfZXhwZXJpbWVudGFsO1xuXG4gICAgaWYgKGNvbXBzLmxlbmd0aCA+IDAgJiYgY29tcHNbMF0udGV4dCkge1xuICAgICAgcmV0dXJuIGNvbXBzLm1hcCgobWF0Y2gpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoLnRleHQ7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbWF0Y2guc3RhcnQgJiYgbWF0Y2guZW5kID8gbWF0Y2guc3RhcnQgOiBjdXJzb3Jfc3RhcnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IG1hdGNoLnN0YXJ0ICYmIG1hdGNoLmVuZCA/IG1hdGNoLmVuZCA6IGN1cnNvcl9lbmQ7XG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50UHJlZml4ID0gcHJlZml4LnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgICBjb25zdCByZXBsYWNlZFRleHQgPSBwcmVmaXguc2xpY2UoMCwgc3RhcnQpICsgdGV4dDtcbiAgICAgICAgY29uc3QgdHlwZSA9IG1hdGNoLnR5cGU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgICAgICByZXBsYWNlZFRleHQsXG4gICAgICAgICAgaWNvbkhUTUw6ICF0eXBlIHx8IHR5cGUgPT09IFwiPHVua25vd24+XCIgPyBpY29uSFRNTCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0eXBlLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVwbGFjZW1lbnRQcmVmaXggPSBwcmVmaXguc2xpY2UoY3Vyc29yX3N0YXJ0LCBjdXJzb3JfZW5kKTtcbiAgcmV0dXJuIG1hdGNoZXMubWFwKChtYXRjaCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBtYXRjaDtcbiAgICBjb25zdCByZXBsYWNlZFRleHQgPSBwcmVmaXguc2xpY2UoMCwgY3Vyc29yX3N0YXJ0KSArIHRleHQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQsXG4gICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgIHJlcGxhY2VkVGV4dCxcbiAgICAgIGljb25IVE1MLFxuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoc3RvcmU6IFN0b3JlKTogQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICBjb25zdCBhdXRvY29tcGxldGVQcm92aWRlciA9IHtcbiAgICBlbmFibGVkOiBhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5hdXRvY29tcGxldGVcIiksXG4gICAgc2VsZWN0b3I6IFwiLnNvdXJjZVwiLFxuICAgIGRpc2FibGVGb3JTZWxlY3RvcjogXCIuY29tbWVudFwiLFxuICAgIC8vIFRoZSBkZWZhdWx0IHByb3ZpZGVyIGhhcyBhbiBpbmNsdXNpb24gcHJpb3JpdHkgb2YgMC5cbiAgICBpbmNsdXNpb25Qcmlvcml0eTogMSxcbiAgICAvLyBUaGUgZGVmYXVsdCBwcm92aWRlciBoYXMgYSBzdWdnZXN0aW9uIHByaW9yaXR5IG9mIDEuXG4gICAgc3VnZ2VzdGlvblByaW9yaXR5OiBhdG9tLmNvbmZpZy5nZXQoXG4gICAgICBcIkh5ZHJvZ2VuLmF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25Qcmlvcml0eVwiXG4gICAgKSxcbiAgICAvLyBJdCB3b24ndCBzdXBwcmVzcyBwcm92aWRlcnMgd2l0aCBsb3dlciBwcmlvcml0eS5cbiAgICBleGNsdWRlTG93ZXJQcmlvcml0eTogZmFsc2UsXG4gICAgc3VnZ2VzdGlvbkRldGFpbHNFbmFibGVkOiBhdG9tLmNvbmZpZy5nZXQoXG4gICAgICBcIkh5ZHJvZ2VuLnNob3dJbnNwZWN0b3JSZXN1bHRzSW5BdXRvY29tcGxldGVcIlxuICAgICksXG5cbiAgICAvLyBSZXF1aXJlZDogUmV0dXJuIGEgcHJvbWlzZSwgYW4gYXJyYXkgb2Ygc3VnZ2VzdGlvbnMsIG9yIG51bGwuXG4gICAgZ2V0U3VnZ2VzdGlvbnMoeyBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXggfSkge1xuICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBrZXJuZWwgPSBzdG9yZS5rZXJuZWw7XG4gICAgICBpZiAoIWtlcm5lbCB8fCBrZXJuZWwuZXhlY3V0aW9uU3RhdGUgIT09IFwiaWRsZVwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbXG4gICAgICAgIFtidWZmZXJQb3NpdGlvbi5yb3csIDBdLFxuICAgICAgICBidWZmZXJQb3NpdGlvbixcbiAgICAgIF0pO1xuICAgICAgY29uc3QgcmVnZXggPSByZWdleGVzW2tlcm5lbC5sYW5ndWFnZV07XG5cbiAgICAgIGlmIChyZWdleCkge1xuICAgICAgICBwcmVmaXggPSBoZWFkKGxpbmUubWF0Y2gocmVnZXgpKSB8fCBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJlZml4ID0gbGluZTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIGlmIGN1cnNvciBpcyBhdCB3aGl0ZXNwYWNlXG4gICAgICBpZiAocHJlZml4LnRyaW1SaWdodCgpLmxlbmd0aCA8IHByZWZpeC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBsZXQgbWluaW11bVdvcmRMZW5ndGggPSBhdG9tLmNvbmZpZy5nZXQoXG4gICAgICAgIFwiYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGhcIlxuICAgICAgKTtcblxuICAgICAgaWYgKHR5cGVvZiBtaW5pbXVtV29yZExlbmd0aCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICBtaW5pbXVtV29yZExlbmd0aCA9IDM7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcmVmaXgudHJpbSgpLmxlbmd0aCA8IG1pbmltdW1Xb3JkTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgbG9nKFwiYXV0b2NvbXBsZXRlUHJvdmlkZXI6IHJlcXVlc3Q6XCIsIGxpbmUsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXgpO1xuICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGtlcm5lbC5jb21wbGV0ZShwcmVmaXgsIChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocGFyc2VDb21wbGV0aW9ucyhyZXN1bHRzLCBwcmVmaXgpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoW3Byb21pc2UsIHRoaXMudGltZW91dCgpXSk7XG4gICAgfSxcblxuICAgIGdldFN1Z2dlc3Rpb25EZXRhaWxzT25TZWxlY3Qoe1xuICAgICAgdGV4dCxcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgcmVwbGFjZWRUZXh0LFxuICAgICAgaWNvbkhUTUwsXG4gICAgICB0eXBlLFxuICAgIH0pIHtcbiAgICAgIGlmICghdGhpcy5zdWdnZXN0aW9uRGV0YWlsc0VuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBrZXJuZWwgPSBzdG9yZS5rZXJuZWw7XG4gICAgICBpZiAoIWtlcm5lbCB8fCBrZXJuZWwuZXhlY3V0aW9uU3RhdGUgIT09IFwiaWRsZVwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGtlcm5lbC5pbnNwZWN0KHJlcGxhY2VkVGV4dCwgcmVwbGFjZWRUZXh0Lmxlbmd0aCwgKHsgZm91bmQsIGRhdGEgfSkgPT4ge1xuICAgICAgICAgIGlmICghZm91bmQgfHwgIWRhdGFbXCJ0ZXh0L3BsYWluXCJdKSB7XG4gICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gQW5zZXIuYW5zaVRvVGV4dChkYXRhW1widGV4dC9wbGFpblwiXSk7XG4gICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgICAgICByZXBsYWNlZFRleHQsXG4gICAgICAgICAgICBpY29uSFRNTCxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoW3Byb21pc2UsIHRoaXMudGltZW91dCgpXSk7XG4gICAgfSxcblxuICAgIHRpbWVvdXQoKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uYXV0b2NvbXBsZXRlXCIsICh2KSA9PiB7XG4gICAgICBhdXRvY29tcGxldGVQcm92aWRlci5lbmFibGVkID0gdjtcbiAgICB9KSxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uYXV0b2NvbXBsZXRlU3VnZ2VzdGlvblByaW9yaXR5XCIsICh2KSA9PiB7XG4gICAgICBhdXRvY29tcGxldGVQcm92aWRlci5zdWdnZXN0aW9uUHJpb3JpdHkgPSB2O1xuICAgIH0pLFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zaG93SW5zcGVjdG9yUmVzdWx0c0luQXV0b2NvbXBsZXRlXCIsICh2KSA9PiB7XG4gICAgICBhdXRvY29tcGxldGVQcm92aWRlci5zdWdnZXN0aW9uRGV0YWlsc0VuYWJsZWQgPSB2O1xuICAgIH0pXG4gICk7XG4gIHJldHVybiBhdXRvY29tcGxldGVQcm92aWRlcjtcbn1cbiJdfQ==