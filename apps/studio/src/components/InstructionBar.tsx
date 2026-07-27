import { useState, type ReactNode } from "react";

/*
 * "Edit with AI" for the whole project: type what you want changed instead of clicking around.
 *
 * It sits at the bottom of the design pane, above the casebook, because it acts on the WHOLE spec —
 * putting it inside a panel would misrepresent its scope, and the bottom edge is already where the
 * other project-wide surface lives.
 *
 * Disabled while the code view is frozen. That state means the panels are showing the last-good spec
 * while the editor holds newer, broken text; applying an AI edit then would silently throw away the
 * code the user is in the middle of writing.
 */

export interface InstructionBarProps {
  readonly onSubmit: (instruction: string) => void;
  readonly running: boolean;
  /**
   * Which model this bar sends to, as a control. A slot rather than props because the choice is a
   * settings concern and the bar is presentational — it only owes the reader the answer's position.
   */
  readonly modelChip: ReactNode;
  /** Why the bar can't be used, or `null` when it can. */
  readonly disabledReason: string | null;
  /** What the last applied edit did, with a way back. */
  readonly applied: { readonly summary: string; readonly onUndo: () => void } | null;
  readonly error: string | null;
}

export function InstructionBar({ onSubmit, running, modelChip, disabledReason, applied, error }: InstructionBarProps) {
  const [text, setText] = useState("");
  const disabled = disabledReason !== null || running;

  const submit = (): void => {
    const instruction = text.trim();
    if (instruction.length === 0 || disabled) return;
    setText("");
    onSubmit(instruction);
  };

  return (
    <div className="instruction-bar" data-testid="instruction-bar">
      <div className="instruction-row">
        <span className="decl-kind k-tool">ai</span>
        {modelChip}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setText("");
          }}
          placeholder={disabledReason ?? "add a refund tool that takes an order id"}
          disabled={disabled}
          aria-label="Change this agent with AI"
          data-testid="instruction-input"
        />
        <button className="ghost" onClick={submit} disabled={disabled || text.trim().length === 0} data-testid="instruction-send">
          {running ? "Working…" : "Change it"}
        </button>
      </div>

      {error !== null && (
        <p className="hint onboard-error" data-testid="instruction-error">
          {error}
        </p>
      )}

      {applied !== null && (
        <div className="undo-strip" data-testid="instruction-applied">
          <span>{applied.summary}</span>
          <button className="ghost" onClick={applied.onUndo} data-testid="instruction-undo">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
