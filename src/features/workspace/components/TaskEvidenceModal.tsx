import { useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type WorkspaceTask } from "../api/workspaceApi";

interface TaskEvidenceModalProps {
  task: WorkspaceTask;
  companyId: string;
  onClose: () => void;
}

export function TaskEvidenceModal({ task, companyId, onClose }: TaskEvidenceModalProps) {
  const [url, setURL] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectURL = "";
    workspaceApi.getTaskEvidence(companyId, task.assignmentId)
      .then((blob) => {
        if (!active) return;
        objectURL = URL.createObjectURL(blob);
        setURL(objectURL);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof ApiError ? requestError.message : "No se pudo cargar la evidencia.");
      });
    return () => { active = false; if (objectURL) URL.revokeObjectURL(objectURL); };
  }, [companyId, task.assignmentId]);

  return <div className="task-evidence-layer" role="dialog" aria-modal="true" aria-labelledby="task-evidence-title">
    <button className="employee-modal-backdrop" type="button" aria-label="Cerrar evidencia" onClick={onClose} />
    <article className="task-evidence-modal">
      <header><div><span className="workspace-eyebrow">EVIDENCIA FOTOGRÁFICA</span><h2 id="task-evidence-title">{task.title}</h2><p>{task.assigneeName}</p></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></header>
      <div className="task-evidence-image">{error ? <div className="workspace-empty-inline"><i className="bi bi-image" /><div><strong>No se pudo abrir la evidencia.</strong><span>{error}</span></div></div> : url ? <img src={url} alt={`Evidencia de ${task.title}`} /> : <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando evidencia…</div>}</div>
      <footer><span><i className="bi bi-shield-check" /> Capturada desde la cámara de Control Horario</span></footer>
    </article>
  </div>;
}
