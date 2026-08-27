type Prefetch = {
  pain: string;
  promise: Promise<Response>;
};

let inflight: Prefetch | null = null;

export function prefetchFirstQuestion(painPoint: string) {
  const pain = painPoint.trim();
  if (pain.length < 8) return;
  if (inflight?.pain === pain) return;
  inflight = {
    pain,
    promise: fetch("/api/onboarding/next", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ painPoint: pain, answers: [] }),
    }),
  };
}

export function takePrefetch(painPoint: string) {
  if (inflight?.pain === painPoint.trim()) {
    const next = inflight.promise;
    inflight = null;
    return next;
  }
  return null;
}
