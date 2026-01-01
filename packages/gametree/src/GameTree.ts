import { Draft } from './Draft';
import { Hasher } from './Hasher';
import type { GameTreeNode, GameTreeOptions, CurrentsObject, IdType, Primitive } from './index';

/**
 * Immutable game tree data structure
 */
export class GameTree<T = Record<string, Primitive[]>> {
  getId: () => IdType;
  merger: (node: GameTreeNode<T>, data: T) => T | null;
  root: GameTreeNode<T>;
  _idAliases: Record<IdType, IdType>;

  constructor({ getId, merger, root }: GameTreeOptions<T> = {}) {
    // Initialize root node first (we need it to scan for max ID)
    const rootNode: GameTreeNode<T> = {
      id: 0, // Temporary ID, will be updated if provided in root
      data: {} as T,
      parentId: null,
      children: [],
      ...(root || {}),
    };

    // If no getId provided, create a counter that starts after max existing ID
    if (!getId) {
      // Find max ID in the tree to avoid collisions
      let maxId = -1;
      const scanForMaxId = (node: GameTreeNode<T>): void => {
        const nodeId = typeof node.id === 'number' ? node.id : -1;
        if (nodeId > maxId) maxId = nodeId;
        node.children.forEach(scanForMaxId);
      };
      scanForMaxId(rootNode);

      // Start counter after max existing ID
      let id = maxId + 1;
      this.getId = () => id++;
    } else {
      this.getId = getId;
    }

    // Default merger (no merging)
    this.merger = merger || (() => null);

    this.root = rootNode;
    this._idAliases = {};
  }

  get(id: IdType | null): GameTreeNode<T> | null {
    if (id == null) return null;
    if (id in this._idAliases) return this.get(this._idAliases[id]);

    const inner = (node: GameTreeNode<T>): GameTreeNode<T> | null => {
      if (node.id === id) return node;

      for (const child of node.children) {
        const result = inner(child);
        if (result != null) return result;
      }

      return null;
    };

    return inner(this.root);
  }

  *getSequence(id: IdType): Generator<GameTreeNode<T>> {
    let node = this.get(id);
    if (node == null) return;
    yield node;

    const visited = new Set<IdType>();
    visited.add(node.id);

    while (node.children.length === 1) {
      node = node.children[0];

      // Prevent infinite loop
      if (visited.has(node.id)) {
        console.error('Circular reference detected in getSequence!', node.id);
        break;
      }
      visited.add(node.id);

      yield node;
    }
  }

  mutate(mutator: (draft: Draft<T>) => void): GameTree<T> {
    const draft = new Draft(this);

    mutator(draft);
    if (draft.root === this.root) return this;

    const tree = new GameTree<T>({
      getId: this.getId,
      merger: this.merger,
      root: draft.root,
    });

    tree._idAliases = draft._idAliases;

    return tree;
  }

  navigate(id: IdType, step: number, currents: CurrentsObject = {}): GameTreeNode<T> | null {
    const node = this.get(id);

    if (node == null) return null;
    if (step === 0) return node;
    if (step < 0 && node.parentId != null) return this.navigate(node.parentId, step + 1, currents);

    const nextId =
      currents[node.id] != null
        ? currents[node.id]
        : node.children.length > 0
          ? node.children[0].id
          : null;

    if (nextId == null) return null;
    return this.navigate(nextId, step - 1, currents);
  }

  *listNodes(): Generator<GameTreeNode<T>> {
    function* inner(node: GameTreeNode<T>): Generator<GameTreeNode<T>> {
      yield node;

      for (const child of node.children) {
        yield* inner(child);
      }
    }

    yield* inner(this.root);
  }

