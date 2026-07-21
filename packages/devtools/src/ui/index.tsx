/**
 * React bindings for the visual devtools UI — thin adapters over the framework-agnostic renderer in
 * `@mithril/devtools/dom`. The DOM renderer is the single implementation; these components mount it into a
 * container and forward prop updates. React is a peer dependency.
 *
 * For non-React apps use `@mithril/devtools/element` (Web Components) or `@mithril/devtools/dom` (mount
 * functions) directly — same UI, no React. Import `@mithril/devtools/ui.css` for styling in every case.
 *
 * @packageDocumentation
 */

import { useEffect, useRef } from "react";
import {
  DEVTOOLS_CHANNEL,
  type DevtoolsHandle,
  type DevtoolsPanelOptions,
  type EventListOptions,
  mountDevtoolsPanel,
  mountEventList,
  mountRunInspector,
  mountStateTree,
  type RunInspectorOptions,
  type RunSource,
  type StateTreeOptions,
} from "../dom.ts";

export { DEVTOOLS_CHANNEL };
export type { RunSource };

// Mount a vanilla renderer into a container div and keep it in sync with React props. The renderer owns its
// own DOM + streaming; React only supplies the container and forwards option changes on re-render.
function useMount<O>(mountFn: (el: HTMLElement, options: O) => DevtoolsHandle<O>, options: O) {
  const ref = useRef<HTMLDivElement | null>(null);
  const handle = useRef<DevtoolsHandle<O> | null>(null);
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    if (ref.current === null) return undefined;
    const mounted = mountFn(ref.current, latest.current);
    handle.current = mounted;
    return () => {
      mounted.destroy();
      handle.current = null;
    };
  }, [mountFn]);
  useEffect(() => {
    handle.current?.update(options);
  });
  return ref;
}

/** Props for {@link RunInspector}: a run source ({@link RunInspectorOptions}) plus an optional `className`. */
export interface RunInspectorProps extends RunInspectorOptions {
  readonly className?: string;
}

/** The full inspector: meters, suspension card, time-travel scrubber, event list, and state/span tree. */
export function RunInspector({ className, ...options }: RunInspectorProps) {
  const ref = useMount(mountRunInspector, options);
  return <div ref={ref} className={className} />;
}

/** Props for {@link EventList}. */
export type EventListProps = EventListOptions;

/** The scrollable, colour-coded event log; click a row to time-travel. Controlled via `cursor`/`onSelect`. */
export function EventList(props: EventListProps) {
  const ref = useMount(mountEventList, props);
  return <div ref={ref} />;
}

/** Props for {@link StateTree}. */
export type StateTreeProps = StateTreeOptions;

/** The message/tool transcript plus a span/sub-run tree at `cursor`. */
export function StateTree(props: StateTreeProps) {
  const ref = useMount(mountStateTree, props);
  return <div ref={ref} />;
}

/** Props for {@link DevtoolsPanel}: {@link DevtoolsPanelOptions} plus an optional `className`. */
export interface DevtoolsPanelProps extends DevtoolsPanelOptions {
  readonly className?: string;
}

/** A multi-run panel that live-tails every run via the attach `BroadcastChannel`. */
export function DevtoolsPanel({ className, ...options }: DevtoolsPanelProps) {
  const ref = useMount(mountDevtoolsPanel, options);
  return <div ref={ref} className={className} />;
}
