import '@toba/test';
import { Cache, CacheEventType } from './index';
import { totalSize, CacheItem } from './cache';

const cache = new Cache<string>();

beforeEach(() => {
   cache.clear();
});

test('add item to cache', () => {
   cache.add('key', 'value');
   expect(cache.get('key')).toBe('value');
});

test('report cache size', () => {
   expect(cache.length).toBe(0);

   for (let i = 1; i <= 20; i++) {
      cache.add('key' + i, 'value' + i);
   }
   expect(cache.length).toBe(20);
});

test('remove item from cache', () => {
   cache.add('remove', 'value');
   expect(cache.get('remove')).toBe('value');

   cache.remove('remove');
   expect(cache.get('remove')).toBe(null);

   // removing non-existent item should cause no error
   cache.remove('fake');
});

test('eviction notification', () => {
   // cache pruning runs on a timer
   jest.useFakeTimers();

   const listener = jest.fn();
   cache.events.subscribe(CacheEventType.ItemsEvicted, listener);
   cache.updatePolicy({ maxItems: 2 });

   cache.add('key1', 'value1');
   cache.add('key2', 'value2');
   expect(listener).toHaveBeenCalledTimes(0);

   cache.add('key3', 'value3');

   jest.runAllTimers();

   expect(listener).toHaveBeenCalledTimes(1);
   expect(listener).toHaveBeenCalledWith(['key1']);

   cache.add('key4', 'value4');
   cache.add('key5', 'value5');

   jest.runAllTimers();

   expect(listener).toHaveBeenCalledTimes(2);
   expect(listener).toHaveBeenCalledWith(['key2', 'key3']);
});

test('calculates total cache size', () => {
   const items: Map<string, CacheItem<string>> = new Map([
      [
         'first',
         {
            key: 'first',
            value: 'some text',
            size: 10,
            added: 0
         }
      ],
      [
         'second',
         {
            key: 'second',
            value: 'some text',
            size: 12,
            added: 0
         }
      ],
      [
         'third',
         {
            key: 'third',
            value: 'some text',
            size: 15,
            added: 0
         }
      ]
   ]);

   expect(totalSize(items)).toBe(37);
   // total size with item keys excluded
   expect(totalSize(items, ['first'])).toBe(27);
});

test('removes items when cache exceeds policy byte size', () => {
   cache.add('key1', 'value1');
   cache.add('key2', 'value2');
   cache.add('key3', 'value3');

   jest.useFakeTimers();

   const listener = jest.fn();
   cache.events.subscribe(CacheEventType.ItemsEvicted, listener);
   cache.updatePolicy({ maxBytes: 13 });

   jest.runAllTimers();

   expect(listener).toHaveBeenCalledWith(['key1']);
});
