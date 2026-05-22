"use client";

import { UserProvider } from "@/context/user-context";
import { CognitiveProvider } from "@/context/cognitive-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <CognitiveProvider>
        {children}
      </CognitiveProvider>
    </UserProvider>
  );
}
