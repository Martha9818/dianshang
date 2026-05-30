import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getExportDirectory, getExportLogById, isSafeExportFileName } from "@/lib/services/export-service";

function errorResponse(message: string, status = 404) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isInsideDirectory(parentDir: string, childPath: string) {
  const relative = path.relative(parentDir, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function buildContentDisposition(fileName: string) {
  const fallback = fileName.replace(/[^A-Za-z0-9_.-]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const exportId = Number(id);

  if (!Number.isInteger(exportId) || exportId <= 0) {
    return errorResponse("导出记录不存在。");
  }

  const log = await getExportLogById(exportId);

  if (!log || log.status !== "成功") {
    return errorResponse("导出文件尚不可下载。");
  }

  if (!isSafeExportFileName(log.fileName)) {
    return errorResponse("导出文件名无效。", 400);
  }

  const exportRoot = path.resolve(getExportDirectory());
  const filePath = path.resolve(log.filePath);

  if (!isInsideDirectory(exportRoot, filePath) || path.basename(filePath) !== log.fileName) {
    return errorResponse("导出路径无效。", 400);
  }

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": buildContentDisposition(log.fileName),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse("导出文件不存在或暂时不可读取。");
  }
}
