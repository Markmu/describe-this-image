import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { SAMPLE_IMAGES } from "@/data/samples";
import {
  ACCOUNT_WELCOME_CREDITS, CREDITS_PER_IMAGE, GUEST_FREE_CREDITS,
  STARTER_PRICE, STARTER_CREDITS, STARTER_IMAGES,
  PRO_MONTH_PRICE, PRO_MONTH_CREDITS, PRO_MONTH_IMAGES,
  PRO_YEAR_PRICE, PRO_YEAR_MONTHLY_CREDITS, PRO_YEAR_MONTHLY_IMAGES,
} from "@/lib/plans";
import { PricingCheckoutButton } from "@/components/PricingCheckoutButton";

export const metadata: Metadata = {
  title: "Pricing Plans – Describe This Image Pro & Credit Packs",
  description: "Compare Free, Starter, Pro Monthly and Pro Annual image description plans. Starter is " + STARTER_PRICE + ", monthly Pro is " + PRO_MONTH_PRICE + " and annual Pro is " + PRO_YEAR_PRICE + ".",
  alternates: { canonical: "https://describethisimage.com/pricing/" },
};

const plans = [
  {
    id: "free", name: "Free", price: "$0", period: "to try",
    description: "A first look at what your image can say.",
    allowance: "1 image", allowancePeriod: "without an account",
    credits: GUEST_FREE_CREDITS + " guest credits",
    features: [
      ACCOUNT_WELCOME_CREDITS + " welcome credits for 2 more image descriptions with Google",
      "No daily refill",
      "Guest trial subject to shared-network limits",
      "Single-image upload and image links",
    ],
    label: "Describe an image",
  },
  {
    id: "starter", name: "Starter Pack", price: STARTER_PRICE, period: "one-time payment",
    description: "For images that come along now and then.",
    allowance: STARTER_IMAGES + " images", allowancePeriod: "to describe when you need",
    credits: STARTER_CREDITS.toLocaleString("en-US") + " credits · no expiry",
    features: [
      "No subscription or recurring charge",
      "Single-image descriptions and alt text",
      "Use your credits at your own pace",
    ],
    label: "Buy Starter Pack",
  },
  {
    id: "pro-month", name: "Pro Monthly", price: PRO_MONTH_PRICE, period: "billed monthly",
    description: "For a month of image descriptions.",
    allowance: PRO_MONTH_IMAGES + " images", allowancePeriod: "to describe each month",
    credits: PRO_MONTH_CREDITS.toLocaleString("en-US") + " credits / month",
    features: [
      "Batch image descriptions",
      "Alt text and CSV export",
      "Credits expire at the next monthly window",
    ],
    label: "Get Pro Monthly",
  },
  {
    id: "pro-year", name: "Pro Annual", price: PRO_YEAR_PRICE, period: "billed yearly",
    description: "For image work throughout the year.",
    allowance: PRO_YEAR_MONTHLY_IMAGES + " images", allowancePeriod: "to describe each month",
    credits: PRO_YEAR_MONTHLY_CREDITS.toLocaleString("en-US") + " credits / month",
    features: [
      "50% more monthly credits than Pro Monthly",
      "Batch descriptions, alt text and CSV export",
      "12 monthly credit windows; no rollover",
    ],
    label: "Get Pro Annual",
  },
] as const;

export default function PricingPage() {
  return <main id="main-content" className="reading-page pricing-page">
    <PageIntro title={<>Your images.<br />The right plan.</>}>
      <p>Image descriptions, alt text and captions. Choose a one-time pack or make room for image work every month.</p>
    </PageIntro>

    <section className="pricing-plans" aria-label="Image description plans">
      <div className="plan-options">
        {plans.map(plan => <article className="plan-option" data-featured={plan.id === "pro-year"} key={plan.id} aria-labelledby={"plan-" + plan.id}>
          <h2 id={"plan-" + plan.id}>{plan.name}</h2>
          <p className="plan-description">{plan.description}</p>
          <div className="plan-payment"><p className="plan-card-price">{plan.price}</p><p className="plan-period">{plan.period}</p></div>
          <div className="plan-allowance"><p><strong>{plan.allowance}</strong><span>{plan.allowancePeriod}</span></p><p className="plan-credits">{plan.credits}</p></div>
          <div className="plan-card-action">{plan.id === "free"
            ? <Link className="quiet-button" href="/#describer">{plan.label}</Link>
            : <PricingCheckoutButton offerId={plan.id} label={plan.label} featured={plan.id === "pro-year"} />}</div>
          <ul className="plan-features">{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        </article>)}
      </div>
      <p className="pricing-terms">All prices in USD. One image description uses {CREDITS_PER_IMAGE} credits and includes all four text formats. Sample previews use no credits.</p>
    </section>

    <section className="page-section plan-image-examples" aria-labelledby="reading-examples-title">
      <div><h2 id="reading-examples-title">One image.<br />Four readings.</h2><p>Portraits, places, products and charts. Every plan includes detailed image descriptions, short captions, alt text and social copy in eight languages.</p><Link href="/#describer" className="design-text-link">Explore the sample readings<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      <div className="plan-image-strip">{SAMPLE_IMAGES.map(image => <figure key={image.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.thumbUrl} alt={image.outputs.alt} width={300} height={400} loading="lazy" />
      </figure>)}</div>
    </section>

    <section className="page-section pricing-billing" aria-labelledby="billing-title">
      <div className="page-section-heading"><h2 id="billing-title">A few details.<br />Before you choose.</h2><p>Credits give you room to describe your images. Choose your pace, with billing and credit windows explained below.</p></div>
      <div className="billing-notes">
        <div><h3>Payments and subscriptions.</h3><p>Payments are handled by Creem. Starter is a one-time purchase. Pro Monthly is billed {PRO_MONTH_PRICE} each month; Pro Annual is billed {PRO_YEAR_PRICE} each year. Manage your subscription through your account.</p></div>
        <div><h3>Your monthly allowance.</h3><p>Pro Annual includes {PRO_YEAR_MONTHLY_IMAGES} image descriptions each month for 12 months. Subscription credits expire at the next monthly window. Starter credits have no expiry.</p></div>
        <div><h3>Your first descriptions.</h3><p>Describe one image without an account. Sign in with Google for {ACCOUNT_WELCOME_CREDITS} welcome credits, enough to describe two more images. Welcome credits have no expiry or daily refill.</p></div>
        <div><h3>Your images and words.</h3><p>Image descriptions require an available image service. Review every draft before publishing. <Link href="/privacy">Read how images are handled.</Link></p></div>
      </div>
    </section>
  </main>;
}
