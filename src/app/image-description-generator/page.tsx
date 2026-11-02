'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Download, Trash2, LoaderCircle } from "lucide-react";
import { LANGUAGES, csvCell, validateImageFile, type ImageOutputs } from "@/lib/image-input";
import { fileData, generateDescription } from "@/lib/image-client";

type Item = { id: string; file: File; preview: string; status: "pending" | "processing" | "completed" | "error"; error?: string; outputs?: ImageOutputs; language?: string };
export default function BatchGeneratorPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [language, setLanguage] = useState("English");
  const [busy, setBusy] = useState(false);
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
  return (
    <main id="main-content" className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-7">
      <Link href="/" className="text-sm text-blue-700 hover:underline">← Back to image describer</Link>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Batch image descriptions</h1><p className="text-zinc-600 mt-3 max-w-xl">Queue images, generate four description formats, and export completed results to CSV. Pro subscription required. Each image uses 1 credit.</p></div>
        <Link href="/pricing" className="text-blue-700 underline text-sm">View Pro plans</Link>
      </div>
      {access && (!access.canBatch || !access.generationAvailable) && <div role="status" className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-950">{!access.generationAvailable ? "Generation is unavailable. You can prepare a queue; processing requires an available image service." : "Sign in with an active Pro plan to process your queue."}</div>}
      <section aria-label="Batch controls" className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 space-y-5">
        <label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }} className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-400 hover:border-blue-600 p-8 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
          <Upload className="w-7 h-7 text-blue-600" /><span className="font-semibold">Drop images or browse files</span><span className="text-sm text-zinc-500 text-center">Up to 50 images · JPG, PNG, WebP, GIF · 10 MB per image</span>
          <input aria-label="Upload batch images" className="absolute inset-0 opacity-0 w-full cursor-pointer" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={busy} onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="batch-language" className="text-sm font-medium">Output language</label>
          <select id="batch-language" value={language} disabled={busy} onChange={event => setLanguage(event.target.value)} className="border border-zinc-300 rounded-lg p-2.5">{LANGUAGES.map(item => <option key={item}>{item}</option>)}</select>
          <button onClick={processQueue} disabled={busy || !items.some(item => item.status === "pending" || item.status === "error") || !access?.canBatch || !access?.generationAvailable} className="rounded-lg bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700">{busy && <LoaderCircle className="w-4 h-4 animate-spin" />}{busy ? "Processing queue…" : "Generate descriptions"}</button>
          <button onClick={exportCsv} disabled={!completed || busy} className="rounded-lg bg-zinc-900 text-white px-5 py-3 text-sm flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" />Export CSV ({completed})</button>
        </div>
        <p className="text-xs text-zinc-500">Images are sent to the AI service when you generate. GIF uses its first frame. <Link href="/privacy" className="underline">Privacy details</Link></p>
        {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm break-words">{error}</p>}
      </section>
      <section aria-label="Image queue" className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex justify-between items-center gap-3"><h2 className="font-semibold" aria-live="polite">{completed} of {items.length} images completed</h2><button onClick={() => remove()} disabled={busy || !items.length} className="text-sm text-red-700 disabled:opacity-40 p-2">Clear queue</button></div>
        {!items.length && <p className="p-12 text-center text-zinc-500">Your queue is empty. Add images to get started.</p>}
        <ul className="divide-y divide-zinc-200">{items.map(item => <li key={item.id} className="p-5 flex flex-col md:flex-row gap-5">
          <div className="flex items-start gap-3 md:w-72 shrink-0 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt={item.file.name} className="w-16 h-16 object-contain rounded-lg bg-zinc-100" />
            <div className="min-w-0 flex-1"><p className="font-semibold text-sm break-all">{item.file.name}</p><p className="text-xs text-zinc-500 mt-1">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p><p className="text-sm mt-1" role="status">{item.status}{item.language ? " · " + item.language : ""}</p></div>
          </div>
          <div className="flex-1 min-w-0 text-sm space-y-2">{item.error && <p className="text-red-700">{item.error}</p>}{item.outputs ? <><p className="break-words"><strong>Alt text: </strong>{item.outputs.alt}</p><p className="break-words"><strong>Caption: </strong>{item.outputs.short}</p></> : <p className="text-zinc-500">Description pending</p>}</div>
          <button onClick={() => remove(item.id)} disabled={busy} aria-label={"Remove " + item.file.name} className="self-end md:self-start p-3 rounded-lg hover:bg-red-50 text-red-700 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
        </li>)}</ul>
      </section>
    </main>
  );
}