  *listNodesHorizontally(startId: IdType, step: 1 | -1): Generator<GameTreeNode<T>> {
    if (Math.abs(step) !== 1) throw new Error('Invalid value for step, only -1 or 1 allowed');

    let level = this.getLevel(startId);
    if (level == null) return;

    let section = [...this.getSection(level)];
    let index = section.findIndex(node => node.id === startId);

    while (section[index] != null) {
      while (0 <= index && index < section.length) {
        yield section[index];
        index += step;
      }

      level += step;
      section =
        step > 0
          ? ([] as GameTreeNode<T>[]).concat(...section.map(node => node.children))
          : [...this.getSection(level)];
      index = step > 0 ? 0 : section.length - 1;
    }
  }

  *listNodesVertically(
    startId: IdType,
    step: 1 | -1,
    currents: CurrentsObject = {}
  ): Generator<GameTreeNode<T>> {
    if (Math.abs(step) !== 1) throw new Error('Invalid value for step, only -1 or 1 allowed');

    let node: GameTreeNode<T> | null = this.get(startId);
    const visited = new Set<IdType>();

    while (node != null) {
      // Prevent infinite loop
      if (visited.has(node.id)) {
        console.error('Circular reference detected in listNodesVertically!', node.id);
        break;
      }
      visited.add(node.id);

      yield node;
      node = this.navigate(node.id, step, currents);
    }
  }

  *listCurrentNodes(currents: CurrentsObject = {}): Generator<GameTreeNode<T>> {
    yield* this.listNodesVertically(this.root.id, 1, currents);
  }

  *listMainNodes(): Generator<GameTreeNode<T>> {
    yield* this.listCurrentNodes({});
  }

  getLevel(id: IdType): number | null {
    let result = -1;

    for (const node of this.listNodesVertically(id, -1, {})) {
      result++;
    }

    return result < 0 ? null : result;
  }

  *getSection(level: number): Generator<GameTreeNode<T>> {
    if (level < 0) return;
    if (level === 0) {
      yield this.root;
      return;
    }

    for (const parent of this.getSection(level - 1)) {
      yield* parent.children;
    }
  }

  getCurrentHeight(currents: CurrentsObject = {}): number {
    let result = 0;
    let node: GameTreeNode<T> | undefined = this.root;
    const visited = new Set<IdType>();

    while (node != null) {
      // Prevent infinite loop
      if (visited.has(node.id)) {
        console.error('Circular reference detected in getCurrentHeight!', node.id);
        break;
      }
      visited.add(node.id);

      result++;
      node =
        currents[node.id] == null
          ? node.children[0]
          : node.children.find(child => child.id === currents[node!.id]);
    }

    return result;
  }

  getHeight(): number {
    const inner = (node: GameTreeNode<T>): number => {
      let max = 0;

      for (const child of node.children) {
        max = Math.max(max, inner(child));
      }

      return max + 1;
    };

    return inner(this.root);
  }

  getStructureHash(): string {
    const hash = Hasher.new();

    const inner = (node: GameTreeNode<T>): number => {
      hash('[' + JSON.stringify(node.id) + ',');
      node.children.forEach(inner);
      return hash(']');
    };

    const structureHash = inner(this.root);
    return (structureHash >>> 0) + '';
  }

  getHash(): string {
    const hash = Hasher.new();

    const inner = (node: GameTreeNode<T>): number => {
      hash('[' + JSON.stringify(node.data) + ',');
      node.children.forEach(inner);
      return hash(']');
    };

    const dataHash = inner(this.root);
    return (dataHash >>> 0) + '';
  }

  onCurrentLine(id: IdType, currents: CurrentsObject = {}): boolean {
    for (const node of this.listNodesVertically(id, -1, {})) {
      const { parentId } = node;

      if (
        parentId != null &&
        currents[parentId] !== node.id &&
        (currents[parentId] != null || this.get(parentId)!.children[0] !== node)
      )
        return false;
    }

    return true;
  }

  onMainLine(id: IdType): boolean {
    return this.onCurrentLine(id, {});
  }

  toJSON(): GameTreeNode<T> {
    return this.root;
  }
}
