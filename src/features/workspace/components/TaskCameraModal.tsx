import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type TaskCaptureSession, type WorkspaceTask } from "../api/workspaceApi";

interface TaskCameraModalProps {
  task: WorkspaceTask;
  companyId: string;
  csrfToken: string;
  onClose: () => void;
  onCompleted: () => Promise<void>;
}

function cameraMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Activa el permiso de cámara para tomar la evidencia.";
    if (error.name === "NotFoundError") return "No se encontró una cámara disponible en este dispositivo.";
    if (error.name === "NotReadableError") return "La cámara está siendo utilizada por otra aplicación.";
  }
  return "No se pudo abrir la cámara. Comprueba los permisos e inténtalo nuevamente.";
}

function canvasJPEG(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("camera_encode_failed")), "image/jpeg", 0.86);
  });
}

export function TaskCameraModal({ task, companyId, csrfToken, onClose, onCompleted }: TaskCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewURLRef = useRef<string | null>(null);
  const [capture, setCapture] = useState<TaskCaptureSession | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current);
    previewURLRef.current = null;
    setPreviewURL(null);
    setPhoto(null);
    setCapturedAt("");
  }

  useEffect(() => {
    let active = true;
    async function initialize() {
      setInitializing(true);
      setError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("Camera API unavailable", "NotSupportedError");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (!active) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const response = await workspaceApi.createTaskCaptureSession(companyId, csrfToken, task.assignmentId);
        if (!active) return;
        setCapture(response.data);
        setClockOffset(new Date(response.data.serverTime).getTime() - Date.now());
      } catch (requestError) {
        if (active) setError(cameraMessage(requestError));
        stopCamera();
      } finally {
        if (active) setInitializing(false);
      }
    }
    void initialize();
    return () => {
      active = false;
      stopCamera();
      if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current);
    };
  }, [companyId, csrfToken, task.assignmentId]);

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !capture || video.videoWidth === 0) return;
    setError("");
    try {
      const maxWidth = 1920;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("camera_canvas_unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const moment = new Date(Date.now() + clockOffset);
      const label = `${moment.toISOString()} · ${capture.captureId.slice(-8).toUpperCase()}`;
      const fontSize = Math.max(16, Math.round(canvas.width / 55));
      context.font = `600 ${fontSize}px system-ui, sans-serif`;
      const padding = Math.round(fontSize * 0.75);
      const barHeight = fontSize + padding * 2;
      context.fillStyle = "rgba(0, 0, 0, .58)";
      context.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
      context.fillStyle = "#fff";
      context.fillText(label, padding, canvas.height - padding);
      const blob = await canvasJPEG(canvas);
      if (blob.size > capture.maxBytes) throw new Error("photo_too_large");
      clearPreview();
      const url = URL.createObjectURL(blob);
      previewURLRef.current = url;
      setPhoto(blob);
      setPreviewURL(url);
      setCapturedAt(moment.toISOString());
    } catch {
      setError("No se pudo generar la fotografía. Inténtalo nuevamente.");
    }
  }

  async function submitPhoto() {
    if (!capture || !photo || !capturedAt || uploading) return;
    setUploading(true);
    setError("");
    try {
      await workspaceApi.uploadTaskEvidence(companyId, csrfToken, capture, photo, capturedAt);
      stopCamera();
      await onCompleted();
      onClose();
    } catch (requestError) {
      setError(cameraMessage(requestError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="task-camera-layer" role="dialog" aria-modal="true" aria-labelledby="task-camera-title">
      <div className="task-camera-modal">
        <header className="task-camera-header">
          <div><span className="workspace-eyebrow">EVIDENCIA EN TIEMPO REAL</span><h2 id="task-camera-title">{task.title}</h2></div>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar cámara" onClick={onClose} disabled={uploading} />
        </header>
        <div className="task-camera-stage">
          <video ref={videoRef} className={previewURL ? "is-hidden" : ""} autoPlay muted playsInline />
          {previewURL && <img src={previewURL} alt="Vista previa de la evidencia capturada" />}
          {initializing && <div className="task-camera-status"><span className="spinner-border" /><strong>Preparando cámara segura…</strong></div>}
          {error && !streamRef.current && <div className="task-camera-status is-error"><i className="bi bi-camera-video-off" /><strong>{error}</strong><span>La galería no está disponible en este flujo.</span></div>}
          <div className="task-camera-live"><span /><strong>{previewURL ? "Vista previa" : "Cámara en vivo"}</strong></div>
        </div>
        <canvas ref={canvasRef} hidden />
        {error && streamRef.current && <div className="task-camera-alert" role="alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
        <div className="task-camera-help"><i className="bi bi-shield-check" /><span>La imagen se genera desde esta transmisión. No se permite seleccionar fotografías existentes.</span></div>
        <footer className="task-camera-actions">
          {previewURL ? <>
            <button type="button" className="owner-action-button" onClick={clearPreview} disabled={uploading}><i className="bi bi-arrow-counterclockwise" /> Repetir</button>
            <button type="button" className="owner-action-button owner-action-button--primary" onClick={() => void submitPhoto()} disabled={uploading}>{uploading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-cloud-arrow-up" />} Usar y completar</button>
          </> : <button type="button" className="task-camera-shutter" onClick={() => void takePhoto()} disabled={initializing || !capture || !!error}><span /><span className="visually-hidden">Tomar fotografía</span></button>}
        </footer>
      </div>
    </div>
  );
}
