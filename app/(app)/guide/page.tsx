import { readFile } from "node:fs/promises";
import { PageHeader } from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import { guideHtmlPath } from "@/lib/guides";

/** The printed guide, shown in the app with steps stacked above each screenshot. */
export default async function GuidePage() {
  const user = await requireUser();
  const raw = await readFile(guideHtmlPath(user.role), "utf8");
  const body = raw.match(/<body>([\s\S]*)<\/body>/i)?.[1] ?? "";
  const html = body.replaceAll('src="images/', 'src="/guide/images/');

  return (
    <>
      <PageHeader
        title="App guide"
        backHref="/settings"
        action={
          <a href="/guide/download" className="pr-1 text-sm font-semibold text-brand-700">
            Download
          </a>
        }
      />
      <article className="guide px-4 py-4" dangerouslySetInnerHTML={{ __html: html }} />
      <style>{`
        .guide h1 { display: none; }
        .guide .lede { margin: 0 0 0.5rem; color: #334155; }
        .guide h2 { margin: 1.25rem 0 0.5rem; color: #2e55a8; font-size: 1.05rem; font-weight: 700; }
        .guide .step, .guide .step.tall { display: block; margin: 0 0 1.25rem; }
        .guide .step p { margin: 0 0 0.4rem; }
        .guide .step img, .guide .step.tall img {
          width: 100%;
          height: auto;
          margin-top: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .guide ul, .guide ol { margin: 0.25rem 0 0; padding-left: 1.15rem; }
        .guide li { margin: 0 0 0.2rem; }
      `}</style>
    </>
  );
}
