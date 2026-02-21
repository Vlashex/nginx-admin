export type RuntimeSyncState =
  | "IN_SYNC"
  | "PENDING_APPLY"
  | "APPLYING"
  | "OUT_OF_SYNC"
  | "DEGRADED";

export interface RevisionCursor {
  desiredRevision: number;
  observedRevision: number;
}

export interface RuntimeStatus {
  syncState: RuntimeSyncState;
  revision: RevisionCursor;
}

// TODO(daemon-2.x): wire runtime status transitions to daemon reconcile/apply lifecycle.
