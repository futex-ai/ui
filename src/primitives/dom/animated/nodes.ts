/**
 * The base of the animation graph: a node, and a node with children.
 *
 * Transcribed from React Native's `Animated/nodes/AnimatedNode.js` and
 * `AnimatedWithChildren.js` as `react-native-web` 0.21.2 vendors them, with the
 * native-driver half removed — the DOM backend only ever runs the JS driver, so
 * `__makeNative`, native tags and the `useNativeDriver` config are dropped
 * rather than stubbed (plan: `useNativeDriver` is ignored on web).
 *
 * The graph is a tree of values, interpolations, styles and prop bags. A value
 * that changes calls its listeners and cascades `__callListeners` down to its
 * children, while `AnimatedValue._updateValue` separately walks the tree to
 * find the `AnimatedProps` nodes that have to re-render.
 */

/** A listener registered on a node. */
export type ValueListenerCallback = (state: { value: number }) => unknown;

let uniqueId = 1;

/** Any node in the animation graph. */
export class AnimatedNode {
  private _listeners: Record<string, ValueListenerCallback> = {};

  /** Called when the node gains its first child. */
  __attach(): void {}

  /** Called when the node loses its last child. */
  __detach(): void {}

  /** The node's plain value, as a style or prop would use it. */
  __getValue(): unknown {
    return undefined;
  }

  /** The value a native driver would use; identical here. */
  __getAnimatedValue(): unknown {
    return this.__getValue();
  }

  __addChild(_child: AnimatedNode): void {}

  __removeChild(_child: AnimatedNode): void {}

  __getChildren(): AnimatedNode[] {
    return [];
  }

  /** Observes updates; returns an id for {@link AnimatedNode.removeListener}. */
  addListener(callback: ValueListenerCallback): string {
    const id = String(uniqueId++);
    this._listeners[id] = callback;
    return id;
  }

  /** Removes the listener registered under `id`. */
  removeListener(id: string): void {
    delete this._listeners[id];
  }

  /** Removes every listener registered on this node. */
  removeAllListeners(): void {
    this._listeners = {};
  }

  /** Whether any listener is attached. */
  hasListeners(): boolean {
    return Object.keys(this._listeners).length > 0;
  }

  /** Notifies this node's own listeners. */
  __callListeners(value: number): void {
    for (const key of Object.keys(this._listeners)) {
      this._listeners[key]({ value });
    }
  }

  toJSON(): unknown {
    return this.__getValue();
  }
}

/** A node other nodes can depend on. */
export class AnimatedWithChildren extends AnimatedNode {
  private _children: AnimatedNode[] = [];

  __addChild(child: AnimatedNode): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
  }

  __removeChild(child: AnimatedNode): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      return;
    }
    this._children.splice(index, 1);
    if (this._children.length === 0) {
      this.__detach();
    }
  }

  __getChildren(): AnimatedNode[] {
    return this._children;
  }

  /**
   * Notifies this node's listeners, then cascades to its children so a listener
   * on an interpolation sees the interpolated value rather than the driver's.
   */
  __callListeners(value: number): void {
    super.__callListeners(value);
    for (const child of this._children) {
      child.__callListeners(child.__getValue() as number);
    }
  }
}
