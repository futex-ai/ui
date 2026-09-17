/**
 * Where every active touch has been, keyed by identifier.
 *
 * A transcription of `react-native-web` 0.21.2's
 * `modules/useResponderEvents/ResponderTouchHistoryStore.js`. `PanResponder`
 * computes its whole `gestureState` from this bank rather than from the event
 * it was handed, which is why the two have to ship together.
 *
 * Pure apart from the identifiers it is fed; `tests/unit/domResponder.test.ts`
 * pins the recording rules.
 */
import { isMoveish, isStartish } from "./eventTypes";

/** A touch, as {@link createResponderEvent} normalises it. */
export type ResponderTouch = {
  force: number;
  identifier: number;
  locationX: number | undefined;
  locationY: number | undefined;
  pageX: number;
  pageY: number;
  target: EventTarget | null;
  timestamp: number;
};

/** Everything the system remembers about one touch. */
export type TouchRecord = {
  currentPageX: number;
  currentPageY: number;
  currentTimeStamp: number;
  previousPageX: number;
  previousPageY: number;
  previousTimeStamp: number;
  startPageX: number;
  startPageY: number;
  startTimeStamp: number;
  touchActive: boolean;
};

/** The bank of touch records, as a gesture reads it. */
export type TouchHistory = {
  indexOfSingleActiveTouch: number;
  mostRecentTimeStamp: number;
  numberActiveTouches: number;
  touchBank: TouchRecord[];
};

/** The payload shape {@link ResponderTouchHistoryStore.recordTouchTrack} reads. */
export type TouchTrackEvent = {
  changedTouches: ResponderTouch[];
  touches: ResponderTouch[];
};

function timestampForTouch(touch: ResponderTouch): number {
  // The legacy internal implementation spelled this `timeStamp`.
  return (
    (touch as unknown as { timeStamp?: number }).timeStamp ?? touch.timestamp
  );
}

function createTouchRecord(touch: ResponderTouch): TouchRecord {
  const timestamp = timestampForTouch(touch);
  return {
    currentPageX: touch.pageX,
    currentPageY: touch.pageY,
    currentTimeStamp: timestamp,
    previousPageX: touch.pageX,
    previousPageY: touch.pageY,
    previousTimeStamp: timestamp,
    startPageX: touch.pageX,
    startPageY: touch.pageY,
    startTimeStamp: timestamp,
    touchActive: true,
  };
}

function resetTouchRecord(record: TouchRecord, touch: ResponderTouch): void {
  const timestamp = timestampForTouch(touch);
  record.touchActive = true;
  record.startPageX = touch.pageX;
  record.startPageY = touch.pageY;
  record.startTimeStamp = timestamp;
  record.currentPageX = touch.pageX;
  record.currentPageY = touch.pageY;
  record.currentTimeStamp = timestamp;
  record.previousPageX = touch.pageX;
  record.previousPageY = touch.pageY;
  record.previousTimeStamp = timestamp;
}

function recordTouchStart(touch: ResponderTouch, history: TouchHistory): void {
  const record = history.touchBank[touch.identifier];
  if (record) {
    resetTouchRecord(record, touch);
  } else {
    history.touchBank[touch.identifier] = createTouchRecord(touch);
  }
  history.mostRecentTimeStamp = timestampForTouch(touch);
}

/** Shifts current to previous, then records the new position. */
function advanceRecord(record: TouchRecord, touch: ResponderTouch): void {
  record.previousPageX = record.currentPageX;
  record.previousPageY = record.currentPageY;
  record.previousTimeStamp = record.currentTimeStamp;
  record.currentPageX = touch.pageX;
  record.currentPageY = touch.pageY;
  record.currentTimeStamp = timestampForTouch(touch);
}

function recordTouchMove(touch: ResponderTouch, history: TouchHistory): void {
  const record = history.touchBank[touch.identifier];
  if (record) {
    record.touchActive = true;
    advanceRecord(record, touch);
    history.mostRecentTimeStamp = timestampForTouch(touch);
  }
}

function recordTouchEnd(touch: ResponderTouch, history: TouchHistory): void {
  const record = history.touchBank[touch.identifier];
  if (record) {
    record.touchActive = false;
    advanceRecord(record, touch);
    history.mostRecentTimeStamp = timestampForTouch(touch);
  }
}

/** Records the position and time of each active touch. */
export class ResponderTouchHistoryStore {
  private readonly _touchHistory: TouchHistory = {
    // Remembering the single active touch's index keeps the common case from
    // scanning the whole bank on every move.
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0,
    numberActiveTouches: 0,
    touchBank: [],
  };

  /** Folds one normalised DOM event into the bank. */
  recordTouchTrack(topLevelType: string, nativeEvent: TouchTrackEvent): void {
    const history = this._touchHistory;
    if (isMoveish(topLevelType)) {
      for (const touch of nativeEvent.changedTouches) {
        recordTouchMove(touch, history);
      }
      return;
    }
    if (isStartish(topLevelType)) {
      for (const touch of nativeEvent.changedTouches) {
        recordTouchStart(touch, history);
      }
      history.numberActiveTouches = nativeEvent.touches.length;
      if (history.numberActiveTouches === 1) {
        history.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
      }
      return;
    }
    for (const touch of nativeEvent.changedTouches) {
      recordTouchEnd(touch, history);
    }
    history.numberActiveTouches = nativeEvent.touches.length;
    if (history.numberActiveTouches === 1) {
      const { touchBank } = history;
      for (let index = 0; index < touchBank.length; index++) {
        const candidate = touchBank[index];
        if (candidate != null && candidate.touchActive) {
          history.indexOfSingleActiveTouch = index;
          break;
        }
      }
    }
  }

  /** The bank, live rather than copied, as gestures expect. */
  get touchHistory(): TouchHistory {
    return this._touchHistory;
  }
}
