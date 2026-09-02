import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/hooks/redux';
import {
  hydrateAdherence,
  toggleStep as toggleStepAction,
} from '../state/adherenceSlice';
import {
  useGetAdherenceQuery,
  usePutAdherenceDayMutation,
} from '../api/adherenceApi';

interface UseAdherenceSyncResult {
  /**
   * Optimistically toggles the step in Redux and mirrors the new day-state
   * to the server in the background. Server failures are swallowed — Redux
   * remains the UI source of truth so the tap never feels lost.
   */
  toggleStep: (date: string, stepId: string) => void;
  /** True until the server snapshot has been merged into local state. */
  isHydrating: boolean;
}

export function useAdherenceSync(): UseAdherenceSyncResult {
  const dispatch = useAppDispatch();
  const isSignedIn = useAppSelector((s) => Boolean(s.auth.uid));
  const hydrated = useAppSelector((s) => s.adherence.hydrated);
  const checks = useAppSelector((s) => s.adherence.checks);

  // Skip the query until we have a Firebase user AND we haven't hydrated
  // yet. Once hydrated, no further server reads are needed for the session.
  const {
    data,
    isLoading: isServerLoading,
    isUninitialized,
  } = useGetAdherenceQuery(undefined, {
    skip: !isSignedIn || hydrated,
  });

  const [putDay] = usePutAdherenceDayMutation();

  useEffect(() => {
    if (data && !hydrated) {
      dispatch(hydrateAdherence({ serverChecks: data.checks }));
    }
  }, [data, hydrated, dispatch]);

  const toggleStep = useCallback(
    (date: string, stepId: string) => {
      // Compute the next stepIds locally so we can send them to the server
      // in the same tick — no waiting for the Redux update to flush.
      const currentIds = checks[date] ?? [];
      const nextIds = currentIds.includes(stepId)
        ? currentIds.filter((id) => id !== stepId)
        : [...currentIds, stepId];

      dispatch(toggleStepAction({ date, stepId }));

      // Fire and forget. Any failure is silently absorbed — the user's tap
      // stays in Redux and will be resynced by the next successful PUT for
      // the same date. If we ever add offline retry, this is where it hooks.
      void putDay({ date, stepIds: nextIds })
        .unwrap()
        .catch(() => undefined);
    },
    [checks, dispatch, putDay]
  );

  return {
    toggleStep,
    isHydrating: isSignedIn && !hydrated && (isServerLoading || isUninitialized),
  };
}
