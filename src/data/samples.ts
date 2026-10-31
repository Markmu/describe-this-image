export interface SampleImage {
  id: string;
  title: string;
  category: string;
  thumbUrl: string;
  fullUrl: string;
  outputs: {
    detailed: string;
    short: string;
    alt: string;
    social: string;
  };
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "portrait",
    title: "Professional Portrait",
    category: "Portrait",
    thumbUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    fullUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85",
    outputs: {
      detailed: "A high-resolution close-up portrait of a young woman with warm brown eyes and natural makeup. She wears a minimalist beige knitted sweater. Soft natural golden hour light illuminates her facial features from the right side, casting subtle shadows and highlighting her refined skin texture. The background consists of a creamy, soft-focus neutral studio bokeh.",
      short: "Studio portrait of a young woman in warm natural lighting wearing a neutral knit sweater.",
      alt: "Close-up portrait of a woman with soft lighting and neutral background",
      social: "Effortless elegance in natural light ✨ Minimalist portrait goals. #portraitphotography #naturallight #minimalism"
    }
  },
  {
    id: "landscape",
    title: "Alpine Lake & Peaks",
    category: "Landscape",
    thumbUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    fullUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
    outputs: {
      detailed: "A majestic panoramic vista of jagged alpine mountain peaks towering over a crystal-clear turquoise glacial lake. Verdant evergreen pine forests skirt the lower slopes under an azure sky with wispy cirrus clouds. The glassy water surface produces an almost mirror-like reflection of the rugged snow-capped peaks in the foreground.",
      short: "Pristine turquoise glacial lake framed by steep snow-dusted mountains and lush pine forests.",
      alt: "Panoramic alpine lake reflecting snow-capped mountain peaks and pine trees",
      social: "Serenity found where mountains meet still waters 🏔️🌲 Breathe in the fresh alpine air. #wanderlust #landscape #naturelovers"
    }
  },
  {
    id: "product",
    title: "Minimalist Smartwatch",
    category: "E-Commerce",
    thumbUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    fullUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
    outputs: {
      detailed: "Commercial e-commerce studio product shot of a modern minimalist analog wristwatch with a matte black stainless steel casing and genuine tan leather strap. Displayed upright against an ultra-clean off-white background with subtle contact shadow beneath the buckle. Polished sapphire crystal glass clearly displays silver hour markers and delicate hands.",
      short: "Contemporary minimalist wristwatch with tan leather strap on clean white background.",
      alt: "Minimalist stainless steel wristwatch with tan leather strap on plain background",
      social: "Timeless craftsmanship for modern daily wear. Discover the understated elegance of classic minimalism. ⌚ #productdesign #watchoftheday #minimaliststyle"
    }
  },
  {
    id: "infographic",
    title: "Dashboard Analytics",
    category: "Chart & UI",
    thumbUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    fullUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
    outputs: {
      detailed: "A high-tech digital software dashboard displaying business analytics on a desktop screen. Prominently featured are multiple data visualization modules including a multi-colored gradient area chart showing quarterly revenue growth, a breakdown donut chart indicating user acquisition channels, and clean metric cards tracking conversion rates and active user counts in crisp typography.",
      short: "Modern SaaS business dashboard showcasing revenue charts, user metrics, and analytics cards.",
      alt: "Computer monitor displaying analytics dashboard with graphs, charts, and key performance indicators",
      social: "Data-driven decisions turn metrics into growth 📊 Unlocking key product insights on modern analytics boards. #tech #analytics #businessintelligence"
    }
  }
];

