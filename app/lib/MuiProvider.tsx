import { CacheProvider } from "@emotion/react";

import { ThemeProvider } from "@mui/material";
import { theme } from "~/theme";
import createCache from "@emotion/cache";
import { useMemo, useState } from "react";
import { ClientStyleContext } from "./ClientStyleContext";

function createEmotionCache() {
  return createCache({ key: "css" });
}

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState(createEmotionCache());

  const clientStyleContextValue = useMemo(
    () => ({
      reset() {
        setCache(createEmotionCache());
      },
    }),
    [],
  );

  return (
    /* oxlint-disable-next-line label-has-associated-control */
    <ClientStyleContext.Provider value={clientStyleContextValue}>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </CacheProvider>
    </ClientStyleContext.Provider>
  );
}
