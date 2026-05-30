import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

export async function ensureDirectory(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

async function copyFileOrDirectoryInternal(sourcePath: string, targetPath: string) {
  const metadata = await stat(sourcePath);

  if (metadata.isDirectory()) {
    await ensureDirectory(targetPath);

    const children = await readdir(sourcePath);
    await Promise.all(
      children.map((child) => copyFileOrDirectoryInternal(path.join(sourcePath, child), path.join(targetPath, child))),
    );
    return;
  }

  if (!metadata.isFile()) {
    return;
  }

  await ensureDirectory(path.dirname(targetPath));
  await copyFile(sourcePath, targetPath);
}

export async function copyFileOrDirectory(sourcePath: string, targetPath: string) {
  return copyFileOrDirectoryInternal(sourcePath, targetPath);
}

export async function getPathSizeBytes(targetPath: string): Promise<number> {
  const metadata = await stat(targetPath);

  if (metadata.isFile()) {
    return metadata.size;
  }

  if (!metadata.isDirectory()) {
    return 0;
  }

  const children = await readdir(targetPath);
  const childSizes = await Promise.all(children.map((child) => getPathSizeBytes(path.join(targetPath, child))));
  return childSizes.reduce((sum, size) => sum + size, 0);
}

function isInsideDirectory(parentDir: string, childPath: string) {
  const relative = path.relative(parentDir, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function getScopedPathSizeBytes(rootDir: string, targetPath: string) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);

  if (resolvedRoot !== resolvedTarget && !isInsideDirectory(resolvedRoot, resolvedTarget)) {
    throw new Error("Path size target is outside the allowed root directory.");
  }

  return getPathSizeBytes(resolvedTarget);
}
