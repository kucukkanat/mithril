// The 3-line worker entry a host app owns — here, the test fixture spawned by Bun's real Worker.
import { installRunner } from "../../src/worker.ts";

installRunner(self as unknown as DedicatedWorkerGlobalScope);
