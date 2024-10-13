import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const theme = JSON.parse(readFileSync(join(__dirname, './highlighter-theme.json'), 'utf-8'))
export default theme
