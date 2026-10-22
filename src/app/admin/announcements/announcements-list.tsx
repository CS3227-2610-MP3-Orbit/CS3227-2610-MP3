import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Announcement } from "@/features/admin/announcements/validation";

import AnnouncementRow from "./announcement-row";
import AnnouncementTableRow from "./announcement-table-row";

/**
 * SH-07-R14 / SH-07-AC17: the same items, in the same order, render as a `Table` at `>= md` and
 * as stacked `Card`s below it -- both halves always render (Tailwind's `hidden`/`md:hidden`
 * toggles which one is in the accessibility tree and on screen for the current viewport).
 */
export default function AnnouncementsList({ items }: { items: Announcement[] }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <AnnouncementTableRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {items.map((item) => (
          <AnnouncementRow key={item.id} item={item} />
        ))}
      </ul>
    </>
  );
}
