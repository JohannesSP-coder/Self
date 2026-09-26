import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { Habit, Proof } from "../api";
import { proofUrl } from "../proofImages";
import { formatEntryDate, formatProofDay } from "../util";
import { ConfirmBox } from "./ConfirmBox";
import { CameraIcon, CloseIcon, TrashIcon } from "./Icons";

function useProofUrl(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    proofUrl(id)
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [id]);
  return url;
}

function ProofThumb({ proof, onOpen }: { proof: Proof; onOpen: () => void }) {
  const url = useProofUrl(proof.id);
  const day = formatProofDay(proof.createdAt);
  return (
    <button type="button" className="proof-thumb" onClick={onOpen} aria-label={`Beweisfoto von ${day} ansehen`}>
      <span className={day === "Heute" ? "proof-img today" : "proof-img"}>
        {url && <img src={url} alt="" />}
      </span>
      <span className="proof-day">{day}</span>
    </button>
  );
}

/** The per-habit photo strip: a camera tile to add proof, then the latest proofs. */
export function ProofStrip({
  habit,
  uploading,
  onPick,
  onOpen,
}: {
  habit: Habit;
  uploading: boolean;
  onPick: (file: File) => void;
  onOpen: (proof: Proof) => void;
}) {
  const inputId = `proof-${habit.id}`;

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick(file);
  }

  return (
    <div className="proof-section">
      <div className="proof-strip">
        <label htmlFor={inputId} className={uploading ? "proof-add busy" : "proof-add"}>
          <CameraIcon size={20} />
          <span>{uploading ? "Lädt…" : "Foto"}</span>
        </label>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={uploading}
          aria-label={`${habit.title}: Beweisfoto aufnehmen`}
          onChange={onChange}
        />
        {habit.proofs.length === 0 ? (
          <p className="proof-hint">
            Beweisfoto machen, z.B. im Gym beim Training oder von deinen Heften beim Lernen. Das Habit zählt dann für
            heute als erledigt.
          </p>
        ) : (
          habit.proofs.map((p) => <ProofThumb key={p.id} proof={p} onOpen={() => onOpen(p)} />)
        )}
      </div>
    </div>
  );
}

/** Full-size view of one proof, with delete. */
export function ProofViewer({
  habitTitle,
  proof,
  deleting,
  onDelete,
  onClose,
}: {
  habitTitle: string;
  proof: Proof;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const url = useProofUrl(proof.id);
  const [confirming, setConfirming] = useState(false);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Beweisfoto: ${habitTitle}`} onKeyDown={onKeyDown}>
      <div className="lightbox-backdrop" onClick={onClose} />
      <div className="lightbox-panel">
        <div className="lightbox-head">
          <div>
            <div className="lightbox-title">{habitTitle}</div>
            <div className="lightbox-sub">{formatEntryDate(proof.createdAt)}</div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Schließen" autoFocus>
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="lightbox-image">{url ? <img src={url} alt={`Beweisfoto für ${habitTitle}`} /> : <span className="muted">Lädt…</span>}</div>
        {confirming ? (
          <ConfirmBox
            text="Dieses Beweisfoto löschen? Das Habit bleibt für den Tag abgehakt."
            busy={deleting}
            onConfirm={onDelete}
            onCancel={() => setConfirming(false)}
          />
        ) : (
          <button type="button" className="btn btn-outline" onClick={() => setConfirming(true)}>
            <TrashIcon size={16} /> Foto löschen
          </button>
        )}
      </div>
    </div>
  );
}
