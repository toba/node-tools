import * as fs from 'fs';
import { EOL as nl } from 'os';
import * as path from 'path';
import * as Stream from 'stream';
import * as readline from 'readline';
import { Encoding } from '@toba/tools';

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
