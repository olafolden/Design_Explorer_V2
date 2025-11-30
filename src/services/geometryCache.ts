import * as THREE from 'three';

interface CacheEntry {
  geometry: THREE.BufferGeometry;
  lastAccessed: number;
}

export class GeometryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 15) {
    this.maxSize = maxSize;
  }

  set(key: string, geometry: THREE.BufferGeometry) {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      geometry,
      lastAccessed: Date.now(),
    });
  }

  get(key: string): THREE.BufferGeometry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    entry.lastAccessed = Date.now();
    return entry.geometry;
  }

  private evictOldest() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        entry.geometry.dispose();  // Free GPU memory
      }
      this.cache.delete(oldestKey);
    }
  }

  clear() {
    for (const entry of this.cache.values()) {
      entry.geometry.dispose();
    }
    this.cache.clear();
  }
}

export const geometryCache = new GeometryCache(15);
