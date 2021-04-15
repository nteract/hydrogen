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
const path = __importStar(require("path"));
const fs_1 = require("fs");
const electron_1 = require("electron");
const { dialog } = electron_1.remote;
const commutable_1 = require("@nteract/commutable");
const store_1 = __importDefault(require("./store"));
function exportNotebook() {
    const saveNotebook = function (filename) {
        if (!filename) {
            return;
        }
        const ext = path.extname(filename) === "" ? ".ipynb" : "";
        const fname = `${filename}${ext}`;
        fs_1.writeFile(fname, commutable_1.stringifyNotebook(store_1.default.notebook), (err) => {
            if (err) {
                atom.notifications.addError("Error saving file", {
                    detail: err.message,
                });
            }
            else {
                atom.notifications.addSuccess("Save successful", {
                    detail: `Saved notebook as ${fname}`,
                });
            }
        });
    };
    dialog.showSaveDialog(saveNotebook);
}
exports.default = exportNotebook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LW5vdGVib29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2V4cG9ydC1ub3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkI7QUFDN0IsMkJBQStCO0FBQy9CLHVDQUFrQztBQUNsQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsaUJBQU0sQ0FBQztBQUUxQixvREFBd0Q7QUFFeEQsb0RBQTRCO0FBQzVCLFNBQXdCLGNBQWM7SUFFcEMsTUFBTSxZQUFZLEdBQUcsVUFBVSxRQUFRO1FBQ3JDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDYixPQUFPO1NBQ1I7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDMUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDbEMsY0FBUyxDQUFDLEtBQUssRUFBRSw4QkFBaUIsQ0FBQyxlQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMxRCxJQUFJLEdBQUcsRUFBRTtnQkFDUCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtvQkFDL0MsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPO2lCQUNwQixDQUFDLENBQUM7YUFDSjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRTtvQkFDL0MsTUFBTSxFQUFFLHFCQUFxQixLQUFLLEVBQUU7aUJBQ3JDLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7SUFFRixNQUFNLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUF2QkQsaUNBdUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyByZW1vdGUgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmNvbnN0IHsgZGlhbG9nIH0gPSByZW1vdGU7XG5cbmltcG9ydCB7IHN0cmluZ2lmeU5vdGVib29rIH0gZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcblxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBleHBvcnROb3RlYm9vaygpIHtcbiAgLy8gVE9ETzogUmVmYWN0b3IgdG8gdXNlIHByb21pc2VzLCB0aGlzIGlzIGEgYml0IFwibmVzdGVkXCIuXG4gIGNvbnN0IHNhdmVOb3RlYm9vayA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSBcIlwiID8gXCIuaXB5bmJcIiA6IFwiXCI7XG4gICAgY29uc3QgZm5hbWUgPSBgJHtmaWxlbmFtZX0ke2V4dH1gO1xuICAgIHdyaXRlRmlsZShmbmFtZSwgc3RyaW5naWZ5Tm90ZWJvb2soc3RvcmUubm90ZWJvb2spLCAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkVycm9yIHNhdmluZyBmaWxlXCIsIHtcbiAgICAgICAgICBkZXRhaWw6IGVyci5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKFwiU2F2ZSBzdWNjZXNzZnVsXCIsIHtcbiAgICAgICAgICBkZXRhaWw6IGBTYXZlZCBub3RlYm9vayBhcyAke2ZuYW1lfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICAvLyBUT0RPIHRoaXMgQVBJIGlzIHByb21pc2lmaWVkIC0+IHNob3VsZCBiZSBmaXhlZFxuICBkaWFsb2cuc2hvd1NhdmVEaWFsb2coc2F2ZU5vdGVib29rKTtcbn1cbiJdfQ==