import pTimeout from 'p-timeout';

// It's used to track the number of requests that are in flight.
// This is important because we don't want to kill the pod when `DELETE` or `POST` action is in progress.
export function useActionTracker() {
  let actionsInProgress = 0;

  function done() {
    --actionsInProgress;
  }

  function started() {
    ++actionsInProgress;
  }

  return {
    wrap<T, A>(fn: (arg: A) => Promise<T>) {
      return (arg: A) => {
        started();
        return fn(arg).finally(done);
      };
    },
    idle() {
      return actionsInProgress === 0;
    },
  };
}

export function until(fn: () => boolean, timeout: number): Promise<void> {
  return pTimeout(
    new Promise(resolve => {
      const interval = setInterval(() => {
        if (fn()) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    }),
    {
      milliseconds: timeout,
    },
  );
}
