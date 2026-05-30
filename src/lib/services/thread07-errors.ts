export class ExportReadonlyError extends Error {
  constructor() {
    super("预览环境只读，请在 Windows 本地验收。");
    this.name = "ExportReadonlyError";
  }
}

export class BackupReadonlyError extends Error {
  constructor() {
    super("预览环境只读，请在 Windows 本地验收。");
    this.name = "BackupReadonlyError";
  }
}
