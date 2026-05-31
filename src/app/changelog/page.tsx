import { fetchRecentPRs } from "@/lib/github/ingest";
import { PlaceholderChangelogGenerator } from "@/lib/changelog/placeholder";

interface Props {
  searchParams: Promise<{ repo?: string }>;
}

export default async function ChangelogPage({ searchParams }: Props) {
  const { repo } = await searchParams;

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

      <form method="get" action="/changelog" style={{ marginBottom: "2rem" }}>
        <input
          name="repo"
          defaultValue={repo ?? ""}
          placeholder="owner/repo (e.g. vercel/next.js)"
          style={{ width: "300px", padding: "0.5rem", marginRight: "0.5rem" }}
          required
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Generate
        </button>
      </form>

      {repo && <ChangelogResult repo={repo} />}
    </main>
  );
}

async function ChangelogResult({ repo }: { repo: string }) {
  const slash = repo.indexOf("/");
  const owner = slash > 0 ? repo.slice(0, slash) : "";
  const name = slash > 0 ? repo.slice(slash + 1) : "";

  if (!owner || !name || repo.includes(" ")) {
    return (
      <p style={{ color: "red" }}>
        Invalid format. Use <code>owner/repo</code> (e.g.{" "}
        <code>vercel/next.js</code>).
      </p>
    );
  }

  const result = await fetchRecentPRs(owner, name);

  if (!result.ok) {
    return <p style={{ color: "red" }}>Error: {result.error}</p>;
  }

  if (result.prs.length === 0) {
    return <p>No recent merged pull requests found for {repo}.</p>;
  }

  const generator = new PlaceholderChangelogGenerator();
  const entry = await generator.generate(result.prs);

  return (
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
  );
}
