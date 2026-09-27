import { getCurrentScope, onScopeDispose } from "vue";

export function useAbortable() {
  let controller: AbortController | null = null;

  const cleanup = () => {
    controller?.abort();
    controller = null;
  };

  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    signal() {
      controller?.abort();
      controller = new AbortController();
      return controller.signal;
    },
  };
}
