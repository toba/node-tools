import * as fs from 'fs'
import { EOL as nl } from 'os'
import * as path from 'path'
import * as Stream from 'stream'
import * as readline from 'readline'
import { Encoding, is } from '@toba/tools'

/**
 * Prepend local path to file name.
 */
export const localPath = (name: string) => path.join(__dirname, name)

/**
 * If path has no slash then prepend local path.
 */
export const normalizePath = (filePath: string) =>
   /[\\/]/.test(filePath) ? filePath : localPath(filePath)

export const loadStream = (filePath: string) =>
   fs.createReadStream(normalizePath(filePath))

/**
 * Technique that supports large text files.
 */
export const readBigFile = (filePath: string) =>
   new Promise<string>(resolve => {
      const input = loadStream(filePath)
      const output: NodeJS.WritableStream = new Stream.Writable()
      const rl = readline.createInterface(input, output)
      let file = ''
      rl.on('line', (line: string) => (file += line + nl))
      rl.on('close', () => resolve(file))
   })

export const readFile = (filePath: string): Promise<Buffer> =>
   new Promise((resolve, reject) => {
      fs.readFile(normalizePath(filePath), (err, data) => {
         if (err === null) {
            resolve(data)
         } else {
            reject(err)
         }
      })
   })

export async function readFileText(filePath: string) {
   const buffer = await readFile(filePath)
   return buffer.toString(Encoding.UTF8)
}

/**
 * Whether path can be accessed by the current user.
 */
const canAccess = (dir: string, accessType: number) =>
   new Promise<boolean>(resolve => {
      fs.access(dir, accessType | fs.constants.F_OK, err => {
         resolve(err === null)
      })
   })

/** Whether absolute path `dir` can be read. */
export const canRead = (dir: string) => canAccess(dir, fs.constants.R_OK)
/** Whether absolute path `dir` can be written. */
export const canWrite = (dir: string) => canAccess(dir, fs.constants.W_OK)

/**
 * Write file content to standard output path.
 * @returns [name, contents]
 */
export const writeFile = (
   name: string,
   data: string,
   outputPath: string,
   ext = 'svg'
) =>
   new Promise<[string, string]>((resolve, reject) => {
      fs.writeFile(path.resolve(outputPath, name + '.' + ext), data, err => {
         if (is.value(err)) {
            console.log(err)
            reject(err)
            return
         }
         resolve([name, data])
      })
   })

/**
 * Whether path exists.
 */
export const pathExists = (dir: string) =>
   new Promise<boolean>(resolve => {
      fs.exists(dir, resolve)
   })

/**
 * Ensure a path exists. This assumes the path other than the final file or
 * folder (leaf) is known to exist. An error may be thrown if that is not the
 * case. To handle that possibility, use `ensureAllExist()`.
 */
export const ensureExists = (dir: string) =>
   pathExists(dir).then(exists =>
      exists
         ? Promise.resolve()
         : new Promise<void>((resolve, reject) => {
              fs.mkdir(dir, err => {
                 if (err !== null) reject(err)
                 else resolve()
              })
           })
   )

/**
 * Ensure all parts of a path exist. To check only if the last file or folder
 * (leaf) of a path exists, use `ensureExists()`.
 */
export const ensureAllExist = (dir: string) => {
   const parts = dir.split(path.sep)
   const paths = parts.map((_, i) => parts.slice(0, i + 1).join(path.sep))
   let firstMissingPath = 0

   for (let i = paths.length - 1; i >= 0; i--) {
      if (fs.existsSync(paths[i])) {
         firstMissingPath = i + 1
         break
      }
   }

   for (let i = firstMissingPath; i < paths.length; i++) {
      fs.mkdirSync(paths[i])
   }
}

/**
 * Remove all files within the given folder.
 *
 * @param errorIfFound List of file names that will trigger an error if found in
 * `dir` (e.g. ['package.json', '.gitignore', 'tsconfig.json'])
 */
export const deleteFiles = (dir: string, errorIfFound: string[] = []) =>
   new Promise((resolve, reject) => {
      fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
         if (is.value(err)) {
            reject(err)
            console.error(err)
            return
         }

         const files = entries.filter(e => e.isFile())

         if (files.length == 0) {
            resolve()
            return
         }

         let f: fs.Dirent | undefined

         const cannotRemove = files.find(f => errorIfFound.includes(f.name))

         if (cannotRemove !== undefined) {
            reject(
               new Error(
                  `Target directory cannot be removed because it contains ${cannotRemove.name}`
               )
            )
            return
         }

         while ((f = files.pop()) !== undefined) {
            fs.unlink(f.name, err => {
               if (is.value(err)) {
                  reject(err)
               } else if (entries.length == 0) {
                  resolve()
               }
            })
         }
      })
   })

/**
 * Method to execute on a directory entry.
 */
export type DirEntryTask<T> = (e: fs.Dirent) => Promise<T>
/**
 * Filter a directory entry.
 */
export type DirEntryPredicate = (e: fs.Dirent) => boolean

/**
 * Execute an asynchronous task for each entry in a directory.
 * @param dir Fully qualified path
 * @param predicate Filter method
 * @param task
 * @param silent Whether to supress console errors
 */
export const eachDirEntry = <T>(
   dir: string,
   predicate: DirEntryPredicate,
   task: DirEntryTask<T>,
   silent = false
) =>
   new Promise<T[]>(resolve => {
      fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
         if (is.value(err)) {
            if (!silent) console.error(` ❌ Could not read ${dir}`, err)
            return resolve()
         }
         if (entries.length == 0) {
            if (!silent) console.log('❓ Folder is empty', dir)
            return resolve()
         }
         return Promise.all(entries.filter(predicate).map(task)).then(resolve)
      })
   })
