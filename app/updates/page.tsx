import { readFile } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";

export default async function UpdatesPage() {
  const [user, raw] = await Promise.all([
    getCurrentUser(),
    readFile(path.join(process.cwd(), "docs", "updates.html"), "utf8"),
  ]);
  const signedIn = !!user;
  const body = raw.match(/<body>([\s\S]*)<\/body>/i)?.[1] ?? "";

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src={LOGO_SRC}
          alt=""
          width={64}
          height={64}
          priority
          unoptimized
          className="rounded-2xl shadow-sm"
        />
        <h1 className="mt-3 text-xl font-bold">
          What’s new <span className="text-sm font-normal text-slate-500">{APP_NAME}</span>
        </h1>
        {signedIn && (
          <a href="/updates/download" className="mt-1 text-sm font-semibold text-brand-700">
            Download
          </a>
        )}
      </div>

      <article className="updates" dangerouslySetInnerHTML={{ __html: body }} />

      <p className="cta mt-3 flex flex-col gap-0.5 px-1">
        <Link href="/guide" className="text-sm font-semibold text-brand-700">
          Open how-to guide
        </Link>
        {!signedIn && (
          <span className="text-xs text-slate-400">Needs sign-in. Step-by-step screens with screenshots.</span>
        )}
      </p>

      {!signedIn && (
        <p className="mt-8 text-center text-sm">
          <Link href="/login" className="font-semibold text-brand-700">
            Sign in
          </Link>
        </p>
      )}

      <style>{`
        .updates .log {
          margin: 0 0 0.75rem;
          padding: 1rem 1.1rem;
          background: #fff;
          border-radius: 1rem;
          box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
          border: 1px solid #e2e8f0;
        }
        .updates .date {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #64748b;
        }
        .updates h2 {
          margin: 0.2rem 0 0.4rem;
          color: #0f172a;
          font-size: 1.05rem;
          font-weight: 700;
        }
        .updates .lede {
          margin: 0 0 0.5rem;
          color: #334155;
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .updates ul {
          margin: 0;
          padding-left: 1.25rem;
          list-style-type: disc;
          list-style-position: outside;
          color: #334155;
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .updates li {
          margin: 0 0 0.35rem;
          display: list-item;
        }
        .updates li:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
