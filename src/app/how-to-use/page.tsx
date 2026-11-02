import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Describe a Picture – Step-by-Step Guide",
  description: "Learn to upload an image, choose a description format, review generated text, and write alt text that fits its page context.",
  alternates: {
    canonical: "https://describethisimage.com/how-to-use/",
  },
};

export default function HowToUsePage() {
  return (
    <main id="main-content" className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          Back to Tool
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen aria-hidden="true" className="w-4 h-4" />
            <span>Practical Guide & Tutorial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            How to Describe a Picture
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
            Upload a JPEG, PNG, WebP, or GIF up to 10 MB and 40 megapixels. Choose a format and language, then generate a draft when the image service is available. Review it using the steps below.
          </p>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              01
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Identify the Main Subject (Foreground)</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Name the main subject: a person, object, animal, or landscape. Describe visible actions and positions before adding background details.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              02
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Describe the Setting</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Describe the visible setting, such as a room, street, or mountain trail. Avoid guessing a location, date, or time of day from appearance.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              03
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Observe Lighting, Colors, and Textures</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Describe visible colors, shadows, and textures. Check claims about materials against a product specification or other trusted source.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              04
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Choose the Appropriate Format</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Use a short caption for a gallery, a detailed description for a scene, or alt text for an image on a web page. Review every draft and remove invented details.
              </p>
            </div>
          </div>
        </div>

        <section id="alt-text" className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Writing alt text</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Describe what the image contributes to the page. A product image, a linked icon, and a decorative image serve different purposes. For a decorative image that adds no information, an empty alt attribute may be appropriate.</p>
          <p className="text-sm text-gray-600 leading-relaxed">There is no universal 125-character requirement. Keep the description concise and include the information readers need. Charts may need a longer text explanation alongside the image. Generated alt text does not establish accessibility compliance.</p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Upload and generation help</h2>
          <p className="text-sm text-gray-600 leading-relaxed">If an image link fails, the source website may block access from your browser. Download the image and upload the file. The server does not fetch remote image links.</p>
          <p className="text-sm text-gray-600 leading-relaxed">Images are resized and metadata is removed before generation. Upload images you have permission to share and avoid sensitive personal information.</p>
          <p className="text-sm text-gray-600 leading-relaxed">Choose English, Spanish, French, German, Chinese, Japanese, Portuguese, or Italian. Sample descriptions illustrate the formats; they are not results from your upload. Check small text, names, numbers, and inferred details in generated drafts.</p>
        </section>

        {/* Generation callout */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Try an Image Description</h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto">
            Try one guest description without login. Sign in for 10 free descriptions per day. If generation is unavailable, the tool will show an error.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <Sparkles aria-hidden="true" className="w-4 h-4" />
              Try Free Image Describer
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

