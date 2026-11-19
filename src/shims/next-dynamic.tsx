import React, { Suspense } from "react";

export interface DynamicOptions {
  ssr?: boolean;
  loading?: React.ComponentType;
}

export default function dynamic<P extends object = Record<string, unknown>>(
  loader: () => Promise<{ default: React.ComponentType<P> } | React.ComponentType<P>>,
  options?: DynamicOptions
): React.ComponentType<P> {
  const LazyComponent = React.lazy(async () => {
    const mod = await loader();
    if (typeof mod === "function") {
      return { default: mod as React.ComponentType<P> };
    }
    if (mod && typeof mod === "object" && "default" in mod) {
      return mod as { default: React.ComponentType<P> };
    }
    return { default: (() => null) as unknown as React.ComponentType<P> };
  });

  const Fallback = options?.loading;

  const DynamicWrapper: React.FC<P> = (props) => (
    <Suspense fallback={Fallback ? <Fallback /> : null}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return DynamicWrapper;
}
