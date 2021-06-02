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
    const cursor_start = utils_1.char_idx_to_js_idx(results.cursor_start, prefix);
    const cursor_end = utils_1.char_idx_to_js_idx(results.cursor_end, prefix);
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
                prefix = head_1.default(line.match(regex)) || "";
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
            utils_1.log("autocompleteProvider: request:", line, bufferPosition, prefix);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL3NlcnZpY2VzL3Byb3ZpZGVkL2F1dG9jb21wbGV0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1REFBK0I7QUFDL0Isa0RBQTBCO0FBQzFCLHVDQUFzRDtBQWV0RCxNQUFNLFFBQVEsR0FBRyxhQUFhLFNBQVMsa0RBQWtELENBQUM7QUFDMUYsTUFBTSxPQUFPLEdBQUc7SUFFZCxDQUFDLEVBQUUsc0JBQXNCO0lBRXpCLE1BQU0sRUFBRSwrQ0FBK0M7SUFFdkQsR0FBRyxFQUFFLG9DQUFvQztDQUMxQyxDQUFDO0FBRUYsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFzQixFQUFFLE1BQWM7SUFDOUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFHdEMsTUFBTSxZQUFZLEdBQUcsMEJBQWtCLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN0RSxNQUFNLFVBQVUsR0FBRywwQkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRWxFLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQywyQkFBMkIsRUFBRTtRQUNwRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsMkJBQTJCLENBQUM7UUFFbkQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO1lBQ3JDLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUN6QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUN4QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FB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QUUsRUFBRTtRQUNuRSxvQkFBb0IsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLEVBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN2RSxvQkFBb0IsQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLENBQUM7SUFDcEQsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNGLE9BQU8sb0JBQW9CLENBQUM7QUFDOUIsQ0FBQztBQXJIRCxnRUFxSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRvY29tcGxldGVQcm92aWRlciB9IGZyb20gXCJhdG9tL2F1dG9jb21wbGV0ZS1wbHVzXCI7XHJcbmltcG9ydCBoZWFkIGZyb20gXCJsb2Rhc2gvaGVhZFwiO1xyXG5pbXBvcnQgQW5zZXIgZnJvbSBcImFuc2VyXCI7XHJcbmltcG9ydCB7IGxvZywgY2hhcl9pZHhfdG9fanNfaWR4IH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tIFwiLi4vLi4vc3RvcmVcIjtcclxudHlwZSBDb21wbGV0ZVJlcGx5ID0ge1xyXG4gIG1hdGNoZXM6IEFycmF5PHN0cmluZz47XHJcbiAgY3Vyc29yX3N0YXJ0OiBudW1iZXI7XHJcbiAgY3Vyc29yX2VuZDogbnVtYmVyO1xyXG4gIG1ldGFkYXRhPzoge1xyXG4gICAgX2p1cHl0ZXJfdHlwZXNfZXhwZXJpbWVudGFsPzogQXJyYXk8e1xyXG4gICAgICBzdGFydD86IG51bWJlcjtcclxuICAgICAgZW5kPzogbnVtYmVyO1xyXG4gICAgICB0ZXh0OiBzdHJpbmc7XHJcbiAgICAgIHR5cGU/OiBzdHJpbmc7XHJcbiAgICB9PjtcclxuICB9O1xyXG59O1xyXG5jb25zdCBpY29uSFRNTCA9IGA8aW1nIHNyYz0nJHtfX2Rpcm5hbWV9Ly4uLy4uLy4uL3N0YXRpYy9sb2dvLnN2Zycgc3R5bGU9J3dpZHRoOiAxMDAlOyc+YDtcclxuY29uc3QgcmVnZXhlcyA9IHtcclxuICAvLyBwcmV0dHkgZG9kZ3ksIGFkYXB0ZWQgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84Mzk2NjU4XHJcbiAgcjogLyhbXlxcV1xcZF18XFwuKVtcXHckLl0qJC8sXHJcbiAgLy8gYWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzU0NzQwMDhcclxuICBweXRob246IC8oW15cXFdcXGRdfFtcXHUwMEEwLVxcdUZGRkZdKVtcXHcuXFx1MDBBMC1cXHVGRkZGXSokLyxcclxuICAvLyBhZGFwdGVkIGZyb20gaHR0cDovL3BocC5uZXQvbWFudWFsL2VuL2xhbmd1YWdlLnZhcmlhYmxlcy5iYXNpY3MucGhwXHJcbiAgcGhwOiAvWyRBLVpfYS16XFx4N2YtXFx4ZmZdW1xcd1xceDdmLVxceGZmXSokLyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlQ29tcGxldGlvbnMocmVzdWx0czogQ29tcGxldGVSZXBseSwgcHJlZml4OiBzdHJpbmcpIHtcclxuICBjb25zdCB7IG1hdGNoZXMsIG1ldGFkYXRhIH0gPSByZXN1bHRzO1xyXG4gIC8vIEBOT1RFOiBUaGlzIGNhbiBtYWtlIGludmFsaWQgYHJlcGxhY2VkUHJlZml4YCBhbmQgYHJlcGxhY2VkVGV4dGAgd2hlbiBhIGxpbmUgaW5jbHVkZXMgdW5pY29kZSBjaGFyYWN0ZXJzXHJcbiAgLy8gQFRPRE8gKEBhdmlhdGVzayk6IFVzZSBgUmVnZXhgIHRvIGRldGVjdCB0aGVtIHJlZ2FyZGxlc3Mgb2YgdGhlIGByZXN1bHRzLmN1cnNvcl8qYCBmZWVkYmFja3MgZnJvbSBrZXJuZWxzXHJcbiAgY29uc3QgY3Vyc29yX3N0YXJ0ID0gY2hhcl9pZHhfdG9fanNfaWR4KHJlc3VsdHMuY3Vyc29yX3N0YXJ0LCBwcmVmaXgpO1xyXG4gIGNvbnN0IGN1cnNvcl9lbmQgPSBjaGFyX2lkeF90b19qc19pZHgocmVzdWx0cy5jdXJzb3JfZW5kLCBwcmVmaXgpO1xyXG5cclxuICBpZiAobWV0YWRhdGEgJiYgbWV0YWRhdGEuX2p1cHl0ZXJfdHlwZXNfZXhwZXJpbWVudGFsKSB7XHJcbiAgICBjb25zdCBjb21wcyA9IG1ldGFkYXRhLl9qdXB5dGVyX3R5cGVzX2V4cGVyaW1lbnRhbDtcclxuXHJcbiAgICBpZiAoY29tcHMubGVuZ3RoID4gMCAmJiBjb21wc1swXS50ZXh0KSB7XHJcbiAgICAgIHJldHVybiBjb21wcy5tYXAoKG1hdGNoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoLnRleHQ7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5zdGFydCAmJiBtYXRjaC5lbmQgPyBtYXRjaC5zdGFydCA6IGN1cnNvcl9zdGFydDtcclxuICAgICAgICBjb25zdCBlbmQgPSBtYXRjaC5zdGFydCAmJiBtYXRjaC5lbmQgPyBtYXRjaC5lbmQgOiBjdXJzb3JfZW5kO1xyXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50UHJlZml4ID0gcHJlZml4LnNsaWNlKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIGNvbnN0IHJlcGxhY2VkVGV4dCA9IHByZWZpeC5zbGljZSgwLCBzdGFydCkgKyB0ZXh0O1xyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBtYXRjaC50eXBlO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0ZXh0LFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXHJcbiAgICAgICAgICByZXBsYWNlZFRleHQsXHJcbiAgICAgICAgICBpY29uSFRNTDogIXR5cGUgfHwgdHlwZSA9PT0gXCI8dW5rbm93bj5cIiA/IGljb25IVE1MIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgdHlwZSxcclxuICAgICAgICB9O1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHJlcGxhY2VtZW50UHJlZml4ID0gcHJlZml4LnNsaWNlKGN1cnNvcl9zdGFydCwgY3Vyc29yX2VuZCk7XHJcbiAgcmV0dXJuIG1hdGNoZXMubWFwKChtYXRjaCkgPT4ge1xyXG4gICAgY29uc3QgdGV4dCA9IG1hdGNoO1xyXG4gICAgY29uc3QgcmVwbGFjZWRUZXh0ID0gcHJlZml4LnNsaWNlKDAsIGN1cnNvcl9zdGFydCkgKyB0ZXh0O1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGV4dCxcclxuICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXHJcbiAgICAgIHJlcGxhY2VkVGV4dCxcclxuICAgICAgaWNvbkhUTUwsXHJcbiAgICB9O1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoc3RvcmU6IFN0b3JlKTogQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gIGNvbnN0IGF1dG9jb21wbGV0ZVByb3ZpZGVyID0ge1xyXG4gICAgZW5hYmxlZDogYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uYXV0b2NvbXBsZXRlXCIpLFxyXG4gICAgc2VsZWN0b3I6IFwiLnNvdXJjZVwiLFxyXG4gICAgZGlzYWJsZUZvclNlbGVjdG9yOiBcIi5jb21tZW50XCIsXHJcbiAgICAvLyBUaGUgZGVmYXVsdCBwcm92aWRlciBoYXMgYW4gaW5jbHVzaW9uIHByaW9yaXR5IG9mIDAuXHJcbiAgICBpbmNsdXNpb25Qcmlvcml0eTogMSxcclxuICAgIC8vIFRoZSBkZWZhdWx0IHByb3ZpZGVyIGhhcyBhIHN1Z2dlc3Rpb24gcHJpb3JpdHkgb2YgMS5cclxuICAgIHN1Z2dlc3Rpb25Qcmlvcml0eTogYXRvbS5jb25maWcuZ2V0KFxyXG4gICAgICBcIkh5ZHJvZ2VuLmF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25Qcmlvcml0eVwiXHJcbiAgICApLFxyXG4gICAgLy8gSXQgd29uJ3Qgc3VwcHJlc3MgcHJvdmlkZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuXHJcbiAgICBleGNsdWRlTG93ZXJQcmlvcml0eTogZmFsc2UsXHJcbiAgICBzdWdnZXN0aW9uRGV0YWlsc0VuYWJsZWQ6IGF0b20uY29uZmlnLmdldChcclxuICAgICAgXCJIeWRyb2dlbi5zaG93SW5zcGVjdG9yUmVzdWx0c0luQXV0b2NvbXBsZXRlXCJcclxuICAgICksXHJcblxyXG4gICAgLy8gUmVxdWlyZWQ6IFJldHVybiBhIHByb21pc2UsIGFuIGFycmF5IG9mIHN1Z2dlc3Rpb25zLCBvciBudWxsLlxyXG4gICAgZ2V0U3VnZ2VzdGlvbnMoeyBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXggfSkge1xyXG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGtlcm5lbCA9IHN0b3JlLmtlcm5lbDtcclxuICAgICAgaWYgKCFrZXJuZWwgfHwga2VybmVsLmV4ZWN1dGlvblN0YXRlICE9PSBcImlkbGVcIikge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW1xyXG4gICAgICAgIFtidWZmZXJQb3NpdGlvbi5yb3csIDBdLFxyXG4gICAgICAgIGJ1ZmZlclBvc2l0aW9uLFxyXG4gICAgICBdKTtcclxuICAgICAgY29uc3QgcmVnZXggPSByZWdleGVzW2tlcm5lbC5sYW5ndWFnZV07XHJcblxyXG4gICAgICBpZiAocmVnZXgpIHtcclxuICAgICAgICBwcmVmaXggPSBoZWFkKGxpbmUubWF0Y2gocmVnZXgpKSB8fCBcIlwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZWZpeCA9IGxpbmU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJldHVybiBpZiBjdXJzb3IgaXMgYXQgd2hpdGVzcGFjZVxyXG4gICAgICBpZiAocHJlZml4LnRyaW1SaWdodCgpLmxlbmd0aCA8IHByZWZpeC5sZW5ndGgpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBsZXQgbWluaW11bVdvcmRMZW5ndGggPSBhdG9tLmNvbmZpZy5nZXQoXHJcbiAgICAgICAgXCJhdXRvY29tcGxldGUtcGx1cy5taW5pbXVtV29yZExlbmd0aFwiXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAodHlwZW9mIG1pbmltdW1Xb3JkTGVuZ3RoICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgbWluaW11bVdvcmRMZW5ndGggPSAzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocHJlZml4LnRyaW0oKS5sZW5ndGggPCBtaW5pbXVtV29yZExlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGxvZyhcImF1dG9jb21wbGV0ZVByb3ZpZGVyOiByZXF1ZXN0OlwiLCBsaW5lLCBidWZmZXJQb3NpdGlvbiwgcHJlZml4KTtcclxuICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAga2VybmVsLmNvbXBsZXRlKHByZWZpeCwgKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHBhcnNlQ29tcGxldGlvbnMocmVzdWx0cywgcHJlZml4KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCB0aGlzLnRpbWVvdXQoKV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTdWdnZXN0aW9uRGV0YWlsc09uU2VsZWN0KHtcclxuICAgICAgdGV4dCxcclxuICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXHJcbiAgICAgIHJlcGxhY2VkVGV4dCxcclxuICAgICAgaWNvbkhUTUwsXHJcbiAgICAgIHR5cGUsXHJcbiAgICB9KSB7XHJcbiAgICAgIGlmICghdGhpcy5zdWdnZXN0aW9uRGV0YWlsc0VuYWJsZWQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBrZXJuZWwgPSBzdG9yZS5rZXJuZWw7XHJcbiAgICAgIGlmICgha2VybmVsIHx8IGtlcm5lbC5leGVjdXRpb25TdGF0ZSAhPT0gXCJpZGxlXCIpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICBrZXJuZWwuaW5zcGVjdChyZXBsYWNlZFRleHQsIHJlcGxhY2VkVGV4dC5sZW5ndGgsICh7IGZvdW5kLCBkYXRhIH0pID0+IHtcclxuICAgICAgICAgIGlmICghZm91bmQgfHwgIWRhdGFbXCJ0ZXh0L3BsYWluXCJdKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IEFuc2VyLmFuc2lUb1RleHQoZGF0YVtcInRleHQvcGxhaW5cIl0pO1xyXG4gICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgIHRleHQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxyXG4gICAgICAgICAgICByZXBsYWNlZFRleHQsXHJcbiAgICAgICAgICAgIGljb25IVE1MLFxyXG4gICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmFjZShbcHJvbWlzZSwgdGhpcy50aW1lb3V0KCldKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGltZW91dCgpIHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5hdXRvY29tcGxldGVcIiwgKHYpID0+IHtcclxuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuZW5hYmxlZCA9IHY7XHJcbiAgICB9KSxcclxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5hdXRvY29tcGxldGVTdWdnZXN0aW9uUHJpb3JpdHlcIiwgKHYpID0+IHtcclxuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuc3VnZ2VzdGlvblByaW9yaXR5ID0gdjtcclxuICAgIH0pLFxyXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLnNob3dJbnNwZWN0b3JSZXN1bHRzSW5BdXRvY29tcGxldGVcIiwgKHYpID0+IHtcclxuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuc3VnZ2VzdGlvbkRldGFpbHNFbmFibGVkID0gdjtcclxuICAgIH0pXHJcbiAgKTtcclxuICByZXR1cm4gYXV0b2NvbXBsZXRlUHJvdmlkZXI7XHJcbn1cclxuIl19