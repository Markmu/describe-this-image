import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DescriberTool } from "@/components/DescriberTool";
import { ReadingMasthead } from "@/components/ReadingMasthead";
import { ReadingMotion } from "@/components/ReadingMotion";
import { JsonLd } from "@/components/JsonLd";
import { ACCOUNT_WELCOME_CREDITS, STARTER_PRICE } from "@/lib/plans";
export const metadata:Metadata={
  title:"Describe This Image — Images into Words",
  description:"Turn photos into descriptions, captions and alt text. Try one image without an account. Four formats, eight languages.",
  alternates:{canonical:"https://describethisimage.com/"},
};
const questions=[
  ["What can I upload?","JPEG, PNG, WebP or GIF images up to 10 MB and 40 megapixels. GIF descriptions use the first frame. You can also load a public HTTPS image link when its host allows browser access."],
  ["Can I try it for free?",`Yes. Describe one image without an account. Sign in with Google for ${ACCOUNT_WELCOME_CREDITS} welcome credits per account. Each credit describes one image. Welcome credits do not expire or refill daily. Sample previews do not use credits.`],
  ["What happens to my image?","Previews stay in your browser until you generate. Generation sends your image to our service and Google Gemini. The application does not save image files or descriptions to its database. See our privacy details for provider processing information."],
  ["Which languages?","English, Spanish, French, German, Chinese, Japanese, Portuguese and Italian. Choose the language before generating. Sample text is in English."],
  ["Can I describe a batch?","Pro includes batch processing and CSV export. Queue up to 50 images; each completed generation uses one credit. Review the generated descriptions before importing them into your website."],
];
export default function HomePage(){
return <main id="main-content" className="editorial-home">
  <ReadingMotion/>
  <JsonLd data={{"@context":"https://schema.org","@type":"WebApplication",name:"Describe This Image",url:"https://describethisimage.com",applicationCategory:"MultimediaApplication",operatingSystem:"All",offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}}}/>
  <JsonLd data={{"@context":"https://schema.org","@type":"FAQPage",mainEntity:questions.map(([name,text])=>({"@type":"Question",name,acceptedAnswer:{"@type":"Answer",text}}))}}/>
  <ReadingMasthead/>
  <section className="reading-workspace" aria-labelledby="workspace-title">
    <div className="editorial-heading"><h2 id="workspace-title" data-enter>Your image.<br/>Your words.</h2><p data-enter data-delay="90">A longer description. A line of alt text. A caption that fits.<br/>{" "}Upload an image and choose what you need.</p></div>
    <DescriberTool/>
  </section>
  <section className="reading-method" aria-labelledby="method-title">
    <div className="method-side" data-enter><h2 id="method-title">Give the image<br/>a little context.</h2><Link href="/how-to-use">A guide to better descriptions <ArrowUpRight size={20}/></Link></div>
    <div className="method-copy">
      <p className="reading-statement" data-enter>Good words start with a closer look.</p>
      <div data-enter><h3>Choose your image</h3><p>A landscape, a product, a portrait. Start with a clear image and let the visible details lead.</p></div>
      <div data-enter><h3>Find the right format</h3><p>Use detailed mode for a scene, a caption for a gallery, or alt text that makes sense on your page. Choose from eight languages.</p></div>
      <div data-enter><h3>Make it yours</h3><p>Read the draft alongside your image. Check names, small text and inferred details. Copy the result and shape it for your audience.</p></div>
    </div>
  </section>
  <section className="reading-plans" aria-labelledby="plans-title">
    <div className="plan-paper"><h2 id="plans-title" data-enter>A little.<br/>Or a lot.</h2><p data-enter>Start with one image.<br/>Make room for the next thousand.</p><Link href="/pricing" data-enter className="design-text-link">Compare every plan <ArrowUpRight size={22}/></Link></div>
    <div className="plan-ink" data-enter>
      <div className="plan-annual"><p className="plan-price" data-enter>$49.90<span>/ year</span></p><p>Pro Annual · 2,000 descriptions each month.<br/>Batch processing. CSV export. Eight languages.</p><Link href="/pricing" className="design-button">Explore Pro <ArrowUpRight size={20}/></Link></div>
      <div className="plan-alternatives" data-enter><p><strong>Just getting started?</strong><br/>300 credits. {STARTER_PRICE} once. No expiry.</p><p><strong>Prefer monthly?</strong><br/>Pro at $9.90 per month.</p></div>
    </div>
  </section>
  <section className="reading-faq" aria-labelledby="faq-title"><h2 id="faq-title" data-enter>A few things<br/>to know.</h2><div>{questions.map(([question,answer])=><details key={question} data-enter><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}<Link href="/privacy" className="design-text-link">Image handling & privacy <ArrowUpRight size={20}/></Link></div></section>
</main>;
}
