import * as compress from 'zlib';
import { is, Encoding } from './index';

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
   if (typeof obj === is.Type.String) {
      return obj.length;
   }
   if (obj instanceof Buffer) {
      return obj.length;
   }
   return -1;
}

/**
 * Return environment value. If the key doesn't exist then return the alternate
 * value. If no alternate is given for a missing key then throw an error.
 */
export function env(key: string, alternate?: string): string {
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
