import * as path from 'path'
import {
   readFile,
   readBigFile,
   readFileText,
   normalizePath,
   ensureAllExist
} from './file'

/** File to load. */
const testFile = './LICENSE'
/** Known file contents. */
const content = 'Copyright'

test('normalizes file path', () => {
   expect(normalizePath('file/name')).toBe('file/name')
   expect(normalizePath('file\\name')).toBe('file\\name')
   expect(normalizePath('name')).toBe(path.join(__dirname, 'name'))
})

test('reads file bytes', async () => {
   const bytes = await readFile(testFile)
   expect(bytes).toBeDefined()
   expect(bytes).toBeInstanceOf(Buffer)
})

test('reads file text', async () => {
   const text = await readFileText(testFile)
   expect(typeof text).toBe('string')
   expect(text.includes(content)).toBe(true)
})

test('reads large files', async () => {
   const text = await readBigFile(testFile)
   expect(text).toBeDefined()
   expect(typeof text).toBe('string')
   expect(text.includes(content)).toBe(true)
})

test.skip('ensures all parts of a path exist', () => {
   const dir = path.join(__dirname, '__mocks__', 'data')
   ensureAllExist(dir)

   expect(2).toBe(2)
})
