'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef,useState } from "react";
import { ArrowUpRight, Aperture } from "lucide-react";
import { UserAuthButton } from "./UserAuthButton";
const links=[["/","Describer"],["/image-description-generator","Batch"],["/how-to-use","Guide"],["/pricing","Pricing"]];
export function Navbar(){
  const pathname=usePathname();const [openPath,setOpenPath]=useState<string|null>(null);const open=openPath===pathname;const trigger=useRef<HTMLButtonElement>(null);
  if(pathname==="/admin"||pathname.startsWith("/admin/"))return null;
  return <header className="site-masthead" onKeyDown={event=>{if(event.key==="Escape"){setOpenPath(null);trigger.current?.focus();}}}>
    <Link href="/" className="site-wordmark" aria-label="DescribeThisImage home" onClick={()=>setOpenPath(null)}><Aperture aria-hidden="true" size={25}/><span>Describe<br/>this image.</span></Link>
    <nav aria-label="Main navigation" className="site-navigation">{links.map(([href,label])=><Link href={href} key={href} aria-current={pathname===href?"page":undefined}>{label}</Link>)}</nav>
    <div className="site-account"><UserAuthButton/><Link href="/#describer" className="site-start">Start creating <ArrowUpRight size={18}/></Link></div>
    <button ref={trigger} className="site-menu-trigger" aria-controls="mobile-navigation" aria-expanded={open} onClick={()=>setOpenPath(open?null:pathname)}>{open?"Close":"Menu"}<span aria-hidden="true">{open?"−":"+"}</span></button>
    <div id="mobile-navigation" className="site-mobile-menu" hidden={!open}><nav aria-label="Mobile navigation">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpenPath(null)} aria-current={pathname===href?"page":undefined}>{label}<ArrowUpRight size={22}/></Link>)}</nav><UserAuthButton/></div>
  </header>;
}
