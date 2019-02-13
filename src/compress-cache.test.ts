import '@toba/test';
import { CompressCache, CacheEventType } from './index';
import { lipsum } from '@toba/test';

const cache = new CompressCache();

test('compresses and decompresses text values', async () => {
   await cache.addText('key1', lipsum);
   expect(lipsum).toHaveLength(445);
   expect(cache.size).toBe(282);

   const bytes = await cache.getZip('key1');
   expect(bytes.length).toBe(282);

   const text = await cache.getText('key1');
   expect(text).toBe(lipsum);
});

test('automatically loads cache misses', async () => {
   const loader = jest.fn();
   const key = 'some-key';

   loader.mockReturnValue(
      new Promise(resolve => {
         setTimeout(() => resolve(lipsum), 200);
      })
   );

   const testCache = new CompressCache(loader);
   let match = await testCache.getText(key);

   expect(match).toBe(lipsum);
   expect(loader).toHaveBeenCalledTimes(1);
   expect(loader).toHaveBeenLastCalledWith(key);

   // should hit cache the second time
   match = await testCache.getText(key);

   expect(match).toBe(lipsum);
   expect(loader).toHaveBeenCalledTimes(1);

   // removal should prompt auto-load again
   testCache.remove(key);
   expect(testCache.size).toBe(0);

   match = await testCache.getText(key);
   expect(match).toBe(lipsum);
   expect(loader).toHaveBeenCalledTimes(2);
});

test('emits event for cache miss', () => {
   const listener = jest.fn();
   const key = 'not-a-thing';

   cache.events.subscribe(CacheEventType.KeyNotFound, listener);
   cache.get(key);

   expect(listener).toHaveBeenCalledTimes(1);
   expect(listener).toHaveBeenCalledWith(key);
});

test('delays access while cache is populating', async () => {
   const listener = jest.fn();
   const loader = jest.fn();
   const key = 'some-key';

   loader.mockReturnValue(
      new Promise(resolve => {
         setTimeout(() => resolve(lipsum), 200);
      })
   );

   const testCache = new CompressCache(loader);
   testCache.events.subscribe(CacheEventType.KeyNotFound, listener);

   let match = await testCache.getText(key);
   expect(match).toBe(lipsum);
   expect(loader).toHaveBeenCalledTimes(1);

   match = await testCache.getText(key);
   expect(loader).toHaveBeenCalledTimes(1);

   expect(listener).toHaveBeenCalledTimes(1);
   expect(listener).toHaveBeenCalledWith(key);
});
