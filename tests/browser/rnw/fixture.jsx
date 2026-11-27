import { useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@firna/ui/button";
import { List, ListItem } from "@firna/ui/list";
import { ToastProvider } from "@firna/ui/toast";

const projects = [
  { title: "Overview", link: { href: "#overview", current: true } },
  { title: "Project help", link: { href: "/help", newTab: true } },
];

function RnwFixture() {
  const [navigations, setNavigations] = useState(0);
  return (
    <ToastProvider>
      <List
        accessibilityLabel="Projects"
        itemKey={(project) => project.link.href}
        itemLink={(project) => project.link}
        items={projects}
        onItemNavigate={() => setNavigations((count) => count + 1)}
        renderItem={(project) => <ListItem title={project.title} />}
      />
      <output>Navigations: {navigations}</output>
      <Button onPress={() => {}}>Save</Button>
    </ToastProvider>
  );
}

createRoot(document.getElementById("root")).render(<RnwFixture />);
