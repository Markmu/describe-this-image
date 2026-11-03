import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { SAMPLE_IMAGES } from "@/data/samples";
import { ACCOUNT_WELCOME_CREDITS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "How to Describe a Picture – Step-by-Step Guide",
  description: "Learn to upload an image, choose a description format, review generated text, and write alt text that fits its page context.",
  alternates: { canonical: "https://describethisimage.com/how-to-use/" },
};

const chapters = [
  ["subject", "The subject"],
  ["setting", "The setting"],
  ["light", "Light & detail"],
  ["format", "Your format"],
  ["alt-text", "Writing alt text"],
  ["upload-help", "Upload help"],
];
const formats = [
  ["Detailed", "A fuller account of the scene and its subjects.", "landscape", "detailed"],
  ["Caption", "A short line for a gallery, a post or an introduction.", "portrait", "short"],
  ["Alt text", "The information this image contributes to the page around it.", "product", "alt"],
  ["Social", "A draft to adapt to your voice and the place you share it.", "infographic", "social"],
] as const;

export default function HowToUsePage() {
  const example = SAMPLE_IMAGES.find(image => image.id === "landscape")!;
  return <main id="main-content" className="reading-page guide-page">
    <PageIntro title={<>Describe<br />what you see.</>}>
      <p>A practical guide to image descriptions. Start with what is visible, then find the words that fit.</p>
      <Link href="/#describer" className="design-button">Try the image describer<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </PageIntro>

    <figure className="guide-example">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={example.fullUrl} alt={example.outputs.alt} width={1200} height={800} />
      <figcaption><blockquote>{example.outputs.short}</blockquote><p>A sample caption. Subject, setting and visible light give the image its shape.</p></figcaption>
    </figure>

    <div className="guide-layout">
      <aside className="guide-index"><p>In this guide</p><nav aria-label="Guide chapters">{chapters.map(([id, label]) => <a href={"#" + id} key={id}>{label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</nav></aside>
      <article className="guide-chapters" aria-label="Image description guide">
        <section id="subject"><h2>Start with the subject.</h2><p>Name the main subject: a person, object, animal or landscape. Describe visible actions and positions before adding background details.</p><p>In the example, the river is the starting point. The trees and cliffs tell us how it sits within the scene. A useful description gives readers that relationship.</p></section>
        <section id="setting"><h2>Give it a setting.</h2><p>Describe what surrounds the subject, such as a room, street or mountain trail. Use positions and distances to connect the details.</p><p>Avoid guessing a location, date or time of day from appearance. A mountain valley can remain a mountain valley when the image does not tell you its name.</p></section>
        <section id="light"><h2>Notice light and detail.</h2><p>Look at visible colors, shadows and textures. The example has warm light across the sky and cliffs, with a darker valley below.</p><p>Check claims about materials against a product specification or another trusted source. Review small text, names and numbers; remove inferred details that the image cannot support.</p></section>
        <section id="format"><h2>Choose words that fit.</h2><p>A scene, a gallery and a product page ask different things of a description. Choose the format for the place your words will be read, then review the draft beside the image.</p><dl className="guide-formats">{formats.map(([name, description, sampleId, mode]) => {
          const sample = SAMPLE_IMAGES.find(image => image.id === sampleId)!;
          return <div key={name}><dt>{name}</dt><dd><figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sample.thumbUrl} alt={sample.outputs.alt} width={240} height={240} loading="lazy" />
            <figcaption><p>{description}</p><blockquote>{sample.outputs[mode]}</blockquote></figcaption>
          </figure></dd></div>;
        })}</dl></section>
        <section id="alt-text"><h2>Write alt text in context.</h2><p>Describe what the image contributes to the page. A product image, a linked icon and a decorative image serve different purposes. An empty alt attribute may be appropriate for a decorative image that adds no information.</p><p>There is no universal 125-character requirement. Keep the description concise and include the information readers need. Charts may need a longer explanation alongside the image. Generated alt text does not establish accessibility compliance.</p></section>
        <section id="upload-help"><h2>Bring your image.</h2><p>Upload a JPEG, PNG, WebP or GIF up to 10 MB and 40 megapixels. Choose a format and one of eight languages: English, Spanish, French, German, Chinese, Japanese, Portuguese or Italian.</p><p>If an image link fails, its website may block access from your browser. Download the image and upload the file. The server does not fetch remote image links.</p><p>Images are resized and metadata is removed before generation. Upload images you have permission to share, and avoid sensitive personal information. <Link href="/privacy">Read about image privacy.</Link></p><p>Generation requires an available image service. Sample descriptions illustrate the formats; they are not results from your upload.</p></section>
      </article>
    </div>

    <section className="page-callout" aria-labelledby="guide-action-title">
      <h2 id="guide-action-title">Your image.<br />Your next words.</h2>
      <div><p>Try one description without an account. Sign in with Google for {ACCOUNT_WELCOME_CREDITS} welcome credits per account. No daily refill.</p><Link href="/#describer" className="design-button">Describe an image<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
    </section>
  </main>;
}
