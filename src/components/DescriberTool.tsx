'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Copy, Check, LoaderCircle, ArrowRight } from "lucide-react";
import { SAMPLE_IMAGES, type SampleImage } from "@/data/samples";
import { OUTPUT_MODES, type OutputMode, type ImageOutputs } from "@/lib/image-input";
import { LanguageSelect } from "@/components/LanguageSelect";
import { fileData, generateDescription, remoteImage } from "@/lib/image-client";

const labels: Record<OutputMode, string> = { detailed: "Detailed", short: "Caption", alt: "Alt text", social: "Social" };
export function DescriberTool({ initialMode = "detailed", fixedMode = false }: { initialMode?: OutputMode; fixedMode?: boolean }) {
  const [mode, setMode] = useState(initialMode);
  const [language, setLanguage] = useState("English");
  const [source, setSource] = useState({ image: SAMPLE_IMAGES[0].fullUrl, name: SAMPLE_IMAGES[0].title, sample: true });
  const [outputs, setOutputs] = useState<ImageOutputs | null>(SAMPLE_IMAGES[0].outputs);
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [usage, setUsage] = useState<{ remaining?: number; generationAvailable: boolean } | null>(null);
  const busyRef = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultVersion = useRef(0);

  useEffect(() => {
    const cancel = new AbortController();
    fetch("/api/usage", { signal: cancel.signal, cache: "no-store" })
      .then(res => res.json()).then(data => setUsage(data)).catch(() => { if (!cancel.signal.aborted) setUsage({generationAvailable:false}); });
    return () => { cancel.abort(); controller.current?.abort(); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  function selectSample(sample: SampleImage) {
    if (busyRef.current) return;
    resultVersion.current += 1;
    setSource({ image: sample.fullUrl, name: sample.title, sample: true });
    setOutputs(sample.outputs); setOutputLanguage("English"); setError(""); setCopied(false);
  }
  async function loadFile(file: File) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const image = await fileData(file);
      resultVersion.current += 1;
      setSource({ image, name: file.name, sample: false }); setOutputs(null); setCopied(false);
    } catch (err) { setError(err instanceof Error ? err.message : "The image could not be loaded."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function loadUrl(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const file = await remoteImage(url);
      const image = await fileData(file);
      resultVersion.current += 1;
      setSource({ image, name: "Linked image", sample: false }); setOutputs(null); setCopied(false); setUrl("");
    } catch (err) { setError(err instanceof Error ? err.message : "The image could not be loaded."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function generate() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setCopied(false);
    controller.current = new AbortController();
    try {
      const image = source.sample ? await fileData(new File([await (await fetch(source.image)).blob()], source.name, {type:"image/jpeg"})) : source.image;
      const result = await generateDescription(image, language, false, controller.current.signal);
      resultVersion.current += 1;
      setOutputs(result.outputs); setOutputLanguage(result.language);
      setSource(current => ({ ...current, image, sample: false }));
      setUsage({ remaining: result.remaining, generationAvailable: true });
    } catch (err) { setError(err instanceof Error ? err.message : "Generation failed. Please try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function copy() {
    if (!outputs) return;
    const version = resultVersion.current;
    try {
      await navigator.clipboard.writeText(outputs[mode]);
      if (version !== resultVersion.current) return;
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch { setError("Clipboard access failed. Select and copy the description text."); }
  }
  return <section id="describer" aria-label="Image description workspace" className="reading-desk">
    <div className="desk-status"><p>{typeof usage?.remaining==="number" ? usage.remaining+" credits available" : "One image to begin. No login needed."}</p><span>10 free per day with Google</span></div>
    <div className="desk-grid">
      <div className="desk-source">
        <label className={"desk-upload"+(dragging?" is-dragging":"")} onDragOver={event=>{event.preventDefault();if(!busy)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);const file=event.dataTransfer.files[0];if(file)void loadFile(file);}}>
          <Upload size={26} aria-hidden="true"/><span><strong>Bring your image</strong><span>Drop a file or browse · up to 10 MB</span></span>
          <input aria-label="Upload image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)void loadFile(file);}}/>
        </label>
        <form onSubmit={loadUrl} className="desk-url"><label htmlFor="image-url" className="sr-only">Public HTTPS image URL</label><input id="image-url" type="url" placeholder="Or paste an image link" value={url} onChange={event=>setUrl(event.target.value)} disabled={busy}/><button disabled={busy||!url.trim()}>Load <ArrowRight size={16} aria-hidden="true"/></button></form>
        <figure className="desk-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={source.image} src={source.image} alt={source.name} onError={()=>setError("The image preview could not be loaded. Choose another image.")}/>
          <figcaption>{source.sample?"Sample · ":"Selected · "}{source.name}</figcaption>
        </figure>
        <div className="desk-samples"><p>Or start with a sample</p><div>{SAMPLE_IMAGES.map(sample=><button key={sample.id} onClick={()=>selectSample(sample)} disabled={busy} aria-label={"Preview "+sample.category} aria-pressed={source.sample&&source.image===sample.fullUrl}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sample.thumbUrl} width="180" height="140" alt="" loading="lazy"/><span>{sample.id==="product"?"Product":sample.id==="infographic"?"Charts":sample.category}</span>
        </button>)}</div></div>
      </div>
      <div className="desk-output">
        <div className="desk-language"><label htmlFor="output-language">Write in</label><LanguageSelect id="output-language" value={language} disabled={busy} onChange={value=>{setLanguage(value);setCopied(false);}} /></div>
        {!fixedMode&&<div className="desk-formats" aria-label="Description format">{OUTPUT_MODES.map(key=><button key={key} aria-pressed={mode===key} disabled={busy} onClick={()=>{resultVersion.current+=1;setMode(key);setCopied(false);}}>{labels[key]}</button>)}</div>}
        <div data-ui className="desk-sheet" aria-busy={busy}>
          <p className="desk-sheet-label">{source.sample?"Sample reading":"Your description"} · {outputs?outputLanguage:language}</p>
          {outputs&&outputLanguage!==language&&<p className="desk-notice">This result is in {outputLanguage}. Generate again to write in {language}.</p>}
          <p key={source.name+mode} className="desk-result" aria-live="polite">{outputs?.[mode]||"An image is the beginning. Your words will appear here."}</p>
          <button onClick={copy} disabled={!outputs||busy} className="desk-copy" aria-label={copied?"Copied to clipboard":"Copy text"}>{copied?<Check size={17}/>:<Copy size={17}/>}<span role="status">{copied?"Copied to clipboard":"Copy text"}</span></button>
        </div>
        <button type="button" onClick={generate} disabled={busy||!usage?.generationAvailable} className="design-button desk-generate">{busy?<LoaderCircle className="animate-spin" size={19}/>:<ArrowRight size={19}/>} {busy?"Finding the words…":"Generate description"}<span>1 credit</span></button>
        {!usage&&<p role="status" className="desk-note">Checking generation availability…</p>}
        {usage?.generationAvailable===false&&<p role="status" className="desk-note">Generation is unavailable. Explore the samples while the service is offline.</p>}
        {error&&<p role="alert" className="desk-error">{error} {/credit|quota|Pro/.test(error)&&<Link href="/pricing">View plans</Link>}</p>}
        <p className="desk-note">JPG, PNG, WebP & GIF. Review every draft before use.<br/>Generating sends your image to our AI service. <Link href="/privacy">Image privacy</Link></p>
      </div>
    </div>
  </section>;
}
