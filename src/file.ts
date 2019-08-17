import * as fs from 'fs';
import { EOL as nl } from 'os';
import * as path from 'path';
import * as Stream from 'stream';
import * as readline from 'readline';
import { Encoding, is } from '@toba/tools/cjs';

/**
 * Prepend local path to file name.
 */
export const localPath = (name: string) => path.join(__dirname, name);

/**
 * If path has no slash then prepend local path.
 */
export const normalizePath = (filePath: string) =>
   /[\\\/]/.test(filePath) ? filePath : localPath(filePath);

/**
 * Technique that supports large text files.
 */
export const readBigFile = (filePath: string) =>
   new Promise<string>(resolve => {
      const input = loadStream(filePath);
      const output: NodeJS.WritableStream = new Stream.Writable();
      const rl = readline.createInterface(input, output);
      let file = '';
      rl.on('line', (line: string) => (file += line + nl));
      rl.on('close', () => resolve(file));
   });

export const readFile = (filePath: string): Promise<Buffer> =>
   new Promise((resolve, reject) => {
      fs.readFile(normalizePath(filePath), (err, data) => {
         if (err === null) {
            resolve(data);
         } else {
            reject(err);
         }
      });
   });

export async function readFileText(filePath: string) {
   const buffer = await readFile(filePath);
   return buffer.toString(Encoding.UTF8);
}

export const loadStream = (filePath: string) =>
   fs.createReadStream(normalizePath(filePath));

/**
 * Whether SVG path can be accessed by the current user.
 */
const canAccess = (dir: string, accessType: number) =>
   new Promise<boolean>(resolve => {
      fs.access(dir, accessType | fs.constants.F_OK, err => {
         resolve(err === null);
      });
   });

/** Whether absolute path `dir` can be read. */
export const canRead = (dir: string) => canAccess(dir, fs.constants.R_OK);
/** Whether absolute path `dir` can be written. */
export const canWrite = (dir: string) => canAccess(dir, fs.constants.W_OK);

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
            console.log(err);
            reject(err);
            return;
         }
         resolve([name, data]);
      });
   });

/**
 * Ensure a path exists.
 */
export const ensureExists = (dir: string) =>
   pathExists(dir).then(exists => {
      if (!exists) {
         return new Promise<void>((resolve, reject) => {
            fs.mkdir(dir, err => {
               if (err !== null) {
                  reject(err);
               } else {
                  resolve();
               }
            });
         });
      }
   });

/**
 * Whether path exists.
 */
export const pathExists = (dir: string) =>
   new Promise<boolean>(resolve => {
      fs.exists(dir, resolve);
   });

/**
 * Remove all files within the given folder.
 */
export const deleteFiles = (dir: string) =>
   new Promise((resolve, reject) => {
      fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
         if (is.value(err)) {
            reject(err);
            console.error(err);
            return;
         }

         const files = entries.filter(e => e.isFile());

         if (files.length == 0) {
            resolve();
            return;
         }

         let f: fs.Dirent | undefined;

         const errorIfFound = ['package.json', '.gitignore', 'tsconfig.json'];
         const cannotRemove = files.find(f => errorIfFound.includes(f.name));

         if (cannotRemove !== undefined) {
            reject(
               `Target directory cannot be removed because it contains ${
                  cannotRemove.name
               }`
            );
            return;
         }

         while ((f = files.pop()) != null) {
            fs.unlink(f.name, err => {
               if (is.value(err)) {
                  reject(err);
               } else if (entries.length == 0) {
                  resolve();
               }
            });
         }
      });
   });
