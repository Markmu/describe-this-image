import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Upload, Sliders, Copy, HelpCircle, Sparkles, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Describe a Picture – Step-by-Step Guide",
  description: "Learn how to describe a picture clearly using AI tools or manual techniques. Covers composition, subject hierarchy, focal lighting, and accessibility best practices.",
  alternates: {
    canonical: "https://describethisimage.com/how-to-use/",
  },
};

export default function HowToUsePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tool
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Practical Guide & Tutorial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            How to Describe a Picture with Accuracy
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
            Whether preparing website alt tags for Google ranking, authoring educational materials, or generating social media copy, here is the structured method to describe any picture in seconds.
          </p>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              01
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Identify the Main Subject (Foreground)</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Begin with what immediately captures attention. Identify whether it is a person, an object, an animal, or a landscape. Note the primary action, posture, or physical arrangement before mentioning background elements.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              02
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Map the Context and Spatial Setting (Background)</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Detail where the scene takes place: indoors, outdoors, urban skyline, or mountain trail. State the weather, time of day (such as golden hour or twilight), and whether the background has a shallow depth-of-field blur.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              03
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Observe Lighting, Colors, and Textures</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Describe dominant colors, light direction (front-lit, back-lit, ambient diffuse), contrast, and material textures (such as matte wood, brushed steel, or sheer fabric).
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              04
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Choose the Appropriate Format</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Match output length to your distribution channel. Alt text requires compact functional descriptions (125 characters or fewer); e-commerce listings benefit from sensory details; research archives require multi-paragraph technical breakdowns.
              </p>
            </div>
          </div>
        </div>

        {/* Instant Automation Callout */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Automate Image Descriptions with AI</h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto">
            Save hours of manual writing. Use DescribeThisImage to analyze any picture and produce instant captions and alt tags.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Try Free Image Describer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

