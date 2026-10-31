import type { Metadata } from "next";
import Link from "next/link";
import { DescriberTool } from "@/components/DescriberTool";
import { ArrowLeft, Sparkles, CheckCircle2, Sliders, Layers, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Describe This Image in Detail – Deep Scene & Object Breakdown",
  description: "Get comprehensive, highly detailed descriptions for complex images, artwork, architectural blueprints, and portraits with advanced visual recognition AI.",
  alternates: {
    canonical: "https://describethisimage.com/describe-this-image-in-detail/",
  },
};

export default function DescribeInDetailPage() {
  const deepExamples = [
    {
      title: "Fine Art & Oil Paintings",
      desc: "Analyzes brushstroke style, light sourcing (chiaroscuro), color palette values, emotional atmosphere, and historical artistic period influences."
    },
    {
      title: "Human Portraits & Fashion",
      desc: "Captures clothing fabrics, jewelry textures, posture, facial expressions, hair characteristics, and subtle depth-of-field background bokeh."
    },
    {
      title: "Technical Diagrams & UI",
      desc: "Transcribes chart titles, legends, data trend curves, UI button hierarchies, and system topology relationships accurately."
    },
    {
      title: "Architectural & Real Estate",
      desc: "Documents interior layout dimensions, natural window illumination, flooring materials, ceiling heights, and surrounding landscape integration."
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Standard Tool
        </Link>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High Precision Visual Parsing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Describe This Image in Detail
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Need more than a simple caption? Detailed Mode dissects multi-layered compositions, textures, lighting temperatures, and subtle nuances for comprehensive documentation.
          </p>
        </div>

        {/* Dedicated Tool with Detailed Mode Locked */}
        <DescriberTool initialMode="detailed" fixedMode={true} />

        {/* Key Features of Detailed Mode */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              What Sets Detailed Mode Apart?
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Standard image tagging provides surface labels. Detailed description extracts deep contextual semantics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deepExamples.map((item, index) => (
              <div key={index} className="p-5 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
          <h2 className="text-xl font-bold">Standard Caption vs. Detailed Scene Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="font-bold text-blue-200 uppercase tracking-wider block mb-2">Short Caption Output</span>
              <p className="text-gray-300">
                &ldquo;A coffee cup sitting on an outdoor wooden table next to a notebook.&rdquo;
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="font-bold text-emerald-300 uppercase tracking-wider block mb-2">Detailed Mode Output</span>
              <p className="text-gray-200 leading-relaxed">
                &ldquo;A top-down angle photograph of a ceramic artisanal coffee mug filled with espresso and latte art, resting on a weathered teak wooden table with visible natural grain. Soft morning golden sunlight casts long shadows across a textured grid-line notebook and a matte brass fountain pen positioned parallel on the right.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

