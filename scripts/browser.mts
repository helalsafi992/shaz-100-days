import { readFile, writeFile, mkdir, chmod, access } from "node:fs/promises";
import { brotliDecompressSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
// Extract without attempting privileged ownership changes in managed Linux.
export async function browserPath() {
  const root = join(process.cwd(), "node_modules/@sparticuz/chromium/bin"),
    exe = join(tmpdir(), "chromium");
  try {
    await access(exe);
  } catch {
    await writeFile(
      exe,
      brotliDecompressSync(await readFile(join(root, "chromium.br"))),
    );
    await chmod(exe, 0o755);
  }
  for (const name of ["fonts", "swiftshader"]) {
    const target = name === "fonts" ? join(tmpdir(), "fonts") : tmpdir();
    await mkdir(target, { recursive: true });
    const archive = join(tmpdir(), "shaz-" + name + ".tar");
    await writeFile(
      archive,
      brotliDecompressSync(await readFile(join(root, name + ".tar.br"))),
    );
    execFileSync("tar", ["--no-same-owner", "-xf", archive, "-C", target]);
  }
  return exe;
}
