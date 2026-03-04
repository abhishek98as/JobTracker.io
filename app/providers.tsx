"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return <>{children}</>;
}