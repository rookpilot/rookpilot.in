"use client";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { selectSpaces } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building, Schedule } from "@/lib/domain/models";

import { createBuildingActions } from "../actions";
import { useBuildingSelection } from "../hooks/use-building-selection";
import { ItemDetail } from "./item-detail";
import { ItemList } from "./item-list";
import { RoomList } from "./room-list";

export function BuildingView() {
  const current = useCurrentBuilding();
  if (!current) return <BuildingSkeleton />;
  if (!current.building) return null;
  return <BuildingEditor data={current.data} building={current.building} />;
}

function BuildingEditor({ data, building }: { data: AppData; building: Building }) {
  const rooms = selectSpaces(data, building.id);
  const buildingItems = data.items.filter((i) => i.buildingId === building.id);
  const { room, item, pane, selectRoom, selectItem, back } = useBuildingSelection(rooms, buildingItems);
  const actions = createBuildingActions(data, building);

  const itemCounts = new Map<string, number>();
  for (const i of buildingItems) itemCounts.set(i.spaceId, (itemCounts.get(i.spaceId) ?? 0) + 1);

  const schedulesByItem = new Map<string, Schedule[]>();
  for (const s of data.schedules) {
    const list = schedulesByItem.get(s.itemId);
    if (list) list.push(s);
    else schedulesByItem.set(s.itemId, [s]);
  }

  return (
    <Page className="max-w-7xl">
      <PageHeader title="Building" description="Rooms, the things in them, and the timers that keep each one maintained." />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.15fr)]">
        <RoomList
          rooms={rooms}
          itemCounts={itemCounts}
          selectedId={room?.id ?? null}
          visibleOnMobile={pane === "rooms"}
          onSelect={selectRoom}
          actions={actions}
        />
        {room && (
          <ItemList
            room={room}
            items={buildingItems.filter((i) => i.spaceId === room.id)}
            schedulesByItem={schedulesByItem}
            selectedId={item?.id ?? null}
            buildingType={building.type}
            today={data.today}
            visibleOnMobile={pane === "items"}
            onSelect={(itemId) => selectItem(room.id, itemId)}
            onBack={back}
            actions={actions}
          />
        )}
        <ItemDetail
          item={item}
          room={room}
          rooms={rooms}
          schedules={item ? (schedulesByItem.get(item.id) ?? []) : []}
          today={data.today}
          visibleOnMobile={pane === "detail"}
          onBack={back}
          onDeleted={() => room && selectRoom(room.id)}
          onMoved={(roomId) => item && selectItem(roomId, item.id)}
          actions={actions}
        />
      </div>
    </Page>
  );
}

export function BuildingSkeleton() {
  return (
    <Page className="max-w-7xl" aria-busy>
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.15fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
      </div>
    </Page>
  );
}
