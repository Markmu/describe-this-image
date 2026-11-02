'use client';
import { useEffect } from "react";
export function ReadingMotion() {
  useEffect(()=>{
    if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries) if(entry.isIntersecting) {
        const element=entry.target as HTMLElement;
        const picture=element.dataset.enter==="picture";
        element.animate(picture?[{transform:"scale(1.035)",opacity:.65},{transform:"scale(1)",opacity:1}]:[{transform:"translateY(24px)",opacity:.3},{transform:"translateY(0)",opacity:1}],
          {duration:picture?1000:700,easing:"cubic-bezier(.22,1,.36,1)",delay:Number(element.dataset.delay||0)});
        observer.unobserve(element);
      }
    },{threshold:.12});
    document.querySelectorAll("[data-enter]").forEach(element=>observer.observe(element));
    return()=>observer.disconnect();
  },[]);
  return null;
}
