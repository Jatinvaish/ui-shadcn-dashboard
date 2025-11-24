"use client"

import type { ReactNode } from "react"

export default function PlansLayout({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>
}
