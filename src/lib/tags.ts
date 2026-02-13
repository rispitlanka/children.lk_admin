import { Tag } from "@/models/Tag";

/** Ensure all tag names exist in the Tag collection (for future dropdown/autofill). */
export async function ensureTags(tagNames: string[]): Promise<void> {
  const names = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))];
  await Promise.all(
    names.map((name) =>
      Tag.findOneAndUpdate(
        { name },
        { $setOnInsert: { name } },
        { upsert: true }
      )
    )
  );
}
