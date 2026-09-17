/**
 * The element an event reports as its `target` / `currentTarget`.
 *
 * Vendored from React Native's `ReactNativeElement` and the read-only DOM-like
 * node tree it extends (`types/public/ReactNativeTypes.d.ts`). It is copied in
 * full, rather than trimmed to the members this library reads, because of
 * parameter contravariance: a consumer's handler typed with React Native's
 * event (`(e: RNLayoutChangeEvent) => void`) is only assignable to our
 * `onLayout` prop if our event is assignable to theirs, and that requires our
 * `currentTarget` to carry every member theirs does.
 *
 * `hostInstance.ts` keeps the small `HostInstance` for what a `ref` yields,
 * which is all the library ever calls.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { NativeMethods } from "./hostInstance";

/** An indexed, iterable collection of child nodes. */
export interface HostNodeList<T> extends Iterable<T> {
  [index: number]: T;
  readonly length: number;
  entries(): Iterator<[number, T]>;
  forEach<ThisType>(
    callbackFn: (value: T, index: number, array: HostNodeList<T>) => unknown,
    thisArg?: ThisType,
  ): void;
  item(index: number): null | T;
  keys(): Iterator<number>;
  values(): Iterator<T>;
  [Symbol.iterator](): Iterator<T>;
}

/** An indexed, iterable collection of child elements. */
export interface HostHTMLCollection<T> extends Iterable<T> {
  [index: number]: T;
  readonly length: number;
  item(index: number): null | T;
  namedItem(name: string): null | T;
  [Symbol.iterator](): Iterator<T>;
}

/** The read-only node interface every host node implements. */
export interface HostReadOnlyNode {
  get childNodes(): HostNodeList<HostReadOnlyNode>;
  compareDocumentPosition(otherNode: HostReadOnlyNode): number;
  contains(otherNode: HostReadOnlyNode): boolean;
  get firstChild(): null | HostReadOnlyNode;
  getRootNode(): HostReadOnlyNode;
  hasChildNodes(): boolean;
  get isConnected(): boolean;
  get lastChild(): null | HostReadOnlyNode;
  get nextSibling(): null | HostReadOnlyNode;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null | string;
  get ownerDocument(): null | HostDocument;
  get parentElement(): null | HostReadOnlyElement;
  get parentNode(): null | HostReadOnlyNode;
  get previousSibling(): null | HostReadOnlyNode;
  get textContent(): string;
}

/** The document a host node belongs to. */
export interface HostDocument extends HostReadOnlyNode {
  get childElementCount(): number;
  get children(): HostHTMLCollection<HostReadOnlyElement>;
  get documentElement(): HostElement;
  get firstElementChild(): null | HostReadOnlyElement;
  getElementById(id: string): null | HostReadOnlyElement;
  get lastElementChild(): null | HostReadOnlyElement;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null;
}

/** The read-only element interface, with box metrics and pointer capture. */
export interface HostReadOnlyElement extends HostReadOnlyNode {
  get childElementCount(): number;
  get children(): HostHTMLCollection<HostReadOnlyElement>;
  get clientHeight(): number;
  get clientLeft(): number;
  get clientTop(): number;
  get clientWidth(): number;
  get firstElementChild(): null | HostReadOnlyElement;
  getBoundingClientRect(): DOMRect;
  hasPointerCapture(pointerId: number): boolean;
  get id(): string;
  get lastElementChild(): null | HostReadOnlyElement;
  get nextElementSibling(): null | HostReadOnlyElement;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null | string;
  set nodeValue(value: string);
  get previousElementSibling(): null | HostReadOnlyElement;
  releasePointerCapture(pointerId: number): void;
  get scrollHeight(): number;
  get scrollLeft(): number;
  get scrollTop(): number;
  get scrollWidth(): number;
  setPointerCapture(pointerId: number): void;
  get tagName(): string;
  get textContent(): string;
}

/** A mounted host element, as an event reports it. */
export interface HostElement extends HostReadOnlyElement, NativeMethods {
  blur(): void;
  focus(): void;
  get offsetHeight(): number;
  get offsetLeft(): number;
  get offsetParent(): null | HostReadOnlyElement;
  get offsetTop(): number;
  get offsetWidth(): number;
  setNativeProps(nativeProps: object): void;
}
