// In-page confirmation: the claude.ai viewer never shows window.confirm() (it returns false at once).
export function ConfirmBox({
  text,
  confirmLabel = "Löschen",
  busy = false,
  onConfirm,
  onCancel,
}: {
  text: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-box" role="group" aria-label={text}>
      <div className="confirm-text">{text}</div>
      <div className="button-row">
        <button type="button" className="btn btn-outline" onClick={onCancel} autoFocus>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
          {busy ? "Löscht…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}
