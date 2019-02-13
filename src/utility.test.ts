import '@toba/test';
import path from 'path';
import { byteSize, gzip, unzip, env, isDependency } from './index';
import { lipsum } from '@toba/test';

test('reports byte size of strings and buffers', () => {
   const buf = Buffer.from([1, 2, 3]);

   expect(byteSize('some text')).toBe(9);
   expect(byteSize(buf)).toBe(3);
   expect(byteSize({ random: 'object' })).toBe(-1);
});

test('zips and unzips strings', async () => {
   const buffer = await gzip(lipsum);
   // raw length is 445
   expect(byteSize(buffer)).toBeLessThan(300);
   const text = await unzip(buffer);
   expect(text).toBe(lipsum);
});

test('reads environmnent variables with option for alternate', () => {
   const nope = 'probably-does-not-exist';
   expect(env('PATH')).toBeDefined();
   expect(env(nope, 'alternate')).toBe('alternate');

   let v: string | undefined;
   let e: Error | undefined = undefined;

   try {
      v = env(nope);
   } catch (err) {
      e = err;
   }

   expect(v).toBeUndefined();
   expect(e).toBeDefined();
   expect(e!.message).toBe(`Environment value ${nope} does not exist`);
});

test('determines whether path is likely that of a dependency', () => {
   // right path but not node_modules
   expect(isDependency()).toBe(false);
   // node_modules but not right path
   expect(isDependency('/Users/person/src/node_modules/dep')).toBe(false);
   // just right
   expect(isDependency(path.resolve(__dirname, 'node_modules'))).toBe(true);
});
