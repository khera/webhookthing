import { CssBaseline } from "@mui/material";
import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { MuiProvider } from "~/lib/MuiProvider";

function hydrate () {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <MuiProvider>
          <CssBaseline />
          <RemixBrowser />
        </MuiProvider>
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari see https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}