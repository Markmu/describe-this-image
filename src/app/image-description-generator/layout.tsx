import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Batch Image Descriptions",
  description: "Queue up to 50 images, generate descriptions with Pro, and export completed captions and alt text to CSV.",
};
export default function BatchLayout({children}:{children:React.ReactNode}) {return children;}
