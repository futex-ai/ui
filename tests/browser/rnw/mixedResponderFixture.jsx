import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Pressable, Text } from "react-native-web";

import { Scrubber } from "@firna/ui/video-editor";

function MixedResponderFixture() {
  const [time, setTime] = useState(0);
  const [pressStarts, setPressStarts] = useState(0);
  return (
    <>
      <Scrubber
        accessibilityLabel="Video position"
        currentTime={time}
        duration={100}
        fps={1}
        onSeek={setTime}
        style={{ width: 300 }}
      />
      <Pressable
        accessibilityRole="button"
        delayPressIn={0}
        onPressIn={() => setPressStarts((count) => count + 1)}
        style={({ pressed }) => ({
          alignItems: "center",
          backgroundColor: pressed ? "#adc1b5" : "#f3f6f4",
          height: 40,
          justifyContent: "center",
          marginTop: 16,
          width: 200,
        })}
      >
        <Text>App button</Text>
      </Pressable>
      <output>App press starts: {pressStarts}</output>
    </>
  );
}

createRoot(document.getElementById("root")).render(<MixedResponderFixture />);
