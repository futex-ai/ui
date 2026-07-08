/** Provider that owns the toast queue and publishes the {@link useToast} API. */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { ToastContext } from "./ToastContext";
import type { ToastApi } from "./ToastContext";
import { ToastViewport } from "./ToastViewport";
import { registerToastProviderApi } from "./toastController";
import {
  createToastItem,
  DEFAULT_TOAST_DURATION,
  DEFAULT_TOAST_MAX,
  DEFAULT_TOAST_PLACEMENT,
  dequeueToast,
  enqueueToast,
  makeToastId,
} from "./toastModel";
import type { ToastItem, ToastOptions, ToastPlacement } from "./toastModel";

const ToastProviderDepthContext = createContext(0);

export type ToastProviderProps = {
  /** The subtree that can call {@link useToast}. */
  children: ReactNode;
  /** Where the stack is pinned. Defaults to `bottom-right`. */
  placement?: ToastPlacement;
  /** Cap on simultaneously visible toasts; oldest are dropped. Defaults to 4. */
  max?: number;
  /** Default auto-dismiss delay (ms) for toasts that omit `duration`. */
  duration?: number;
};

/**
 * Owns the live toast queue and renders the {@link ToastViewport}. Each toast
 * runs its own auto-dismiss countdown (see {@link Toast}), so the provider only
 * enqueues, dequeues, and caps the queue. Mount it once near the app root,
 * inside `SharedUiThemeProvider`.
 */
export function ToastProvider({
  children,
  placement = DEFAULT_TOAST_PLACEMENT,
  max = DEFAULT_TOAST_MAX,
  duration = DEFAULT_TOAST_DURATION,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seqRef = useRef(0);
  const parentDepth = useContext(ToastProviderDepthContext);
  const depth = parentDepth + 1;

  const dismiss = useCallback((id: string) => {
    setToasts((list) => dequeueToast(list, id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = makeToastId(seqRef.current);
      seqRef.current += 1;
      const item = createToastItem(id, options, duration);
      setToasts((list) => enqueueToast(list, item, max));
      return id;
    },
    [duration, max],
  );

  const api = useMemo<ToastApi>(
    () => ({ dismiss, dismissAll, toast }),
    [dismiss, dismissAll, toast],
  );

  useLayoutEffect(() => registerToastProviderApi(api, depth), [api, depth]);

  return (
    <ToastProviderDepthContext.Provider value={depth}>
      <ToastContext.Provider value={api}>
        {children}
        <ToastViewport
          onDismiss={dismiss}
          placement={placement}
          toasts={toasts}
        />
      </ToastContext.Provider>
    </ToastProviderDepthContext.Provider>
  );
}
