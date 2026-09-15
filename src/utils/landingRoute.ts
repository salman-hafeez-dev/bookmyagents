// Where a user lands straight after signing in or registering.
//
// Agents go to their dashboard rather than the marketing home page: their
// profile has to be completed and approved before they are publicly visible,
// and the dashboard's Profile tab is where that happens.
export const landingRouteForRole = (role?: string): string => {
  switch (role) {
    case 'agent':
      return '/agent-dashboard';
    case 'admin':
      return '/dashboard';
    default:
      return '/';
  }
};
