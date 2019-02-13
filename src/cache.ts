import { is, merge, EventEmitter, byteSize } from './index';

export interface CacheItem<T> {
   key: string;
   /** Timestamp */
   added: number;
   value: T;
   /** Byte size of value */
   size: number;
}

/**
 * CachePolicy controls when items may be automatically evicted. Leave value
 * undefined or set to `-1` to disable a particular threshold.
 */
export interface CachePolicy {
   /** Maximum items before earliest is removed from cache. */
   maxItems: number;
   /** Maximum age in milliseconds before item is removed from cache. */
   maxAge: number;
   maxBytes: number;
}

export enum EventType {
   /** Notify when items are removed from the cache (sends list of keys) */
   ItemsEvicted,
   /** Notify when attempting to access a key not in the cache */
   KeyNotFound
}

/**
 * Iterate cache items to report total size.
 *
 * @param except Optional list of item keys to exclude from the result
 */
export const totalSize = <T>(
   items: Map<string, CacheItem<T>>,
   except: string[] = []
): number =>
   Array.from(items.values())
      .filter(i => except.indexOf(i.key) < 0)
      .reduce((total, i) => total + i.size, 0);

const defaultPolicy: CachePolicy = {
   maxItems: 0,
   maxAge: 0,
   maxBytes: 0
};

/**
 * Cache items of type `T` in memory.
 */
export class Cache<T> {
   private _items: Map<string, CacheItem<T>>;
   private _policy: CachePolicy;
   private _evictTimer: NodeJS.Timer;
   /**
    * Whether stored item types can have their byte size measured.
    */
   private _canMeasureSize: boolean = true;

   events: EventEmitter<EventType, any>;

   constructor(policy: Partial<CachePolicy> = {}) {
      this._items = new Map();
      this._policy = merge(defaultPolicy, policy);
      this.events = new EventEmitter();
   }

   /**
    * Number of items in cache.
    */
   get length(): number {
      return this._items.size;
   }

   /**
    * Total byte size of items or -1 if size can't be measured.
    */
   get size(): number {
      return this._canMeasureSize ? totalSize(this._items) : -1;
   }

   /**
    * Whether cache contains a key.
    */
   contains(key: string, allowEmpty: boolean = false): boolean {
      return (
         this._items.has(key) && (allowEmpty || !is.empty(this._items.get(key)))
      );
   }

   add(key: string, value: T) {
      if (is.value<T>(value)) {
         let size = 0;
         if (this._canMeasureSize) {
            size = byteSize(value);
            if (size == -1) {
               this._canMeasureSize = false;
               size = 0;
            }
         }

         this._items.set(key, {
            key,
            value,
            added: new Date().getTime(),
            size
         });
      }
      this.schedulePrune();
      return this;
   }

   /**
    * Asynchronous check for evictable items.
    */
   private schedulePrune(): Cache<T> {
      if (this._evictTimer) {
         clearTimeout(this._evictTimer);
      }
      this._evictTimer = setTimeout(this.prune.bind(this), 10);
      return this;
   }

   /**
    * Remove items per cache policy and notify listeners.
    */
   prune(): void {
      if (
         this.length > 0 &&
         (this._policy.maxAge != 0 ||
            this._policy.maxItems != 0 ||
            this._policy.maxBytes != 0)
      ) {
         /** Sorted objects allow removal of oldest */
         let sorted: CacheItem<T>[] = Array.from(this._items.values());
         /** List of item keys to be removed */
         let remove: string[] = [];

         sorted.sort((a, b) => a.added - b.added);

         // first remove those that exceed maximum age
         if (this._policy.maxAge > 0) {
            const oldest = new Date().getTime() - this._policy.maxAge;
            remove = remove.concat(
               sorted.filter(i => i.added < oldest).map(i => i.key)
            );
            sorted = sorted.filter(i => remove.indexOf(i.key) == -1);
         }

         // then remove items beyond the maximum count
         if (
            this._policy.maxItems > 0 &&
            sorted.length > this._policy.maxItems
         ) {
            const tooMany = sorted.length - this._policy.maxItems;
            remove = remove.concat(sorted.slice(0, tooMany).map(i => i.key));
            // only keep sorted items that aren't in the remove list
            sorted = sorted.filter(i => remove.indexOf(i.key) == -1);
         }

         // finally remove as many as are needed to go below maximum byte size
         if (this._policy.maxBytes > 0 && this._canMeasureSize) {
            let remainingSize = totalSize(this._items, remove);

            while (remainingSize > this._policy.maxBytes) {
               const item = sorted.shift();
               if (item !== undefined) {
                  remainingSize -= item.size;
                  remove.push(item.key);
               }
            }
         }

         if (remove.length > 0) {
            remove.forEach(key => {
               this._items.delete(key);
            });

            this.events.emit(EventType.ItemsEvicted, remove);
         }
      }
   }

   /**
    * @param silent Supress events if `true`
    */
   get(key: string, silent = false): T | null {
      if (this._items.has(key)) {
         const item = this._items.get(key);
         return is.value(item) ? item.value : null;
      } else {
         if (!silent) {
            this.events.emit(EventType.KeyNotFound, key);
         }
         return null;
      }
   }

   remove(key: string): Cache<T> {
      this._items.delete(key);
      return this;
   }

   clear(): Cache<T> {
      this._items.clear();
      return this;
   }

   /**
    * Apply new cache policy and prune accordingly.
    */
   updatePolicy(policy: Partial<CachePolicy>): Cache<T> {
      this._policy = merge(defaultPolicy, policy);
      return this.schedulePrune();
   }
}
