import * as compress from 'zlib';
import { is, Encoding, ValueType } from './index';

/**
 * GZip compress a string.
 */
export function gzip(text: string) {
   return new Promise<Buffer>((resolve, reject) => {
      compress.gzip(Buffer.from(text), (err, buffer) => {
         if (is.value(err)) {
            reject(err);
         } else {
            resolve(buffer);
         }
      });
   });
}

/**
 * GZip decompress a string.
 */
export function unzip(value: Buffer): Promise<string> {
   return new Promise<string>((resolve, reject) => {
      compress.unzip(value, (err, buffer) => {
         if (is.value(err)) {
            reject(err);
         } else {
            resolve(buffer.toString(Encoding.UTF8));
         }
      });
   });
}

/**
 * Only handling the very simple cases of strings and Buffers.
 *
 * @see https://stackoverflow.com/questions/1248302/how-to-get-the-size-of-a-javascript-object
 */
export function byteSize(obj: any): number {
   if (typeof obj === ValueType.String) {
      return obj.length;
   }
   if (obj instanceof Buffer) {
      return obj.length;
   }
   return -1;
}

/**
 * Return environment value. If the key doesn't exist then throw an error.
 */
export function env(key: string): string;
/**
 * Return environment value. If the key doesn't exist then return the alternate
 * value. If no alternate is given for a missing key then throw an error.
 */
export function env(key: string, alternate: string | null): string | null;

export function env(key: string, alternate?: string | null): string | null {
   if (!is.value(process)) {
      throw new Error(
         'Environment variables are not accessible in this context'
      );
   }
   const value = process.env[key];
   if (value === undefined) {
      if (alternate !== undefined) {
         return alternate;
      }
      throw new Error(`Environment value ${key} does not exist`);
   }
   return value;
}

/**
 * Whether the current path is that of a dependency; specifically, whether it's
 * within a `node_modules` descendant of the working directory.
 *
 * path = /Users/jason-abbott/dev/src/github.com/toba/node-tools/src
 * cwd = /Users/jason-abbott/dev/src/github.com/toba/node-tools
 *
 * @param strict Whether to only flag `node_modules` that descend from the
 * current working directory
 */
export const isDependency = (
   path: string = __dirname,
   strict = true
): boolean =>
   path.includes('node_modules') && (!strict || path.startsWith(process.cwd()));
