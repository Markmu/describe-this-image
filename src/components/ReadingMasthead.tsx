'use client';
import { useState } from "react";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { SAMPLE_IMAGES } from "@/data/samples";
export function ReadingMasthead() {
  const [selected,setSelected]=useState(1);
  return <section className="reading-hero" aria-label="Images into words">
    <div className="contact-sheet">
      {SAMPLE_IMAGES.map((sample,index)=><button key={sample.id} className={"contact-photo contact-photo-"+index+(selected===index?" is-selected":"")} aria-label={"Read the "+sample.category+" example"} aria-pressed={selected===index} onClick={()=>setSelected(index)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sample.thumbUrl} width="800" height="700" alt={sample.title} fetchPriority={index===1?"high":"auto"} />
        <span>{["Portrait","Landscape","Product","Charts"][index]}<ArrowUpRight size={18} aria-hidden="true" /></span>
      </button>)}
      <div className="contact-word"><span>Look closer.</span><p>There’s a story<br/>in what you see.</p><ArrowDown size={30} aria-hidden="true" /></div>
    </div>
    <div className="hero-copy">
      <div className="hero-note"><p>Image descriptions, alt text<br className="desktop-break"/> & captions. In your words.</p><a href="#describer" className="design-button">Describe an image <ArrowUpRight size={20} aria-hidden="true"/></a><span>1 free image. No account needed.</span></div>
      <h1><span><span>Every image.</span></span><span><span>In words.</span></span></h1>
    </div>
    <div className="image-reading" aria-live="polite"><p>One way to read this image</p><p key={selected}>{SAMPLE_IMAGES[selected].outputs.short}</p><span>Example text</span></div>
  </section>;
}
