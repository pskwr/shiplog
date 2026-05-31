"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { type FormEvent, useState, useEffect } from "react";
import { fetchRecentPRs } from "@/lib/github/ingest";
import { PlaceholderChangelogGenerator } from "@/lib/changelog/placeholder";
import type { ChangelogEntry } from "@/lib/changelog/types";

export function ChangelogApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") ?? "";

  const [inputValue, setInputValue] = useState(repo);
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(repo);
  }, [repo]);

  useEffect(() => {
    if (!repo) {
      setEntry(null);
      setError(null);
      return;
    }

    const slash = repo.indexOf("/");
    const owner = slash > 0 ? repo.slice(0, slash) : "";
    const name = slash > 0 ? repo.slice(slash + 1) : "";

    if (!owner || !name || repo.includes(" ")) {
      setError("Invalid format. Use owner/repo (e.g. vercel/next.js).");
      setEntry(null);
      return;
    }

    setLoading(true);
    setError(null);
    setEntry(null);

    let cancelled = false;

    fetchRecentPRs(owner, name)
      .then(async (result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.prs.length === 0) {
          setError(`No recent merged pull requests found for ${repo}.`);
          return;
        }
        const generator = new PlaceholderChangelogGenerator();
        const e = await generator.generate(result.prs);
        if (!cancelled) setEntry(e);
      })
      .catch(() => {
        if (!cancelled) setError("Unexpected error fetching changelog.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [repo]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputValue.trim();
    if (value) {
      router.push(`/changelog?repo=${encodeURIComponent(value)}`);
    }
  }

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <h1>Shiplog</h1>
      <p>Generate a changelog from a public GitHub repository.</p>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <input
          name="repo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="owner/repo (e.g. vercel/next.js)"
          style={{ width: "300px", padding: "0.5rem", marginRight: "0.5rem" }}
          required
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Generate
        </button>
      </form>

      {repo && loading && <p>Loading&#8230;</p>}
      {repo && error && <p style={{ color: "red" }}>{error}</p>}
      {repo && entry && (
        <div>
          <h2>Changelog for {repo}</h2>

          <section>
            <h3>Technical Changes</h3>
            <ul>
              {entry.technical.map((bullet, i) => (
                <li key={i}>{bullet.replace(/^- /, "")}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Customer Summary</h3>
            <p>{entry.customerFacing}</p>
          </section>
        </div>
      )}
    </main>
  );
}
