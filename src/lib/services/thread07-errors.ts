export class ExportReadonlyError extends Error {
  constructor() {
    super("当前环境为只读预览，Excel 导出请在 Windows 本地运行。");
    this.name = "ExportReadonlyError";
  }
}

export class BackupReadonlyError extends Error {
  constructor() {
    super("当前环境为只读预览，手动备份请在 Windows 本地运行。");
    this.name = "BackupReadonlyError";
  }
}
