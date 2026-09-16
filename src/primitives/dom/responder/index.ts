/**
 * The gesture responder system, ported from `react-native-web` 0.21.2.
 *
 * `View`, `Text`, `TextInput` and `ScrollView` call {@link useResponderEvents}
 * with the handlers a caller passed; `PanResponder` builds a set of those
 * handlers that carries a `gestureState` alongside each event. The two belong
 * together because the gesture state is computed from the touch history the
 * system maintains — see `ResponderSystem.ts` for the negotiation protocol.
 */
export { PanResponder } from "./PanResponder";
export type { ResponderEvent } from "./createResponderEvent";
export { terminateResponder } from "./ResponderSystem";
export type { ResponderConfig } from "./ResponderSystem";
export {
  RESPONDER_PROPS,
  responderConfig,
  useResponderEvents,
} from "./useResponderEvents";
