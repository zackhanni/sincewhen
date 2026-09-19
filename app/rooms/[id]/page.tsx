"use client";

import { useParams } from "next/navigation";
import { NodeScreen } from "@/components/app/node-screen";

// A client page, because the item it shows lives in device storage: the server has no way to
// look the id up, so there is nothing for it to render ahead of time.
export default function NodePage() {
  const { id } = useParams<{ id: string }>();
  return <NodeScreen id={id} />;
}
