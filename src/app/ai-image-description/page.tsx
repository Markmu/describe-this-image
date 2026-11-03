import type { Metadata } from "next";
import Link from "next/link";
import { ACCOUNT_WELCOME_CREDITS } from "@/lib/plans";
import { ArrowLeft, Brain, FileText, ShoppingBag, Globe, Share2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Image Descriptions – Formats & Uses",
  description: "Learn how modern AI models analyze images and generate structured descriptions. Compare alt text, e-commerce listings, accessibility, and social workflows.",
  alternates: {
    canonical: "https://describethisimage.com/ai-image-description/",
  },
};

export default function AiImageDescriptionPage() {
  return (
    <main id="main-content" className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          Back to Main Tool
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Brain aria-hidden="true" className="w-4 h-4" />
            <span>Image Description Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            AI Image Description & Scene Understanding
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
            AI can draft text about an image when an image service is available. Use the draft as a starting point, then check its details against the source.
          </p>
        </div>

        {/* 4 Core Use Cases */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Four Core Applications of AI Image Description
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Globe aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">1. Web Accessibility & SEO Alt Text</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Alt text communicates an image’s purpose to readers who cannot see it. Review the draft in the context of its page. Generated text does not establish accessibility compliance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShoppingBag aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">2. E-Commerce Product Listings</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Use a draft to describe visible product colors, shapes, and details. Verify materials, measurements, and specifications against product records.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Share2 aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">3. Social Media & Content Publishing</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Use your photo as a starting point for a caption. Add context, check the wording, and choose hashtags that fit the post.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <FileText aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">4. Organizing Image Collections</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Descriptions can help you label and search an image collection. Check names and categories before importing text into your catalog.
              </p>
            </div>
          </div>
        </div>

        {/* Style Comparison */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Compare Description Formats
          </h2>
          <div className="overflow-x-auto" role="region" aria-label="Description formats" tabIndex={0}>
            <table className="w-full min-w-[560px] text-left text-xs sm:text-sm border-collapse">
              <caption className="sr-only">Suggested lengths and uses for four description formats</caption>
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[11px] tracking-wider">
                  <th scope="col" className="py-3 px-4 font-semibold">Mode</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Suggested Length</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Audience</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Key Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="py-3 px-4 font-bold text-blue-600">Detailed Description</td>
                  <td className="py-3 px-4">3–5 Sentences</td>
                  <td className="py-3 px-4">Researchers, Designers</td>
                  <td className="py-3 px-4">Subject, setting, and visible details</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-600">Short Caption</td>
                  <td className="py-3 px-4">1 Sentence</td>
                  <td className="py-3 px-4">Galleries, Catalogs</td>
                  <td className="py-3 px-4">A brief overview of the main subject</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-indigo-600">Alt Text</td>
                  <td className="py-3 px-4">10–25 Words</td>
                  <td className="py-3 px-4">Website visitors</td>
                  <td className="py-3 px-4">Description suited to the page context</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-purple-600">Social Caption</td>
                  <td className="py-3 px-4">2–4 Sentences</td>
                  <td className="py-3 px-4">Social Audiences</td>
                  <td className="py-3 px-4">Conversational tone, emojis, and hashtags</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Try an Image Description</h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto">
            Try one guest description, or sign in for {ACCOUNT_WELCOME_CREDITS} welcome credits per account. No daily refill. Generation depends on image service availability.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <Sparkles aria-hidden="true" className="w-4 h-4" />
              Open Image Describer
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

