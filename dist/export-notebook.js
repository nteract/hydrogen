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
exports.exportNotebook = void 0;
const path = __importStar(require("path"));
const fs_1 = require("fs");
const { writeFile } = fs_1.promises;
const electron_1 = require("electron");
const { dialog } = electron_1.remote;
const commutable_1 = require("@nteract/commutable");
const store_1 = __importDefault(require("./store"));
async function exportNotebook() {
    const editor = atom.workspace.getActiveTextEditor();
    const editorPath = editor.getPath();
    const directory = path.dirname(editorPath);
    const rawFileName = path.basename(editorPath, path.extname(editorPath));
    const noteBookPath = path.join(directory, `${rawFileName}.ipynb`);
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: editor.getTitle(),
        defaultPath: noteBookPath,
    });
    if (!canceled) {
        await saveNoteBook(filePath);
    }
}
exports.exportNotebook = exportNotebook;
async function saveNoteBook(filePath) {
    if (filePath.length === 0) {
        return;
    }
    const ext = path.extname(filePath) === "" ? ".ipynb" : "";
    const fname = `${filePath}${ext}`;
    try {
        await writeFile(fname, commutable_1.stringifyNotebook(store_1.default.notebook));
        atom.notifications.addSuccess("Save successful", {
            detail: `Saved notebook as ${fname}`,
        });
    }
    catch (err) {
        atom.notifications.addError("Error saving file", {
            detail: err.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LW5vdGVib29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2V4cG9ydC1ub3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBQzdCLDJCQUE4QjtBQUM5QixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsYUFBUSxDQUFDO0FBQy9CLHVDQUFrQztBQUNsQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsaUJBQU0sQ0FBQztBQUUxQixvREFBd0Q7QUFFeEQsb0RBQTRCO0FBQ3JCLEtBQUssVUFBVSxjQUFjO0lBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUNwRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDeEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxXQUFXLFFBQVEsQ0FBQyxDQUFDO0lBRWxFLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQ3pELEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ3hCLFdBQVcsRUFBRSxZQUFZO0tBQzFCLENBQUMsQ0FBQztJQUNILElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixNQUFNLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7QUFkRCx3Q0FjQztBQUVELEtBQUssVUFBVSxZQUFZLENBQUMsUUFBZ0I7SUFDMUMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPO0tBQ1I7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDMUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFFbEMsSUFBSTtRQUNGLE1BQU0sU0FBUyxDQUFDLEtBQUssRUFBRSw4QkFBaUIsQ0FBQyxlQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRTtZQUMvQyxNQUFNLEVBQUUscUJBQXFCLEtBQUssRUFBRTtTQUNyQyxDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUU7WUFDL0MsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPO1NBQ3BCLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgcHJvbWlzZXMgfSBmcm9tIFwiZnNcIjtcclxuY29uc3QgeyB3cml0ZUZpbGUgfSA9IHByb21pc2VzO1xyXG5pbXBvcnQgeyByZW1vdGUgfSBmcm9tIFwiZWxlY3Ryb25cIjtcclxuY29uc3QgeyBkaWFsb2cgfSA9IHJlbW90ZTtcclxuXHJcbmltcG9ydCB7IHN0cmluZ2lmeU5vdGVib29rIH0gZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcclxuXHJcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0Tm90ZWJvb2soKSB7XHJcbiAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gIGNvbnN0IGVkaXRvclBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xyXG4gIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShlZGl0b3JQYXRoKTtcclxuICBjb25zdCByYXdGaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZWRpdG9yUGF0aCwgcGF0aC5leHRuYW1lKGVkaXRvclBhdGgpKTtcclxuICBjb25zdCBub3RlQm9va1BhdGggPSBwYXRoLmpvaW4oZGlyZWN0b3J5LCBgJHtyYXdGaWxlTmFtZX0uaXB5bmJgKTtcclxuXHJcbiAgY29uc3QgeyBjYW5jZWxlZCwgZmlsZVBhdGggfSA9IGF3YWl0IGRpYWxvZy5zaG93U2F2ZURpYWxvZyh7XHJcbiAgICB0aXRsZTogZWRpdG9yLmdldFRpdGxlKCksXHJcbiAgICBkZWZhdWx0UGF0aDogbm90ZUJvb2tQYXRoLFxyXG4gIH0pO1xyXG4gIGlmICghY2FuY2VsZWQpIHtcclxuICAgIGF3YWl0IHNhdmVOb3RlQm9vayhmaWxlUGF0aCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzYXZlTm90ZUJvb2soZmlsZVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChmaWxlUGF0aC5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgLy8gYWRkIGRlZmF1bHQgZXh0ZW5zaW9uXHJcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gXCJcIiA/IFwiLmlweW5iXCIgOiBcIlwiO1xyXG4gIGNvbnN0IGZuYW1lID0gYCR7ZmlsZVBhdGh9JHtleHR9YDtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHdyaXRlRmlsZShmbmFtZSwgc3RyaW5naWZ5Tm90ZWJvb2soc3RvcmUubm90ZWJvb2spKTtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKFwiU2F2ZSBzdWNjZXNzZnVsXCIsIHtcclxuICAgICAgZGV0YWlsOiBgU2F2ZWQgbm90ZWJvb2sgYXMgJHtmbmFtZX1gLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJFcnJvciBzYXZpbmcgZmlsZVwiLCB7XHJcbiAgICAgIGRldGFpbDogZXJyLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19