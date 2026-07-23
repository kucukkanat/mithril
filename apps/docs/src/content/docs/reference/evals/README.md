---
editUrl: false
next: false
prev: false
title: "@mithril/evals"
---

Trajectory-native evaluation harness for Mithril agents: run cases, score their recorded event logs, and
bridge to a host test runner.

## Interfaces

- [EvalCase](/reference/evals/interfaces/evalcase/)
- [EvalReportEntry](/reference/evals/interfaces/evalreportentry/)
- [EvalRun](/reference/evals/interfaces/evalrun/)
- [EvalRunSummary](/reference/evals/interfaces/evalrunsummary/)
- [HtmlReportOptions](/reference/evals/interfaces/htmlreportoptions/)
- [InspectorReportOptions](/reference/evals/interfaces/inspectorreportoptions/)
- [MatchOptions](/reference/evals/interfaces/matchoptions/)
- [ReferenceStep](/reference/evals/interfaces/referencestep/)
- [RunDiff](/reference/evals/interfaces/rundiff/)
- [RunSnapshot](/reference/evals/interfaces/runsnapshot/)
- [Score](/reference/evals/interfaces/score/)
- [SuiteEntry](/reference/evals/interfaces/suiteentry/)
- [SuiteResult](/reference/evals/interfaces/suiteresult/)
- [SuiteRun](/reference/evals/interfaces/suiterun/)
- [Trajectory](/reference/evals/interfaces/trajectory/)
- [TrajectoryFs](/reference/evals/interfaces/trajectoryfs/)
- [TrajectoryStore](/reference/evals/interfaces/trajectorystore/)

## Type Aliases

- [EvalArgs](/reference/evals/type-aliases/evalargs/)
- [ReferenceTrajectory](/reference/evals/type-aliases/referencetrajectory/)
- [RunEvalCachedOptions](/reference/evals/type-aliases/runevalcachedoptions/)
- [RunEvalOptions](/reference/evals/type-aliases/runevaloptions/)
- [Scorer](/reference/evals/type-aliases/scorer/)
- [SuiteArgs](/reference/evals/type-aliases/suiteargs/)
- [SuiteOptions](/reference/evals/type-aliases/suiteoptions/)
- [SuspendPolicy](/reference/evals/type-aliases/suspendpolicy/)
- [ToolArgsMatchMode](/reference/evals/type-aliases/toolargsmatchmode/)
- [TrajectoryMatchMode](/reference/evals/type-aliases/trajectorymatchmode/)

## Functions

- [calledInOrder](/reference/evals/functions/calledinorder/)
- [calledTool](/reference/evals/functions/calledtool/)
- [calledToolWith](/reference/evals/functions/calledtoolwith/)
- [completed](/reference/evals/functions/completed/)
- [describeEval](/reference/evals/functions/describeeval/)
- [didNotCallTool](/reference/evals/functions/didnotcalltool/)
- [diffRuns](/reference/evals/functions/diffruns/)
- [finalText](/reference/evals/functions/finaltext/)
- [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/)
- [htmlReport](/reference/evals/functions/htmlreport/)
- [inspectorReport](/reference/evals/functions/inspectorreport/)
- [llmJudge](/reference/evals/functions/llmjudge/)
- [loadTrajectory](/reference/evals/functions/loadtrajectory/)
- [matchesTrajectory](/reference/evals/functions/matchestrajectory/)
- [memoryTrajectoryStore](/reference/evals/functions/memorytrajectorystore/)
- [noToolErrors](/reference/evals/functions/notoolerrors/)
- [outputIncludes](/reference/evals/functions/outputincludes/)
- [outputMatches](/reference/evals/functions/outputmatches/)
- [pairwiseJudge](/reference/evals/functions/pairwisejudge/)
- [referenceFromTrajectory](/reference/evals/functions/referencefromtrajectory/)
- [runEval](/reference/evals/functions/runeval/)
- [runEvalCached](/reference/evals/functions/runevalcached/)
- [runSuite](/reference/evals/functions/runsuite/)
- [serializeTrajectory](/reference/evals/functions/serializetrajectory/)
- [staysBounded](/reference/evals/functions/staysbounded/)
- [summaryKey](/reference/evals/functions/summarykey/)
- [toolCallCount](/reference/evals/functions/toolcallcount/)
- [toSnapshot](/reference/evals/functions/tosnapshot/)
- [trajectoryToScript](/reference/evals/functions/trajectorytoscript/)
- [underCost](/reference/evals/functions/undercost/)
- [underSteps](/reference/evals/functions/understeps/)
