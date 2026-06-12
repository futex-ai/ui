import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

import { WEB_MODAL_LAYERS } from "./modalLayers";

const fixedPosition = "fixed" as unknown as "absolute";

export function createWebModalFrameStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(20, 28, 22, 0.36)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: WEB_MODAL_LAYERS.backdrop,
    },
    body: { gap: 12, padding: 14, paddingTop: 0 },
    center: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      padding: 24,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: WEB_MODAL_LAYERS.surface,
    },
    centerSheet: { justifyContent: "flex-end", padding: 0 },
    closeButton: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    disabled: { opacity: 0.55 },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-end",
      padding: 14,
      paddingTop: 12,
    },
    grip: {
      alignSelf: "center",
      backgroundColor: theme.colors.border2,
      borderRadius: theme.radii.pill,
      height: 4,
      marginBottom: 2,
      marginTop: 8,
      width: 36,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      padding: 14,
      paddingBottom: 12,
    },
    layer: {
      bottom: 0,
      left: 0,
      pointerEvents: "box-none",
      position: fixedPosition,
      right: 0,
      top: 0,
      zIndex: WEB_MODAL_LAYERS.portal,
    },
    subtitle: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 13,
      lineHeight: 19.5,
      marginTop: 2,
    },
    surface: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      boxShadow: "0 20px 60px rgba(20, 28, 22, 0.28)",
      maxHeight: "92%",
      overflow: "hidden",
      width: "100%",
      zIndex: WEB_MODAL_LAYERS.surface,
    },
    surfaceSheet: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      maxWidth: "100%",
      width: "100%",
    },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 18,
      fontWeight: "800",
      lineHeight: 27,
    },
    titleBlock: { flex: 1, minWidth: 0 },
  });
}
