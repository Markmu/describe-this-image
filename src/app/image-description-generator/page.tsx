'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Download, Trash2, LoaderCircle, ArrowUpRight } from "lucide-react";
import { csvCell, validateImageFile, type ImageOutputs } from "@/lib/image-input";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PageIntro } from "@/components/PageIntro";
import { fileData, generateDescription } from "@/lib/image-client";

type Item = { id: string; file: File; preview: string; status: "pending" | "processing" | "completed" | "error"; error?: string; outputs?: ImageOutputs; language?: string };
export default function BatchGeneratorPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [language, setLanguage] = useState("English");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [access, setAccess] = useState<{ canBatch: boolean; generationAvailable: boolean } | null>(null);
  const busyRef = useRef(false);
  const urls = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const cancel = new AbortController();
    const ownedUrls = urls.current;
    fetch("/api/usage", { cache: "no-store", signal: cancel.signal }).then(res => res.json()).then(setAccess).catch(() => {});
    return () => { cancel.abort(); controller.current?.abort(); ownedUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  function addFiles(files: FileList | File[]) {
    if (busyRef.current) return;
    setError("");
    const accepted: Item[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (items.length + accepted.length >= 50) { errors.push("A batch can contain up to 50 images."); break; }
      const problem = validateImageFile(file);
      if (problem) { errors.push(file.name + ": " + problem); continue; }
      const preview = URL.createObjectURL(file);
      urls.current.add(preview);
      accepted.push({ id: crypto.randomUUID(), file, preview, status: "pending" });
    }
    setItems(current => [...current, ...accepted]);
    setError(errors.join(" "));
  }
  function remove(id?: string) {
    if (busyRef.current) return;
    setItems(current => current.filter(item => {
      if (id && item.id !== id) return true;
      URL.revokeObjectURL(item.preview); urls.current.delete(item.preview); return false;
    }));
  }
  async function processQueue() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    const cancel = new AbortController(); controller.current = cancel;
    try {
      for (const item of items.filter(entry => entry.status === "pending" || entry.status === "error")) {
        if (cancel.signal.aborted) break;
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: "processing", error: undefined } : entry));
        try {
          const result = await generateDescription(await fileData(item.file), language, true, cancel.signal);
          setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: "completed", outputs: result.outputs, language: result.language } : entry));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation failed.";
          setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: "error", error: message } : entry));
          setError(message + " Processing stopped; other queued images have not been submitted.");
          break;
        }
      }
    } finally { busyRef.current = false; setBusy(false); }
  }
  function exportCsv() {
    const completed = items.filter(item => item.status === "completed" && item.outputs);
    if (!completed.length) return;
    const header = ["File name", "Language", "Alt text", "Caption", "Detailed description", "Social caption"];
    const rows = completed.map(item => [item.file.name, item.language || "", item.outputs!.alt, item.outputs!.short, item.outputs!.detailed, item.outputs!.social]);
    const csv = "\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "image-descriptions.csv"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const completed = items.filter(item => item.status === "completed").length;
  return <main id="main-content" className="reading-page batch-page">
    <PageIntro title={<>A batch of images.<br />A set of words.</>} compact>
      <p>Queue up to 50 images, choose your language and export four description formats. Pro required. One credit per image.</p>
      <Link href="/pricing" className="design-text-link">Explore Pro plans<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </PageIntro>
    {access && (!access.canBatch || !access.generationAvailable) && <div role="status" className="page-notice">{!access.generationAvailable ? "Generation is unavailable. You can prepare a queue; processing requires an available image service." : <>Sign in with an active Pro plan to process your queue. <Link href="/pricing">View plans</Link></>}</div>}

    <div className="batch-layout" data-ui>
      <section className="batch-source" aria-label="Add images">
        <label aria-disabled={busy} onDragOver={event => {event.preventDefault(); if (!busy) setDragging(true);}}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
          className={"batch-upload" + (dragging ? " is-dragging" : "")}>
          <Upload size={28} strokeWidth={1.5} aria-hidden="true" />
          <strong>Bring your images.</strong><span>Drop files here or browse your device.</span>
          <input aria-label="Upload batch images" aria-describedby="batch-file-limits" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={busy}
            onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        </label>
        <div><h2>A few things to know.</h2><p id="batch-file-limits" className="page-note">Up to 50 images. JPG, PNG, WebP or GIF. 10 MB per image. GIF uses its first frame.</p></div>
        <p className="page-note">Images are sent to the AI service when you generate. <Link href="/privacy">Image privacy</Link></p>
      </section>

      <section className="batch-queue" aria-labelledby="queue-title">
        <div className="batch-queue-heading"><div><h2 id="queue-title">Image queue</h2><p aria-live="polite">{completed} of {items.length} images completed</p></div><button type="button" onClick={() => remove()} disabled={busy || !items.length} className="batch-clear">Clear queue</button></div>
        <div className="batch-tools">
          <div className="batch-language"><label htmlFor="batch-language">Output language</label><LanguageSelect id="batch-language" value={language} disabled={busy} onChange={setLanguage} align="start" /></div>
          <button type="button" onClick={processQueue} disabled={busy || !items.some(item => item.status === "pending" || item.status === "error") || !access?.canBatch || !access?.generationAvailable} className="design-button">{busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{busy ? "Processing queue…" : "Generate descriptions"}</button>
          <button type="button" onClick={exportCsv} disabled={!completed || busy} className="quiet-button"><Download size={16} aria-hidden="true" />Export CSV ({completed})</button>
        </div>
        {error && <p role="alert" className="batch-error">{error}</p>}
        {!items.length && <div className="batch-empty"><h3>Your images, in order.</h3><p>Add your images to build a queue. Each result will include alt text, a caption, a detailed description and social copy.</p></div>}
        <ul className="batch-items">{items.map(item => <li key={item.id} className="batch-item">
          <div className="batch-item-source">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt={item.file.name} width={68} height={82} />
            <div><p className="batch-item-name">{item.file.name}</p><p className="page-note">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p><p className="batch-item-status" data-status={item.status} role="status">{item.status}{item.language ? " · " + item.language : ""}</p></div>
          </div>
          <div className="batch-item-output">{item.error && <p>{item.error}</p>}{item.outputs ? <><p><strong>Alt text: </strong>{item.outputs.alt}</p><p><strong>Caption: </strong>{item.outputs.short}</p></> : <p className="page-note">Description pending</p>}</div>
          <button type="button" onClick={() => remove(item.id)} disabled={busy} aria-label={"Remove " + item.file.name} className="batch-item-remove"><Trash2 size={17} aria-hidden="true" /></button>
        </li>)}</ul>
      </section>
    </div>
  </main>;
}
