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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LW5vdGVib29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2V4cG9ydC1ub3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBQzdCLDJCQUE4QjtBQUM5QixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsYUFBUSxDQUFDO0FBQy9CLHVDQUFrQztBQUNsQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsaUJBQU0sQ0FBQztBQUUxQixvREFBd0Q7QUFFeEQsb0RBQTRCO0FBQ3JCLEtBQUssVUFBVSxjQUFjO0lBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUNwRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDeEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxXQUFXLFFBQVEsQ0FBQyxDQUFDO0lBRWxFLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQ3pELEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ3hCLFdBQVcsRUFBRSxZQUFZO0tBQzFCLENBQUMsQ0FBQztJQUNILElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixNQUFNLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7QUFkRCx3Q0FjQztBQUVELEtBQUssVUFBVSxZQUFZLENBQUMsUUFBZ0I7SUFDMUMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPO0tBQ1I7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDMUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFFbEMsSUFBSTtRQUNGLE1BQU0sU0FBUyxDQUFDLEtBQUssRUFBRSw4QkFBaUIsQ0FBQyxlQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRTtZQUMvQyxNQUFNLEVBQUUscUJBQXFCLEtBQUssRUFBRTtTQUNyQyxDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUU7WUFDL0MsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPO1NBQ3BCLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHByb21pc2VzIH0gZnJvbSBcImZzXCI7XG5jb25zdCB7IHdyaXRlRmlsZSB9ID0gcHJvbWlzZXM7XG5pbXBvcnQgeyByZW1vdGUgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmNvbnN0IHsgZGlhbG9nIH0gPSByZW1vdGU7XG5cbmltcG9ydCB7IHN0cmluZ2lmeU5vdGVib29rIH0gZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcblxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0Tm90ZWJvb2soKSB7XG4gIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgY29uc3QgZWRpdG9yUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShlZGl0b3JQYXRoKTtcbiAgY29uc3QgcmF3RmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGVkaXRvclBhdGgsIHBhdGguZXh0bmFtZShlZGl0b3JQYXRoKSk7XG4gIGNvbnN0IG5vdGVCb29rUGF0aCA9IHBhdGguam9pbihkaXJlY3RvcnksIGAke3Jhd0ZpbGVOYW1lfS5pcHluYmApO1xuXG4gIGNvbnN0IHsgY2FuY2VsZWQsIGZpbGVQYXRoIH0gPSBhd2FpdCBkaWFsb2cuc2hvd1NhdmVEaWFsb2coe1xuICAgIHRpdGxlOiBlZGl0b3IuZ2V0VGl0bGUoKSxcbiAgICBkZWZhdWx0UGF0aDogbm90ZUJvb2tQYXRoLFxuICB9KTtcbiAgaWYgKCFjYW5jZWxlZCkge1xuICAgIGF3YWl0IHNhdmVOb3RlQm9vayhmaWxlUGF0aCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2F2ZU5vdGVCb29rKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgaWYgKGZpbGVQYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBhZGQgZGVmYXVsdCBleHRlbnNpb25cbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gXCJcIiA/IFwiLmlweW5iXCIgOiBcIlwiO1xuICBjb25zdCBmbmFtZSA9IGAke2ZpbGVQYXRofSR7ZXh0fWA7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCB3cml0ZUZpbGUoZm5hbWUsIHN0cmluZ2lmeU5vdGVib29rKHN0b3JlLm5vdGVib29rKSk7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoXCJTYXZlIHN1Y2Nlc3NmdWxcIiwge1xuICAgICAgZGV0YWlsOiBgU2F2ZWQgbm90ZWJvb2sgYXMgJHtmbmFtZX1gLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJFcnJvciBzYXZpbmcgZmlsZVwiLCB7XG4gICAgICBkZXRhaWw6IGVyci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59XG4iXX0=