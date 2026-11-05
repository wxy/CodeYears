import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { outDir: { type: 'string' } } });
if (!values.outDir) throw new Error('请用 --outDir 指定系统临时目录');
await build({ configFile: false, publicDir: false, build: {
  target: 'es2022', outDir: values.outDir, emptyOutDir: false,
  lib: { entry: 'probes/project-details/main.ts', name: 'CodeYearsProjectDetailsProbe', formats: ['iife'], fileName: () => 'project-details.js' },
} });

const html = await readFile('probes/project-details/index.html', 'utf8');
await writeFile(join(values.outDir, 'index.html'), html.replace('<script type="module" src="./main.ts"></script>', '<script src="./project-details.js"></script>'));
