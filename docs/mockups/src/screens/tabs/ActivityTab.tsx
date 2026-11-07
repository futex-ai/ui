import { useSurface } from "../../components/common/Surface";
import { RowSection } from "../../components/parts/Rows";
import { activity } from "../../fixtures/work";
import { ActivityRow } from "./OverviewTab";

/** Every event of the project, by day, as two-line rows. */
export function ActivityTab() {
  const phone = useSurface() === "phone";
  const groups = [
    { title: "Today", items: activity.filter((item) => item.today) },
    { title: "Earlier", items: activity.filter((item) => !item.today) },
  ];
  return (
    <>
      {groups.map((group) => (
        <RowSection bleed divided={phone} key={group.title} title={group.title}>
          {group.items.map((item) => (
            <ActivityRow item={item} key={item.title} />
          ))}
        </RowSection>
      ))}
    </>
  );
}
