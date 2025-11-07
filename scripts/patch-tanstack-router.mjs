import path from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const searchBases = [process.cwd(), path.join(process.cwd(), 'apps', 'frontend')]
const dirs = new Set()

for (const base of searchBases) {
  try {
    const pkg = require.resolve('@tanstack/router-generator/package.json', {
      paths: [base]
    })
    dirs.add(path.dirname(pkg))
  } catch {
    // ignore
  }
}

if (!dirs.size) {
  console.info('patch-tanstack-router: no @tanstack/router-generator installation found')
  process.exit(0)
}

const replacements = [
  {
    match: 'z.function().returns(z.array(z.string()))',
    replace: 'z.custom((val) => typeof val === "function")'
  },
  {
    match: 'zod.z.function().returns(zod.z.array(zod.z.string()))',
    replace: 'zod.z.custom((val) => typeof val === "function")'
  }
]

const targetPaths = [
  ['dist', 'esm', 'config.js'],
  ['dist', 'cjs', 'config.cjs']
]

let patched = 0

for (const dir of dirs) {
  for (const rel of targetPaths) {
    const file = path.join(dir, ...rel)
    if (!existsSync(file)) continue
    let contents = readFileSync(file, 'utf-8')
    let changed = false
    for (const { match, replace } of replacements) {
      if (contents.includes(replace)) continue
      if (contents.includes(match)) {
        contents = contents.replace(match, replace)
        changed = true
      }
    }
    if (changed) {
      writeFileSync(file, contents, 'utf-8')
      patched += 1
      console.info(`patch-tanstack-router: patched ${path.relative(process.cwd(), file)}`)
    }
  }
}

if (!patched) {
  console.info('patch-tanstack-router: files already patched or plugin missing')
}
