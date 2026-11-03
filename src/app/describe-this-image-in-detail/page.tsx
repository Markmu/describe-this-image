import type { Metadata } from "next";
import Link from "next/link";
import { DescriberTool } from "@/components/DescriberTool";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Describe This Image in Detail – Deep Scene & Object Breakdown",
  description: "Draft descriptions of scenes, artwork, and portraits when image description is available. Review visible details and check inferred claims before use.",
  alternates: {
    canonical: "https://describethisimage.com/describe-this-image-in-detail/",
  },
};

export default function DescribeInDetailPage() {
  const deepExamples = [
    {
      title: "Fine Art & Oil Paintings",
      desc: "Describe visible colors, composition, and brushwork. Check artist names, dates, and historical context against a trusted source."
    },
    {
      title: "Human Portraits & Fashion",
      desc: "Describe visible clothing, posture, and surroundings. Avoid inferring identity, sensitive traits, or intent from appearance."
    },
    {
      title: "Technical Diagrams & UI",
      desc: "Use a draft to explain a diagram or screen layout. Verify small text, labels, numbers, and relationships against the original."
    },
    {
      title: "Architectural & Real Estate",
      desc: "Describe the visible layout, lighting, and furnishings. A photograph cannot establish exact measurements or construction materials."
    }
  ];

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          Back to Standard Tool
        </Link>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Detailed Descriptions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Describe This Image in Detail
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Draft a longer description of the subject, setting, colors, and lighting when image description is available. Review the result against your image.
          </p>
        </div>

        {/* Dedicated Tool with Detailed Mode Locked */}
        <DescriberTool initialMode="detailed" fixedMode={true} />

        {/* Key Features of Detailed Mode */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              What to Include and Check
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Use these prompts to review a detailed draft. The image may not contain enough information to answer every question.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deepExamples.map((item, index) => (
              <div key={index} className="p-5 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 shrink-0" />
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Comparison Block */}
        <div className="bg-blue-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold">Illustrative Caption and Detailed Description</h2>
          <p className="text-sm text-blue-100">These examples illustrate writing styles. They are not generated results from your image.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="font-bold text-blue-200 uppercase tracking-wider block mb-2">Short Caption Example</span>
              <p className="text-gray-300">
                &ldquo;A coffee cup sitting on an outdoor wooden table next to a notebook.&rdquo;
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="font-bold text-emerald-300 uppercase tracking-wider block mb-2">Detailed Description Example</span>
              <p className="text-gray-200 leading-relaxed">
                &ldquo;An overhead photograph of a coffee cup on a wooden table. A notebook and pen sit beside the cup. Light from one side casts shadows across the table, and the wood grain is visible around the objects.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

