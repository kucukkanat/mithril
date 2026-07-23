// The Studio's runner worker entry — all logic lives in @mithril/runner-web (the same
// implementation the docs playground uses).
import { installRunner } from "@mithril/runner-web/worker";

installRunner(self as unknown as DedicatedWorkerGlobalScope);
