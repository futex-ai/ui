/**
 * The `dataSet` prop shared by every library component.
 *
 * `dataSet` is how React Native Web, and this library's own DOM backend,
 * spell `data-*` attributes: each camelCase key becomes one hyphenated
 * attribute on the rendered element, so `{ firnaInitialFocus: "skip" }`
 * renders as `data-firna-initial-focus="skip"`. Native ignores it, since a
 * native view has no attributes.
 *
 * Two things make a helper necessary. React Native's own `View` props do not
 * declare `dataSet`, so a component cannot write `dataSet={dataSet}` on a
 * primitive and still type-check under the native platform resolution; a JSX
 * spread is how the focus-ring markers reach the primitives too. And
 * `dataSet` is one object, so when a host already carries library markers —
 * the focus-ring host markers, the initial-focus skip marker — a caller's
 * attributes must merge into them rather than replace them.
 *
 * A raw DOM element takes the literal `data-*` spelling instead, which
 * {@link dataSetDomProps} produces, the same two spellings the focus-ring and
 * initial-focus markers have.
 */

/** Web `data-*` attributes for a host element, keyed in camelCase. Ignored on native. */
export type DataSet = Record<
  string,
  string | number | boolean | null | undefined
>;

/** The `dataSet` prop as a spreadable object. */
export type DataSetProps = { dataSet?: DataSet | undefined };

/** The same attributes spelled literally, for a raw DOM element. */
export type DataSetDomProps = Record<
  `data-${string}`,
  string | number | boolean
>;

const EMPTY_DATA_SET_PROPS: DataSetProps = Object.freeze({});

const EMPTY_DATA_SET_DOM_PROPS: DataSetDomProps = Object.freeze({});

function hyphenate(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Merges the `dataSet` of every source, in order, into one spreadable prop:
 * `<Pressable {...dataSetProps(focus.focusRingProps, { dataSet })} />`. A
 * later key wins, so a caller's `dataSet` goes last. Sources without a
 * `dataSet` contribute nothing, and when none has one the spread is empty.
 */
export function dataSetProps(
  ...sources: ReadonlyArray<DataSetProps | undefined>
): DataSetProps {
  let merged: DataSet | undefined;
  for (const source of sources) {
    const dataSet = source?.dataSet;
    if (dataSet === undefined) continue;
    merged = merged === undefined ? { ...dataSet } : { ...merged, ...dataSet };
  }
  return merged === undefined ? EMPTY_DATA_SET_PROPS : { dataSet: merged };
}

/**
 * Spells a `dataSet` as the literal attributes a raw DOM element takes:
 * `<div {...dataSetDomProps(dataSet)} />`. React DOM forwards `data-*` props
 * verbatim and drops `dataSet` with a warning, so a component whose host is a
 * raw element — the web rich-text editor's `contentEditable` root — spreads
 * this form instead. Keys hyphenate the way the DOM backend hyphenates them,
 * `null` and `undefined` values are dropped the same way, and an absent
 * `dataSet` spreads nothing.
 */
export function dataSetDomProps(dataSet: DataSet | undefined): DataSetDomProps {
  if (dataSet === undefined) return EMPTY_DATA_SET_DOM_PROPS;
  const domProps: DataSetDomProps = {};
  for (const [key, value] of Object.entries(dataSet)) {
    if (value == null) continue;
    domProps[`data-${hyphenate(key)}`] = value;
  }
  return domProps;
}
