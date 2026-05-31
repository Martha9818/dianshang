/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ecompilotElectronPoc", Object.freeze({
  kind: "electron-poc",
  capabilities: Object.freeze([]),
  getContext: () => Object.freeze({
    container: "electron-poc",
    runtime: "local-next",
    isElectronPoc: true,
    exposesFileSystem: false,
  }),
}));
