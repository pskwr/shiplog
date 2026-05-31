import { Suspense } from "react";
import { ChangelogApp } from "./changelog-app";

export default function ChangelogPage() {
  return (
    <Suspense>
      <ChangelogApp />
    </Suspense>
  );
}
