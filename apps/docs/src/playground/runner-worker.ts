// The playground's worker entry — all runner logic lives in @mithril/runner-web (the same
// implementation the Studio uses), so the docs app owns only this bundler-visible entry file.
import { installRunner } from "@mithril/runner-web/worker";

installRunner(self as unknown as DedicatedWorkerGlobalScope);
