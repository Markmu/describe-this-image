'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
export function Footer(){const pathname=usePathname();const compact=pathname.startsWith("/account/");if(pathname==="/admin"||pathname.startsWith("/admin/"))return null;return <footer className={compact ? "reading-footer reading-footer-compact" : "reading-footer"}>
  <div className="footer-top"><p>There’s more to<br/>every image.</p><Link href="/#describer" className="design-button">Find the words <ArrowUpRight size={20}/></Link></div>
  <div className="footer-name" aria-hidden="true">Describe this image.</div>
  <div className="footer-bottom"><p>© 2026 DescribeThisImage</p><nav aria-label="Footer navigation"><Link href="/image-description-generator">Batch tool</Link><Link href="/ai-image-description">Image guide</Link><Link href="/describe-this-image-in-detail">Detailed mode</Link><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link></nav><p>Look. Describe. Make it yours.</p></div>
  <p className="photo-credit">Sample photography from <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>. Descriptions are drafts; review before use.</p>
</footer>;}
