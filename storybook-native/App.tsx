import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

/**
 * Placeholder shown only when Storybook is disabled. This host exists purely to
 * run on-device Storybook, so the real entry is `../.rnstorybook` (loaded by the
 * `withStorybook` wrapper when `STORYBOOK_ENABLED=true`).
 */
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.text}>
        Firna UI native Storybook host.{"\n\n"}Run `npm run storybook:native`
        (sets STORYBOOK_ENABLED=true) to load the component explorer.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  text: { fontSize: 16, lineHeight: 24, textAlign: "center" },
});
