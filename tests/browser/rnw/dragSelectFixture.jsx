import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ScrollView, View } from "react-native";

import { Button } from "@firna/ui/button";
import {
  DragSelectableProvider,
  useDragSelectableTarget,
} from "@firna/ui/drag-select";
import { List, ListItem } from "@firna/ui/list";

const projects = [{ id: "overview", href: "#overview", title: "Overview" }];

function SelectableRow({ children, id, label, stopMouseMove }) {
  const target = useDragSelectableTarget({ id, label });
  return (
    <View
      onMouseMove={
        stopMouseMove ? (event) => event.stopPropagation() : undefined
      }
      ref={target.ref}
    >
      <View {...target.a11yProps} style={{ height: 20 }} />
      {children}
    </View>
  );
}

function TakeoverRows({ label, stopMouseMove }) {
  const [events, setEvents] = useState([]);
  const [navigations, setNavigations] = useState(0);
  const record = (event) => setEvents((previous) => [...previous, event]);

  return (
    <DragSelectableProvider
      accessibilityLabel={label}
      autoScroll={false}
      minimumControlDragDistance={4}
      style={{ width: 220 }}
    >
      <SelectableRow
        id="archive"
        label="Archive row"
        stopMouseMove={stopMouseMove}
      >
        <Button
          block
          onPress={() => record("press")}
          onPressIn={() => record("in")}
          onPressOut={({ nativeEvent }) =>
            record(
              `out:${nativeEvent.type}(${nativeEvent.pageX}, ${nativeEvent.pageY})`,
            )
          }
          onLongPress={() => record("long")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#adc1b5" : "#f3f6f4",
          })}
        >
          Archive
        </Button>
      </SelectableRow>
      <SelectableRow id="overview" label="Overview row">
        <List
          items={projects}
          itemKey={(project) => project.id}
          itemLink={(project) => ({ href: project.href })}
          onItemNavigate={() => setNavigations((count) => count + 1)}
          renderItem={(project) => <ListItem title={project.title} />}
        />
      </SelectableRow>
      <output>Button events: {events.join(", ") || "none"}</output>
      <output>Navigations: {navigations}</output>
    </DragSelectableProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <main>
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <TakeoverRows label="Project rows" />
      <div style={{ padding: 8 }}>Outside provider</div>
    </div>
    <ScrollView testID="rows-scroll-view" style={{ height: 160, width: 260 }}>
      <TakeoverRows label="Scrollable rows" />
      <View style={{ height: 200 }} />
    </ScrollView>
    <TakeoverRows label="Rows that stop mouse moves" stopMouseMove />
  </main>,
);
