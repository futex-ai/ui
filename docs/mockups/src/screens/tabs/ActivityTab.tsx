import { RowSection } from "../../components/parts/Rows";
import { activity } from "../../fixtures/work";
import { ActivityRow } from "./OverviewTab";

/** Every event of the project, by day, as two-line rows. */
export function ActivityTab() {
  const groups = [
    { title: "Today", items: activity.filter((item) => item.today) },
    { title: "Earlier", items: activity.filter((item) => !item.today) },
  ];
  return (
    <>
      {groups.map((group) => (
        <RowSection
          bleed
          itemKey={(item) => item.title}
          items={group.items}
          key={group.title}
          renderItem={(item) => <ActivityRow item={item} />}
          title={group.title}
        />
      ))}
    </>
  );
}
