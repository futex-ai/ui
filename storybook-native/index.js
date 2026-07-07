import { registerRootComponent } from "expo";

// When STORYBOOK_ENABLED=true, the Metro `withStorybook` wrapper swaps this entry
// for the Storybook UI (`../.rnstorybook`). Without it, the placeholder `App`
// below renders — a quick check that the Expo host itself boots.
import App from "./App";

registerRootComponent(App);
