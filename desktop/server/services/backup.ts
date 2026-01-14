import { readFile, writeFile, readdir, unlink } from 'fs/promises';
import { dirname, basename, join } from 'path';

const MAX_BACKUPS = 5;

export async function createBackup(filePath: string): Promise<string> {
  const dir = dirname(filePath);
  const name = basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(dir, `${name}.backup.${timestamp}`);

  try {
    const content = await readFile(filePath, 'utf-8');
    await writeFile(backupPath, content, 'utf-8');

    // Clean up old backups
    await cleanupOldBackups(dir, name);

    return backupPath;
  } catch (e) {
    // File might not exist yet, that's okay
    return '';
  }
}

async function cleanupOldBackups(dir: string, fileName: string): Promise<void> {
  try {
    const entries = await readdir(dir);
    const backups = entries
      .filter(e => e.startsWith(`${fileName}.backup.`))
      .sort()
      .reverse();

    // Remove old backups beyond MAX_BACKUPS
    for (const backup of backups.slice(MAX_BACKUPS)) {
      await unlink(join(dir, backup));
    }
  } catch {
    // Ignore cleanup errors
  }
}

export async function listBackups(filePath: string): Promise<string[]> {
  const dir = dirname(filePath);
  const name = basename(filePath);

  try {
    const entries = await readdir(dir);
    return entries
      .filter(e => e.startsWith(`${name}.backup.`))
      .sort()
      .reverse()
      .map(e => join(dir, e));
  } catch {
    return [];
  }
}

export async function restoreBackup(backupPath: string, targetPath: string): Promise<void> {
  const content = await readFile(backupPath, 'utf-8');
  await createBackup(targetPath); // Backup current before restore
  await writeFile(targetPath, content, 'utf-8');
}
