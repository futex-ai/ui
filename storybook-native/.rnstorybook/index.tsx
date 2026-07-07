import "react-native-gesture-handler";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerRootComponent } from "expo";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

// Storybook's on-device UI renders through `@gorhom/bottom-sheet`, which requires
// the app root to be wrapped in `GestureHandlerRootView`. `withStorybook` swaps
// the app entry for this file, so it also registers the root component.
function StorybookRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StorybookUIRoot />
    </GestureHandlerRootView>
  );
}

registerRootComponent(StorybookRoot);

export default StorybookRoot;
