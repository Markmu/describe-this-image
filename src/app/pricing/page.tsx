import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { SAMPLE_IMAGES } from "@/data/samples";
import { PricingCheckoutButton } from "@/components/PricingCheckoutButton";

export const metadata: Metadata = {
  title: "Pricing Plans – Describe This Image Pro & Credit Packs",
  description: "Compare a $9.99 pack of 300 credits, $9.90 monthly Pro, and $49.90 annual Pro. Pro includes 2,000 credits per month. Add 1,000 credits for $5.",
  alternates: { canonical: "https://describethisimage.com/pricing/" },
};

const alternatives = [
  {
    id: "free", name: "Free", price: "$0", period: "to begin",
    features: ["1 description without login", "10 free descriptions per day with Google", "Single-image upload and supported image links"],
    label: "Try an image", unit: "$0 per image",
  },
  {
    id: "starter", name: "Starter Pack", price: "$9.99", period: "one payment",
    features: ["Credits never expire", "No subscription or recurring charge", "Single-image workflow with alt text"],
    label: "Buy Starter Pack", unit: "$0.033 per included credit",
  },
  {
    id: "pro-month", name: "Pro Monthly", price: "$9.90", period: "per month",
    features: ["2,000 credits each month", "Batch processing and CSV export", "Monthly credits expire at the next monthly window"],
    label: "Get Pro Monthly", unit: "$0.005 per included credit",
  },
] as const;

const comparison = [
  { name: "Free", price: "$0", credits: "1 guest description; 10 per day with Google", cost: "$0", use: "Try your first image.", featured: false },
  { name: "Starter Pack", price: "$9.99 once", credits: "300 credits, never expire", cost: "$0.033", use: "Occasional images, one purchase.", featured: false },
  { name: "Pro Monthly", price: "$9.90 / month", credits: "2,000 credits per month", cost: "$0.005", use: "Ongoing image work, billed monthly.", featured: false },
  { name: "Pro Annual", price: "$49.90 / year", credits: "2,000 credits per month for 12 months", cost: "$0.0021", use: "A year of Pro at a lower total price.", featured: true },
  { name: "Add-on Credits", price: "$5 per 1,000", credits: "1,000 credits, never expire", cost: "$0.005", use: "Extra credits for a larger workload.", featured: false },
];

export default function PricingPage() {
  return <main id="main-content" className="reading-page pricing-page">
    <PageIntro title={<>Simple pricing.<br />More words.</>}>
      <p>A description for one image. A plan for the next thousand. Choose the room you need.</p>
    </PageIntro>

    <section className="annual-offer" aria-labelledby="annual-title">
      <div>
        <h2 id="annual-title">Pro Annual</h2>
        <p className="annual-price">$49.90 <span>/ year</span></p>
        <div className="annual-action"><PricingCheckoutButton offerId="pro-year" label="Get Pro Annual" featured /></div>
        <p className="annual-billing">Billed $49.90 each year · $4.16/month equivalent</p>
      </div>
      <div className="annual-details">
        <p>2,000 descriptions each month.<br />Make them yours.</p>
        <ul>
          <li>Save 58% compared with 12 monthly payments</li>
          <li>Batch processing and alt text CSV export</li>
          <li>Four formats. Eight output languages.</li>
        </ul>
        <p className="page-note">Monthly credits expire at the next monthly window. $0.0021 per included credit when the full allowance is used.</p>
      </div>
    </section>

    <section className="page-section" aria-labelledby="alternatives-title">
      <div className="page-section-heading">
        <h2 id="alternatives-title">Other ways<br />to begin.</h2>
        <p>Every plan includes detailed descriptions, short captions, alt text and social captions in eight languages. One image uses one credit.</p>
      </div>
      <div className="plan-options">
        {alternatives.map(plan => <article className="plan-option" key={plan.id}>
          <div className="option-heading"><h3><span>{plan.name}</span><span className="option-price">{plan.price}<span>{plan.period}</span></span></h3><p className="page-note">{plan.unit}</p></div>
          <div className="option-description"><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
          <div className="option-action">{plan.id === "free"
            ? <Link className="quiet-button" href="/#describer">{plan.label}</Link>
            : <PricingCheckoutButton offerId={plan.id} label={plan.label} />}</div>
        </article>)}
      </div>
      <section className="credit-addon" aria-labelledby="addon-title">
        <div><h2 id="addon-title">A little extra room.</h2><p>Add 1,000 credits for $5. A single payment, with no expiry. $0.005 per credit, in packs of 1,000.</p></div>
        <PricingCheckoutButton offerId="addon-1000" label="Add 1,000 credits · $5" />
      </section>
    </section>

    <section className="page-section plan-image-examples" aria-labelledby="reading-examples-title">
      <div><h2 id="reading-examples-title">One credit.<br />Four readings.</h2><p>Portraits, places, products and charts. Each image gets a description, a caption, alt text and social copy.</p><Link href="/#describer" className="design-text-link">Explore the sample readings<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      <div className="plan-image-strip">{SAMPLE_IMAGES.map(image => <figure key={image.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.thumbUrl} alt={image.outputs.alt} width={300} height={400} loading="lazy" />
      </figure>)}</div>
    </section>

    <section className="page-section" aria-labelledby="comparison-title">
      <div className="page-section-heading"><h2 id="comparison-title">The details,<br />side by side.</h2><p>Choose by how often you create. Pro includes the batch workflow; Starter keeps things simple with a single purchase.</p></div>
      <table className="comparison-table" role="table">
        <caption>Prices in USD. Unit costs are rounded and assume use of the full allowance.</caption>
        <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Plan</th><th role="columnheader" scope="col">Price</th><th role="columnheader" scope="col">Included credits</th><th role="columnheader" scope="col">USD / credit</th><th role="columnheader" scope="col">For your work</th></tr></thead>
        <tbody role="rowgroup">{comparison.map(row => <tr role="row" key={row.name} data-featured={row.featured}>
          <th role="rowheader" scope="row">{row.name}</th>
          <td role="cell" data-label="Price">{row.price}</td>
          <td role="cell" data-label="Included credits">{row.credits}</td>
          <td role="cell" data-label="USD / credit">{row.cost}</td>
          <td role="cell" data-label="For your work">{row.use}</td>
        </tr>)}</tbody>
      </table>
      <div className="billing-notes">
        <div><h3>Billing, with clarity.</h3><p>Payments are handled by Creem. Starter and add-on packs are one-time purchases. Pro subscriptions are billed monthly or annually. Manage your subscription through your account.</p></div>
        <div><h3>Start with your first image.</h3><p>Try one description without an account, or sign in with Google for 10 free descriptions per day. Generation requires an available image service. <Link href="/privacy">Read how images are handled.</Link></p></div>
      </div>
    </section>
  </main>;
}
