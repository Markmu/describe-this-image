import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                DI
              </div>
              <span className="font-bold text-gray-900 tracking-tight">
                DescribeThisImage
              </span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed">
              Instant AI image description generator. Convert visual assets into accessible alt text, e-commerce listings, social media captions, and detailed scene breakdowns.
            </p>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Features</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600">Free Image Describer</Link>
              </li>
              <li>
                <Link href="/image-description-generator" className="hover:text-blue-600">Batch Image Generator</Link>
              </li>
              <li>
                <Link href="/describe-this-image-in-detail" className="hover:text-blue-600">Detailed Description Mode</Link>
              </li>
              <li>
                <Link href="/ai-image-description" className="hover:text-blue-600">AI Description Use Cases</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Resources</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/how-to-use" className="hover:text-blue-600">How to Describe a Picture</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-600">Pricing & API Plans</Link>
              </li>
              <li>
                <span className="text-gray-400">SEO Alt Text Best Practices</span>
              </li>
              <li>
                <span className="text-gray-400">E-Commerce Product Vision</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">About</div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              describethisimage.com delivers vision recognition without sign-up hurdles. Built for marketers, creators, educators, and accessibility specialists.
            </p>
            <div className="text-xs text-gray-400">
              © 2026 DescribeThisImage. All rights reserved.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 text-xs text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>Privacy First: Uploaded images are processed in-memory and never stored.</div>
          <div className="flex gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Contact Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

