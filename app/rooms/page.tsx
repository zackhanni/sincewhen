"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { NodeScreen } from "@/components/app/node-screen";

function RoomsContent() {
  // No id = the top of the tree, which lists the locations. See lib/routes.ts for why the id is
  // a query parameter.
  const id = useSearchParams().get("id");
  return <NodeScreen id={id} />;
}

export default function RoomsPage() {
  // Next.js requires a Suspense boundary around useSearchParams so the rest of the page can
  // still be built ahead of time as static HTML.
  return (
    <Suspense>
      <RoomsContent />
    </Suspense>
  );
}
