import { readFileSync } from 'node:fs'

const theme = JSON.parse(readFileSync('./highlighter-theme.json', 'utf-8'))
export default theme
