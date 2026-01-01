import type { GameTree } from './GameTree';
import type { GameTreeNode, IdType } from './index';

/**
 * Purely functional cache for GameTree operations.
 * Uses WeakMaps to cache expensive computations without mutating the GameTree.
 * The cache automatically cleans up when GameTree instances are garbage collected.
 */
export class GameTreeCache<T = Record<string, any>> {
  private _nodeCache: WeakMap<GameTree<T>, Map<IdType, GameTreeNode<T> | null>>;
  private _heightCache: WeakMap<GameTree<T>, number>;
  private _hashCache: WeakMap<GameTree<T>, string>;
  private _structureHashCache: WeakMap<GameTree<T>, string>;

  constructor() {
    this._nodeCache = new WeakMap();
    this._heightCache = new WeakMap();
    this._hashCache = new WeakMap();
    this._structureHashCache = new WeakMap();
  }

  /**
   * Get a node by ID with caching
   */
  get(tree: GameTree<T>, id: IdType | null): GameTreeNode<T> | null {
    if (id == null) return null;

    let cache = this._nodeCache.get(tree);
    if (!cache) {
      cache = new Map();
      this._nodeCache.set(tree, cache);
    }

    if (cache.has(id)) {
      return cache.get(id) ?? null;
    }

    const node = tree.get(id);
    cache.set(id, node);
    return node;
  }

  /**
   * Get the height of the tree with caching
   */
  getHeight(tree: GameTree<T>): number {
    const cached = this._heightCache.get(tree);
    if (cached !== undefined) return cached;

    const height = tree.getHeight();
    this._heightCache.set(tree, height);
    return height;
  }

  /**
   * Get the data hash with caching
   */
  getHash(tree: GameTree<T>): string {
    const cached = this._hashCache.get(tree);
    if (cached !== undefined) return cached;

    const hash = tree.getHash();
    this._hashCache.set(tree, hash);
    return hash;
  }

  /**
   * Get the structure hash with caching
   */
  getStructureHash(tree: GameTree<T>): string {
    const cached = this._structureHashCache.get(tree);
    if (cached !== undefined) return cached;

    const hash = tree.getStructureHash();
    this._structureHashCache.set(tree, hash);
    return hash;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this._nodeCache = new WeakMap();
    this._heightCache = new WeakMap();
    this._hashCache = new WeakMap();
    this._structureHashCache = new WeakMap();
  }

  /**
   * Clear cache for a specific tree
   */
  clearTree(tree: GameTree<T>): void {
    this._nodeCache.delete(tree);
    this._heightCache.delete(tree);
    this._hashCache.delete(tree);
    this._structureHashCache.delete(tree);
  }
}
