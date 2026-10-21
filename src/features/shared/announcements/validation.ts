import { z } from "zod";

// ADM-03-R9: the reader projection's own item shape -- no "kind" (guideline/announcement)
// field, because the reader result already buckets items into separate "guidelines"/
// "announcements" arrays (ADM-03-R10's UI description), so there is nothing to disambiguate.
export const readerAnnouncementSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    updatedAt: z.string(),
  })
  .strict();
export type ReaderAnnouncement = z.infer<typeof readerAnnouncementSchema>;

const uuid = z.string().max(36).uuid();

export const listPublishedAnnouncementsResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      guidelines: z.array(readerAnnouncementSchema),
      announcements: z.array(readerAnnouncementSchema),
    })
    .strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type ListPublishedAnnouncementsResult = z.infer<
  typeof listPublishedAnnouncementsResultSchema
>;
