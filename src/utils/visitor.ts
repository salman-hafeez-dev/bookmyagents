// An anonymous, browser-local id used only so repeat taps from the same person
// collapse into one lead instead of inflating an agent's numbers.
//
// Never sent anywhere except with a lead, never shown to agents, and a new one
// is minted if storage is unavailable — the worst case is a duplicate lead,
// which is better than failing the action the customer asked for.
const STORAGE_KEY = 'bma_visitor_id';

const randomId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export const getVisitorId = (): string => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = randomId();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Private browsing, blocked storage: still return something usable.
    return randomId();
  }
};
