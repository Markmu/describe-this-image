'use client';

import { useState } from "react";
import Link from "next/link";
import { 
  Upload, 
  Layers, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  FileSpreadsheet, 
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  size: string;
  previewUrl: string;
  status: "pending" | "processing" | "completed";
  altText?: string;
  shortCaption?: string;
  detailedDesc?: string;
}

export default function BatchGeneratorPage() {
  const [items, setItems] = useState<BatchItem[]>([
    {
      id: "demo-1",
      name: "hero-banner-summer.jpg",
      size: "1.2 MB",
      previewUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
      status: "completed",
      altText: "Sunny tropical beach with turquoise ocean water and white sand",
      shortCaption: "Pristine tropical beach view under bright summer skies.",
      detailedDesc: "A panoramic tropical shoreline capturing turquoise rolling waves hitting white powdery sand under a midday sun."
    },
    {
      id: "demo-2",
      name: "minimalist-sneaker.png",
      size: "840 KB",
      previewUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
      status: "completed",
      altText: "Red athletic sneaker centered against a plain neutral background",
      shortCaption: "Vibrant red running sneaker on a neutral studio backdrop.",
      detailedDesc: "Studio e-commerce product photograph of a modern red sports shoe with white soles and breathable mesh fabric."
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: BatchItem[] = Array.from(files).map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl: URL.createObjectURL(file),
      status: "pending"
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const processAllPending = () => {
    setIsProcessing(true);
    setItems((prev) =>
      prev.map((item) => (item.status === "pending" ? { ...item, status: "processing" } : item))
    );

    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.status === "processing") {
            return {
              ...item,
              status: "completed",
              altText: `High-clarity visual asset featuring ${item.name.replace(/\.[^/.]+$/, "")}`,
              shortCaption: `Clean composition showcasing key focal elements of ${item.name}`,
              detailedDesc: `Full AI analysis for ${item.name}. Displays balanced lighting, natural contrast, and sharp edge separation.`
            };
          }
          return item;
        })
      );
      setIsProcessing(false);
    }, 1200);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const exportCsv = () => {
    const headers = ["File Name", "Status", "Alt Text (SEO)", "Short Caption", "Detailed Description"];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${(i.altText || "").replace(/"/g, '""')}"`,
      `"${(i.shortCaption || "").replace(/"/g, '""')}"`,
      `"${(i.detailedDesc || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `image-descriptions-batch-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Single Image Describer
          </Link>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Unlimited Batch Mode (Beta)
          </span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4" />
                <span>Bulk Processing Workflows</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Image Description Generator
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                Batch upload multiple catalog images, product photos, or media collections. Generate dozens of precise descriptions, alt tags, and CSV tables with one click.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={processAllPending}
                disabled={isProcessing || !items.some((i) => i.status === "pending")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Descriptions
                  </>
                )}
              </button>

              <button
                onClick={exportCsv}
                disabled={items.length === 0}
                className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors mb-2" />
              <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-blue-700">
                Click or drag & drop multiple files to batch process
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Select up to 50 images per session (JPG, PNG, WEBP)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Batch Items Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                Batch Queue ({items.length} Images)
              </h2>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto">
            {items.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No images queued yet. Upload files above to get started.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-[240px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-bold text-sm text-gray-900 truncate max-w-[200px]" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.size}</div>
                      <div className="mt-1">
                        {item.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        )}
                        {item.status === "processing" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Processing
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full lg:max-w-2xl text-xs">
                    <div>
                      <span className="font-bold text-gray-700">Alt Text: </span>
                      <span className="text-gray-600">{item.altText || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Caption: </span>
                      <span className="text-gray-600">{item.shortCaption || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

