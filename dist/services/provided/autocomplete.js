"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideAutocompleteResults = void 0;
const lodash_1 = __importDefault(require("lodash"));
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
            return lodash_1.default.map(comps, (match) => {
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
    return lodash_1.default.map(matches, (match) => {
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
                prefix = lodash_1.default.head(line.match(regex)) || "";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL3NlcnZpY2VzL3Byb3ZpZGVkL2F1dG9jb21wbGV0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsa0RBQTBCO0FBQzFCLHVDQUFzRDtBQWV0RCxNQUFNLFFBQVEsR0FBRyxhQUFhLFNBQVMsa0RBQWtELENBQUM7QUFDMUYsTUFBTSxPQUFPLEdBQUc7SUFFZCxDQUFDLEVBQUUsc0JBQXNCO0lBRXpCLE1BQU0sRUFBRSwrQ0FBK0M7SUFFdkQsR0FBRyxFQUFFLG9DQUFvQztDQUMxQyxDQUFDO0FBRUYsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFzQixFQUFFLE1BQWM7SUFDOUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFHdEMsTUFBTSxZQUFZLEdBQUcsMEJBQWtCLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN0RSxNQUFNLFVBQVUsR0FBRywwQkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRWxFLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQywyQkFBMkIsRUFBRTtRQUNwRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsMkJBQTJCLENBQUM7UUFFbkQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO1lBQ3JDLE9BQU8sZ0JBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtB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QUFPLENBQUMseUNBQXlDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUNuRSxvQkFBb0IsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLEVBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN2RSxvQkFBb0IsQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLENBQUM7SUFDcEQsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNGLE9BQU8sb0JBQW9CLENBQUM7QUFDOUIsQ0FBQztBQXJIRCxnRUFxSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRvY29tcGxldGVQcm92aWRlciB9IGZyb20gXCJhdG9tL2F1dG9jb21wbGV0ZS1wbHVzXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgQW5zZXIgZnJvbSBcImFuc2VyXCI7XG5pbXBvcnQgeyBsb2csIGNoYXJfaWR4X3RvX2pzX2lkeCB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi9zdG9yZVwiO1xudHlwZSBDb21wbGV0ZVJlcGx5ID0ge1xuICBtYXRjaGVzOiBBcnJheTxzdHJpbmc+O1xuICBjdXJzb3Jfc3RhcnQ6IG51bWJlcjtcbiAgY3Vyc29yX2VuZDogbnVtYmVyO1xuICBtZXRhZGF0YT86IHtcbiAgICBfanVweXRlcl90eXBlc19leHBlcmltZW50YWw/OiBBcnJheTx7XG4gICAgICBzdGFydD86IG51bWJlcjtcbiAgICAgIGVuZD86IG51bWJlcjtcbiAgICAgIHRleHQ6IHN0cmluZztcbiAgICAgIHR5cGU/OiBzdHJpbmc7XG4gICAgfT47XG4gIH07XG59O1xuY29uc3QgaWNvbkhUTUwgPSBgPGltZyBzcmM9JyR7X19kaXJuYW1lfS8uLi8uLi8uLi9zdGF0aWMvbG9nby5zdmcnIHN0eWxlPSd3aWR0aDogMTAwJTsnPmA7XG5jb25zdCByZWdleGVzID0ge1xuICAvLyBwcmV0dHkgZG9kZ3ksIGFkYXB0ZWQgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84Mzk2NjU4XG4gIHI6IC8oW15cXFdcXGRdfFxcLilbXFx3JC5dKiQvLFxuICAvLyBhZGFwdGVkIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3EvNTQ3NDAwOFxuICBweXRob246IC8oW15cXFdcXGRdfFtcXHUwMEEwLVxcdUZGRkZdKVtcXHcuXFx1MDBBMC1cXHVGRkZGXSokLyxcbiAgLy8gYWRhcHRlZCBmcm9tIGh0dHA6Ly9waHAubmV0L21hbnVhbC9lbi9sYW5ndWFnZS52YXJpYWJsZXMuYmFzaWNzLnBocFxuICBwaHA6IC9bJEEtWl9hLXpcXHg3Zi1cXHhmZl1bXFx3XFx4N2YtXFx4ZmZdKiQvLFxufTtcblxuZnVuY3Rpb24gcGFyc2VDb21wbGV0aW9ucyhyZXN1bHRzOiBDb21wbGV0ZVJlcGx5LCBwcmVmaXg6IHN0cmluZykge1xuICBjb25zdCB7IG1hdGNoZXMsIG1ldGFkYXRhIH0gPSByZXN1bHRzO1xuICAvLyBATk9URTogVGhpcyBjYW4gbWFrZSBpbnZhbGlkIGByZXBsYWNlZFByZWZpeGAgYW5kIGByZXBsYWNlZFRleHRgIHdoZW4gYSBsaW5lIGluY2x1ZGVzIHVuaWNvZGUgY2hhcmFjdGVyc1xuICAvLyBAVE9ETyAoQGF2aWF0ZXNrKTogVXNlIGBSZWdleGAgdG8gZGV0ZWN0IHRoZW0gcmVnYXJkbGVzcyBvZiB0aGUgYHJlc3VsdHMuY3Vyc29yXypgIGZlZWRiYWNrcyBmcm9tIGtlcm5lbHNcbiAgY29uc3QgY3Vyc29yX3N0YXJ0ID0gY2hhcl9pZHhfdG9fanNfaWR4KHJlc3VsdHMuY3Vyc29yX3N0YXJ0LCBwcmVmaXgpO1xuICBjb25zdCBjdXJzb3JfZW5kID0gY2hhcl9pZHhfdG9fanNfaWR4KHJlc3VsdHMuY3Vyc29yX2VuZCwgcHJlZml4KTtcblxuICBpZiAobWV0YWRhdGEgJiYgbWV0YWRhdGEuX2p1cHl0ZXJfdHlwZXNfZXhwZXJpbWVudGFsKSB7XG4gICAgY29uc3QgY29tcHMgPSBtZXRhZGF0YS5fanVweXRlcl90eXBlc19leHBlcmltZW50YWw7XG5cbiAgICBpZiAoY29tcHMubGVuZ3RoID4gMCAmJiBjb21wc1swXS50ZXh0KSB7XG4gICAgICByZXR1cm4gXy5tYXAoY29tcHMsIChtYXRjaCkgPT4ge1xuICAgICAgICBjb25zdCB0ZXh0ID0gbWF0Y2gudGV4dDtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5zdGFydCAmJiBtYXRjaC5lbmQgPyBtYXRjaC5zdGFydCA6IGN1cnNvcl9zdGFydDtcbiAgICAgICAgY29uc3QgZW5kID0gbWF0Y2guc3RhcnQgJiYgbWF0Y2guZW5kID8gbWF0Y2guZW5kIDogY3Vyc29yX2VuZDtcbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRQcmVmaXggPSBwcmVmaXguc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgIGNvbnN0IHJlcGxhY2VkVGV4dCA9IHByZWZpeC5zbGljZSgwLCBzdGFydCkgKyB0ZXh0O1xuICAgICAgICBjb25zdCB0eXBlID0gbWF0Y2gudHlwZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICAgIHJlcGxhY2VkVGV4dCxcbiAgICAgICAgICBpY29uSFRNTDogIXR5cGUgfHwgdHlwZSA9PT0gXCI8dW5rbm93bj5cIiA/IGljb25IVE1MIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByZXBsYWNlbWVudFByZWZpeCA9IHByZWZpeC5zbGljZShjdXJzb3Jfc3RhcnQsIGN1cnNvcl9lbmQpO1xuICByZXR1cm4gXy5tYXAobWF0Y2hlcywgKG1hdGNoKSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IG1hdGNoO1xuICAgIGNvbnN0IHJlcGxhY2VkVGV4dCA9IHByZWZpeC5zbGljZSgwLCBjdXJzb3Jfc3RhcnQpICsgdGV4dDtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dCxcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgcmVwbGFjZWRUZXh0LFxuICAgICAgaWNvbkhUTUwsXG4gICAgfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlQXV0b2NvbXBsZXRlUmVzdWx0cyhzdG9yZTogU3RvcmUpOiBBdXRvY29tcGxldGVQcm92aWRlciB7XG4gIGNvbnN0IGF1dG9jb21wbGV0ZVByb3ZpZGVyID0ge1xuICAgIGVuYWJsZWQ6IGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmF1dG9jb21wbGV0ZVwiKSxcbiAgICBzZWxlY3RvcjogXCIuc291cmNlXCIsXG4gICAgZGlzYWJsZUZvclNlbGVjdG9yOiBcIi5jb21tZW50XCIsXG4gICAgLy8gVGhlIGRlZmF1bHQgcHJvdmlkZXIgaGFzIGFuIGluY2x1c2lvbiBwcmlvcml0eSBvZiAwLlxuICAgIGluY2x1c2lvblByaW9yaXR5OiAxLFxuICAgIC8vIFRoZSBkZWZhdWx0IHByb3ZpZGVyIGhhcyBhIHN1Z2dlc3Rpb24gcHJpb3JpdHkgb2YgMS5cbiAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IGF0b20uY29uZmlnLmdldChcbiAgICAgIFwiSHlkcm9nZW4uYXV0b2NvbXBsZXRlU3VnZ2VzdGlvblByaW9yaXR5XCJcbiAgICApLFxuICAgIC8vIEl0IHdvbid0IHN1cHByZXNzIHByb3ZpZGVycyB3aXRoIGxvd2VyIHByaW9yaXR5LlxuICAgIGV4Y2x1ZGVMb3dlclByaW9yaXR5OiBmYWxzZSxcbiAgICBzdWdnZXN0aW9uRGV0YWlsc0VuYWJsZWQ6IGF0b20uY29uZmlnLmdldChcbiAgICAgIFwiSHlkcm9nZW4uc2hvd0luc3BlY3RvclJlc3VsdHNJbkF1dG9jb21wbGV0ZVwiXG4gICAgKSxcblxuICAgIC8vIFJlcXVpcmVkOiBSZXR1cm4gYSBwcm9taXNlLCBhbiBhcnJheSBvZiBzdWdnZXN0aW9ucywgb3IgbnVsbC5cbiAgICBnZXRTdWdnZXN0aW9ucyh7IGVkaXRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeCB9KSB7XG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGtlcm5lbCA9IHN0b3JlLmtlcm5lbDtcbiAgICAgIGlmICgha2VybmVsIHx8IGtlcm5lbC5leGVjdXRpb25TdGF0ZSAhPT0gXCJpZGxlXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtcbiAgICAgICAgW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sXG4gICAgICAgIGJ1ZmZlclBvc2l0aW9uLFxuICAgICAgXSk7XG4gICAgICBjb25zdCByZWdleCA9IHJlZ2V4ZXNba2VybmVsLmxhbmd1YWdlXTtcblxuICAgICAgaWYgKHJlZ2V4KSB7XG4gICAgICAgIHByZWZpeCA9IF8uaGVhZChsaW5lLm1hdGNoKHJlZ2V4KSkgfHwgXCJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZWZpeCA9IGxpbmU7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiBpZiBjdXJzb3IgaXMgYXQgd2hpdGVzcGFjZVxuICAgICAgaWYgKHByZWZpeC50cmltUmlnaHQoKS5sZW5ndGggPCBwcmVmaXgubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgbGV0IG1pbmltdW1Xb3JkTGVuZ3RoID0gYXRvbS5jb25maWcuZ2V0KFxuICAgICAgICBcImF1dG9jb21wbGV0ZS1wbHVzLm1pbmltdW1Xb3JkTGVuZ3RoXCJcbiAgICAgICk7XG5cbiAgICAgIGlmICh0eXBlb2YgbWluaW11bVdvcmRMZW5ndGggIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgbWluaW11bVdvcmRMZW5ndGggPSAzO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJlZml4LnRyaW0oKS5sZW5ndGggPCBtaW5pbXVtV29yZExlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxvZyhcImF1dG9jb21wbGV0ZVByb3ZpZGVyOiByZXF1ZXN0OlwiLCBsaW5lLCBidWZmZXJQb3NpdGlvbiwgcHJlZml4KTtcbiAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBrZXJuZWwuY29tcGxldGUocHJlZml4LCAocmVzdWx0cykgPT4ge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHBhcnNlQ29tcGxldGlvbnMocmVzdWx0cywgcHJlZml4KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCB0aGlzLnRpbWVvdXQoKV0pO1xuICAgIH0sXG5cbiAgICBnZXRTdWdnZXN0aW9uRGV0YWlsc09uU2VsZWN0KHtcbiAgICAgIHRleHQsXG4gICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgIHJlcGxhY2VkVGV4dCxcbiAgICAgIGljb25IVE1MLFxuICAgICAgdHlwZSxcbiAgICB9KSB7XG4gICAgICBpZiAoIXRoaXMuc3VnZ2VzdGlvbkRldGFpbHNFbmFibGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3Qga2VybmVsID0gc3RvcmUua2VybmVsO1xuICAgICAgaWYgKCFrZXJuZWwgfHwga2VybmVsLmV4ZWN1dGlvblN0YXRlICE9PSBcImlkbGVcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBrZXJuZWwuaW5zcGVjdChyZXBsYWNlZFRleHQsIHJlcGxhY2VkVGV4dC5sZW5ndGgsICh7IGZvdW5kLCBkYXRhIH0pID0+IHtcbiAgICAgICAgICBpZiAoIWZvdW5kIHx8ICFkYXRhW1widGV4dC9wbGFpblwiXSkge1xuICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IEFuc2VyLmFuc2lUb1RleHQoZGF0YVtcInRleHQvcGxhaW5cIl0pO1xuICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICAgICAgcmVwbGFjZWRUZXh0LFxuICAgICAgICAgICAgaWNvbkhUTUwsXG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCB0aGlzLnRpbWVvdXQoKV0pO1xuICAgIH0sXG5cbiAgICB0aW1lb3V0KCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLmF1dG9jb21wbGV0ZVwiLCAodikgPT4ge1xuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuZW5hYmxlZCA9IHY7XG4gICAgfSksXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLmF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25Qcmlvcml0eVwiLCAodikgPT4ge1xuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuc3VnZ2VzdGlvblByaW9yaXR5ID0gdjtcbiAgICB9KSxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uc2hvd0luc3BlY3RvclJlc3VsdHNJbkF1dG9jb21wbGV0ZVwiLCAodikgPT4ge1xuICAgICAgYXV0b2NvbXBsZXRlUHJvdmlkZXIuc3VnZ2VzdGlvbkRldGFpbHNFbmFibGVkID0gdjtcbiAgICB9KVxuICApO1xuICByZXR1cm4gYXV0b2NvbXBsZXRlUHJvdmlkZXI7XG59XG4iXX0=