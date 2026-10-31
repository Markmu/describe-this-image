import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Brain, Cpu, Eye, CheckCircle, FileText, ShoppingBag, Globe, Share2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Image Description & AI Describe Image – Technology & Use Cases",
  description: "Learn how modern AI models analyze images and generate structured descriptions. Compare alt text, e-commerce listings, accessibility, and social workflows.",
  alternates: {
    canonical: "https://describethisimage.com/ai-image-description/",
  },
};

export default function AiImageDescriptionPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Main Tool
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Brain className="w-4 h-4" />
            <span>Neural Vision Technology</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            AI Image Description & Scene Understanding
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
            Multimodal artificial intelligence connects computer vision and natural language processing to describe complex photographs, graphics, and screenshots with semantic accuracy.
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
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">1. Web Accessibility & SEO Alt Text</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Search engine crawlers and screen readers rely on descriptive alt attributes. AI models synthesize key subject traits, action verbs, and lighting context to produce compliant WCAG text.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">2. E-Commerce Product Listings</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Online retailers manage thousands of product SKUs. AI auto-extracts materials, hardware finishes, color codes, and form factors to generate rich catalog descriptions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">3. Social Media & Content Publishing</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Creators and agencies leverage vision models to brainstorm Instagram captions, Twitter summaries, and community updates directly from raw photo assets.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">4. Digital Asset Management (DAM)</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Large image repositories require searchable tags and descriptions. Semantic AI converts visual content into structured taxonomy for lightning-fast internal asset retrieval.
              </p>
            </div>
          </div>
        </div>

        {/* Style Comparison */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Output Style Comparison Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Target Length</th>
                  <th className="py-3 px-4 font-semibold">Primary Audience</th>
                  <th className="py-3 px-4 font-semibold">Key Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="py-3 px-4 font-bold text-blue-600">Detailed Description</td>
                  <td className="py-3 px-4">3–5 Sentences</td>
                  <td className="py-3 px-4">Researchers, Designers</td>
                  <td className="py-3 px-4">Full lighting, color, and scene breakdown</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-600">Short Caption</td>
                  <td className="py-3 px-4">1 Sentence</td>
                  <td className="py-3 px-4">Galleries, Catalogs</td>
                  <td className="py-3 px-4">Instant scanning and clear subject naming</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-indigo-600">Alt Text</td>
                  <td className="py-3 px-4">10–25 Words</td>
                  <td className="py-3 px-4">Screen Readers, Google Bot</td>
                  <td className="py-3 px-4">WCAG compliance without keyword stuffing</td>
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
          <h2 className="text-2xl font-bold">Try AI Vision Recognition Free</h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto">
            Experience real-time scene understanding without creating an account or providing payment details.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Launch DescribeThisImage Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

