import { useId } from 'react';

/**
 * Generates the id trio a labelled control needs: the control itself, its
 * error message and its hint, so `htmlFor` and `aria-describedby` always point
 * somewhere real.
 *
 * Its own file rather than living in Field.tsx: a module that exports both a
 * component and a hook breaks React Fast Refresh.
 */
export const useFieldIds = (providedId?: string) => {
  const generated = useId();
  const id = providedId || `ui-${generated}`;
  return { id, errorId: `${id}-error`, hintId: `${id}-hint` };
};

export default useFieldIds;
