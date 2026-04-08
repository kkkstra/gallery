import Image from "next/image";
import { marked } from "marked";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getSettings() {
  const rows = await db.select().from(siteSettings);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export default async function AboutPage() {
  const settings = await getSettings();
  const portraitUrl = settings.about_portrait_url || "";
  const content = settings.about_content || "";
  const html = marked.parse(content, { async: false }) as string;

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-neutral-500">
          The Photographer
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
          About
        </h1>
      </div>

      <div className="grid gap-12 md:grid-cols-[300px_1fr] items-start">
        {portraitUrl && (
          <div className="relative aspect-[3/4] overflow-hidden mx-auto md:mx-0 w-full max-w-[300px]">
            <Image
              src={portraitUrl}
              alt="Photographer portrait"
              fill
              className="object-cover"
              sizes="300px"
            />
          </div>
        )}

        <div
          className="prose-dark"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
