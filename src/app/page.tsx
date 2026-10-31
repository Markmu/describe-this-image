import type { Metadata } from "next";
import Link from "next/link";
import { DescriberTool } from "@/components/DescriberTool";
import { JsonLd } from "@/components/JsonLd";
import { 
  ArrowRight, 
  Upload, 
  Sliders, 
  Copy, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Eye, 
  Share2, 
  Layers, 
  Search, 
  Zap, 
  ChevronRight 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Describe This Image – Free AI Image Describer, No Sign-Up",
  description: "Upload any photo and describe this image in detail with AI. Get object recognition, scene breakdown, alt text and captions in seconds. Free, no login.",
  alternates: {
    canonical: "https://describethisimage.com/",
  },
  openGraph: {
    title: "Describe This Image – Free AI Image Describer",
    description: "Upload any photo and describe this image in detail with AI. Get object recognition, alt text and captions in seconds.",
    url: "https://describethisimage.com/",
    siteName: "Describe This Image",
    type: "website",
  },
};

export default function HomePage() {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Describe This Image",
    "url": "https://describethisimage.com/",
    "description": "Upload any photo and describe this image in detail with AI. Free image description generator without login.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How to describe this image in detail?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your picture or paste a public image URL into our tool. Select the 'Detailed Description' mode to get an in-depth breakdown covering composition, focal objects, lighting, textures, and scene environment."
        }
      },
      {
        "@type": "Question",
        "name": "What is the difference between 'describe a picture' and 'describe this image'?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Both terms reflect the same underlying user intent: translating visual elements into clear, structured text. DescribeThisImage supports both natural scene pictures and technical graphics or diagrams."
        }
      },
      {
        "@type": "Question",
        "name": "Can this AI describe photos with people or portraits?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The AI analyzes clothing, posture, facial expressions, background ambiance, and lighting without storing sensitive biometric records."
        }
      },
      {
        "@type": "Question",
        "name": "Is there any free credit limit or sign-up requirement?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can describe images completely free without creating an account or logging in. For high-volume automated batch processing and CSV export, check our Pro plan."
        }
      },
      {
        "@type": "Question",
        "name": "Which file formats and sizes are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support all common image file types including JPG, JPEG, PNG, WEBP, and GIF up to 20MB per upload."
        }
      }
    ]
  };

  return (
    <>
      <JsonLd data={webAppSchema} />
      <JsonLd data={faqSchema} />

      <main className="flex-1 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        {/* Hero Section & Interactive Tool */}
        <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span>Free AI Visual Intelligence Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Describe This Image
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Upload any photo and describe this image in detail with AI. Get scene breakdown, object recognition, accessibility alt text, and social captions in seconds.
            </p>
          </div>

          {/* First Screen Tool */}
          <DescriberTool />
        </section>

        {/* Section 1: How to Describe This Image in Seconds */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                How to Describe This Image in Seconds
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Transform any visual asset into accurate, readable descriptions in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-200/70 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-md shadow-blue-500/20">
                  1
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload or Link Your Image
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Drag and drop your local photo or paste a direct web image link. No account creation or registration needed.
                </p>
              </div>

              <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-200/70 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-md shadow-blue-500/20">
                  2
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Select Output Mode
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Choose between detailed scene breakdown, short caption, SEO alt text, or ready-to-post social media copy.
                </p>
              </div>

              <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-200/70 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-md shadow-blue-500/20">
                  3
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-blue-600" />
                  Copy & Use Everywhere
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Copy the generated text with one click into your CMS, Shopify product page, accessibility tag, or social channels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: What You Get */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                What You Get: 4 Specialized Output Modes
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Tailored outputs crafted specifically for search engines, screen readers, e-commerce stores, and creators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Detailed Description</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  Full scene breakdown including foreground and background elements, color palettes, ambient lighting, and composition geometry.
                </p>
                <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  Best for research & analysis <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Short Caption</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  Punchy, one-sentence overview summarizing the core visual subject matter clearly and concisely.
                </p>
                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  Best for catalogs & galleries <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Alt Text (Accessibility)</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  WCAG-compliant descriptive text written for screen readers and search crawlers to boost organic image ranking.
                </p>
                <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  Essential for web masters <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Social Caption</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  Engagement-focused copy formulated with natural tone, relevant context, emojis, and trending hashtags.
                </p>
                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                  Ready for Instagram & LinkedIn <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Describe This Picture in Any Language */}
        <section className="py-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Global Accessibility</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 mb-4 tracking-tight leading-snug">
                  Describe This Picture in Any Language
                </h2>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6">
                  Whether you search for "describe this image", "describe a picture", or need multi-lingual asset descriptions for global e-commerce, our neural vision engine generates fluent descriptions across English, Spanish, French, German, Chinese, Japanese, and more.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Native Grammar & Phrasing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Localized Cultural Context</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>One-Click Language Switch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Translation Latency</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  Multilingual Sample Preview
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-xs leading-relaxed space-y-1">
                  <span className="text-blue-300 font-bold">English:</span>
                  <p className="text-gray-200">A serene misty morning landscape over emerald pine hills with soft diffuse sunrise lighting.</p>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-xs leading-relaxed space-y-1">
                  <span className="text-emerald-300 font-bold">Español:</span>
                  <p className="text-gray-200">Un paisaje sereno y brumoso al amanecer sobre colinas de pinos con iluminación suave.</p>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-xs leading-relaxed space-y-1">
                  <span className="text-amber-300 font-bold">Français:</span>
                  <p className="text-gray-200">Un paysage serein et brumeux au lever du soleil sur des collines de pins verdoyantes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Internal Links Cards */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Explore Specialized Image Description Tools
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Deep dive into dedicated generators, technical guides, and batch processing workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/image-description-generator"
                className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                    Image Description Generator
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Batch upload multiple photos at once. Generate dozens of descriptions simultaneously and export clean CSV spreadsheets.
                  </p>
                </div>
                <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Batch Generator <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/ai-image-description"
                className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-purple-600 transition-colors">
                    AI Image Description Guide
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Learn how AI vision architectures analyze visual scenes, extract metadata, and assist with web accessibility and commerce.
                  </p>
                </div>
                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read AI Capabilities <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/describe-this-image-in-detail"
                className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-emerald-600 transition-colors">
                    Describe This Image in Detail
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    In-depth analysis mode tailored for intricate portraits, architectural diagrams, fine art, and product specifications.
                  </p>
                </div>
                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Launch Detailed Mode <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Section */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Common questions about using our AI image describer tool.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                  How to describe this image in detail?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Simply upload your picture or paste a public image URL into our tool. Select the "Detailed Description" mode to receive an in-depth breakdown covering composition, focal objects, lighting, textures, and scene environment.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                  What is the difference between "describe a picture" and "describe this image"?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Both terms reflect the exact same user intent: translating visual elements into clear, structured text. DescribeThisImage supports everyday photo scenes as well as complex technical diagrams, UI mockups, and artwork.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                  Can this AI describe photos with people or portraits?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Yes. The AI analyzes clothing, posture, facial expressions, background ambiance, and lighting without storing sensitive biometric records.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                  Is there any free credit limit or sign-up requirement?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  You can describe images completely free without creating an account or logging in. For high-volume automated batch processing and CSV export, check our Pro plan.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                  Which file formats and sizes are supported?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We support all standard web image formats including JPG, PNG, WEBP, and GIF up to 20MB per upload.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

