'use client';

import { useState } from "react";
import { SAMPLE_IMAGES, SampleImage } from "@/data/samples";
import { 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Copy, 
  Check, 
  Globe, 
  FileText, 
  MessageSquare, 
  Eye, 
  Share2,
  RefreshCw
} from "lucide-react";

interface DescriberToolProps {
  initialMode?: "detailed" | "short" | "alt" | "social";
  fixedMode?: boolean;
}

export function DescriberTool({ initialMode = "detailed", fixedMode = false }: DescriberToolProps) {
  const [activeMode, setActiveMode] = useState<"detailed" | "short" | "alt" | "social">(initialMode);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [currentImage, setCurrentImage] = useState<string>(SAMPLE_IMAGES[0].fullUrl);
  const [currentOutputs, setCurrentOutputs] = useState(SAMPLE_IMAGES[0].outputs);
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Portuguese", "Italian"
  ];

  const handleSelectSample = (sample: SampleImage) => {
    setCurrentImage(sample.fullUrl);
    setCurrentOutputs(sample.outputs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCurrentImage(base64);
        // Simulate analysis
        setTimeout(() => {
          setCurrentOutputs({
            detailed: `High-resolution user image analyzed. The subject is centrally placed with distinct contour lines, natural ambient light distribution, and balanced exposure. Surface textures and backdrop details indicate careful visual framing.`,
            short: "User uploaded photo featuring a clear central subject with ambient lighting.",
            alt: "User uploaded visual with clear subject focus and balanced exposure",
            social: "Fresh perspectives captured in stunning clarity 📸 #imageanalysis #aidescription"
          });
          setIsLoading(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setCurrentImage(urlInput.trim());
    setTimeout(() => {
      setCurrentOutputs({
        detailed: `Web asset fetched from remote URL. The image demonstrates well-calibrated contrast, clean focal plane, and balanced saturation throughout the scene.`,
        short: "Remote web image displaying high visual fidelity and centered focal points.",
        alt: "Remote image analyzed with balanced focal point and lighting",
        social: "Exploring new horizons through computational vision 🚀 #ai #vision"
      });
      setIsLoading(false);
      setUrlInput("");
    }, 700);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const outputTabs = [
    { id: "detailed" as const, label: "Detailed Description", icon: FileText, desc: "Scene breakdown, depth, lighting & textures" },
    { id: "short" as const, label: "Short Caption", icon: MessageSquare, desc: "Concise 1-sentence summary" },
    { id: "alt" as const, label: "Alt Text", icon: Eye, desc: "Web accessibility & SEO optimization" },
    { id: "social" as const, label: "Social Caption", icon: Share2, desc: "Engaging post copy with emojis & hashtags" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Top Banner: No Login Required Badge */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-100/60 px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-blue-900 font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>100% Free · No Sign-Up Needed · Instant Results</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="text-gray-600">Language:</span>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-white border border-blue-200 text-blue-900 text-xs rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        {/* Left Column: Image Input & Preview */}
        <div className="lg:col-span-5 p-6 space-y-6 flex flex-col justify-between">
          <div>
            {/* Input Options: Dropzone + URL */}
            <div className="space-y-3 mb-6">
              <label className="border-2 border-dashed border-gray-200 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors mb-2" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">
                  Drop image here, or browse
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Supports JPG, PNG, WEBP, GIF (Up to 20MB)
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="Or paste image URL here..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!urlInput.trim() || isLoading}
                  className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  Fetch
                </button>
              </form>
            </div>

            {/* Current Image Preview */}
            <div className="relative aspect-video rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center group shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage}
                alt="Selected preview image"
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                  <span className="text-xs font-medium tracking-wide">Analyzing Image Details...</span>
                </div>
              )}
            </div>
          </div>

          {/* Sample Images Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Or Try A Sample Image:
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all group"
                  title={sample.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sample.thumbUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] text-white py-0.5 text-center font-medium truncate px-1">
                    {sample.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output Tabs & Results */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Mode Tabs */}
            {!fixedMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {outputTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMode(tab.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        isActive
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                        <span className="text-xs font-bold leading-tight">{tab.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 line-clamp-1">{tab.desc}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900 text-sm">Deep Contextual Analysis Active</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
                  Detailed Mode
                </span>
              </div>
            )}

            {/* Generated Description Box */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Generated Output ({selectedLanguage})
                </span>
                <button
                  onClick={() => copyToClipboard(currentOutputs[activeMode])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Output"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm leading-relaxed min-h-[180px] font-normal selection:bg-blue-100">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-400 gap-2 py-12">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span>Processing visual elements...</span>
                  </div>
                ) : (
                  currentOutputs[activeMode]
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Format: <span className="font-semibold text-gray-700 uppercase">{activeMode}</span> · Ready to paste anywhere
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => copyToClipboard(currentOutputs[activeMode])}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

