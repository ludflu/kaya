/**
 * @kaya/gametree - An immutable game tree data type
 *
 * Ported from @sabaki/immutable-gametree
 * Original: https://github.com/SabakiHQ/immutable-gametree
 * License: MIT
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a node in the game tree
 */
export interface GameTreeNode<T = Record<string, Primitive[]>> {
  id: IdType;
  data: T;
  parentId: IdType | null;
  children: GameTreeNode<T>[];
}

/**
 * Currents object specifies distinguished children of nodes.
 * Maps node ID to the ID of its distinguished child.
 */
export type CurrentsObject = Record<IdType, IdType>;

/**
 * Primitive value types allowed for node IDs and data values
 */
export type Primitive = string | number | boolean | null;

/**
 * ID types that can be used as object keys (excludes null and boolean)
 */
export type IdType = string | number;

/**
 * Options for creating a new GameTree
 */
export interface GameTreeOptions<T = Record<string, Primitive[]>> {
  getId?: () => IdType;
  merger?: (node: GameTreeNode<T>, data: T) => T | null;
  root?: Partial<GameTreeNode<T>>;
}

/**
 * Options for appending a node
 */
export interface AppendNodeOptions {
  disableMerging?: boolean;
}

// ============================================================================
// Re-exports
// ============================================================================

export { Hasher } from './Hasher';
export { Draft } from './Draft';
export { GameTree } from './GameTree';
