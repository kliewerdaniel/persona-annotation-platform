// src/lib/cache/index.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { deploymentConfig } from '../config/deployment';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // For organizing cached items
}

interface CacheItem<T> {
  value: T;
  expires: number; // Unix timestamp in milliseconds
}

export class CacheService {
  private cacheDir: string;
  
  constructor(cacheDir = deploymentConfig.system.cacheDir) {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }
  
  /**
   * Get a value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.getCacheKey(key, options.namespace);
    const cacheFile = this.getCacheFilePath(cacheKey);
    
    try {
      if (!fs.existsSync(cacheFile)) {
        return null;
      }
      
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as CacheItem<T>;
      
      // Check if cache has expired
      if (cacheData.expires && cacheData.expires < Date.now()) {
        await this.delete(key, options);
        return null;
      }
      
      return cacheData.value;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }
  
  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.getCacheKey(key, options.namespace);
    const cacheFile = this.getCacheFilePath(cacheKey);
    
    try {
      const expires = options.ttl ? Date.now() + options.ttl * 1000 : 0;
      
      const cacheData: CacheItem<T> = {
        value,
        expires,
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData), 'utf8');
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
  
  /**
   * Delete a value from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.getCacheKey(key, options.namespace);
    const cacheFile = this.getCacheFilePath(cacheKey);
    
    try {
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  /**
   * Clear all cache or specific namespace
   */
  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        // Clear specific namespace
        const namespaceDir = path.join(this.cacheDir, namespace);
        
        if (fs.existsSync(namespaceDir)) {
          fs.readdirSync(namespaceDir).forEach((file) => {
            fs.unlinkSync(path.join(namespaceDir, file));
          });
        }
      } else {
        // Clear all cache
        fs.readdirSync(this.cacheDir).forEach((dir) => {
          const dirPath = path.join(this.cacheDir, dir);
          
          if (fs.statSync(dirPath).isDirectory()) {
            fs.readdirSync(dirPath).forEach((file) => {
              fs.unlinkSync(path.join(dirPath, file));
            });
          }
        });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  /**
   * Create cache key
   */
  private getCacheKey(key: string, namespace = 'default'): string {
    return `${namespace}:${crypto.createHash('md5').update(key).digest('hex')}`;
  }
  
  /**
   * Get cache file path
   */
  private getCacheFilePath(cacheKey: string): string {
    const [namespace, hash] = cacheKey.split(':');
    const namespaceDir = path.join(this.cacheDir, namespace);
    
    if (!fs.existsSync(namespaceDir)) {
      fs.mkdirSync(namespaceDir, { recursive: true });
    }
    
    return path.join(namespaceDir, `${hash}.json`);
  }
  
  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
}

// Create a singleton instance
export const cacheService = new CacheService();
