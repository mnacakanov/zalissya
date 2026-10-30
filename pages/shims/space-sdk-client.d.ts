// Type-only stand-in for @hatch/space-sdk/client, which exists only inside
// Muse. Lets the Pages typecheck cover the shared client (including the
// Muse files) without the SDK. Never bundled: the Pages build resolves
// platform/target to target.pages.ts, which does not import the SDK.
import type { ComponentType } from "react";
import type { QueryClient } from "@tanstack/react-query";

export declare const SafeAreaTopScrim: ComponentType<{ backgroundColor?: string }>;
export declare const spaceQueryClient: QueryClient;
export declare function createActionClient<T>(): {
  [K in keyof T]: (args: Record<string, unknown>) => Promise<any>;
};
