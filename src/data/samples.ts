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
    title: "Portrait in Blue Light",
    category: "Portrait",
    thumbUrl: "/images/editorial/portrait.jpg",
    fullUrl: "/images/editorial/portrait.jpg",
    outputs: {
      "detailed": "A front-facing portrait of a woman wearing a dark crew-neck top. Blue light falls across one side of her face and hair, against a pale purple background. Her hair is pulled back, and she looks toward the camera.",
      "short": "Portrait of a woman in a dark top, lit in blue against a purple background.",
      "alt": "Woman with pulled-back hair wearing a dark top under blue and purple lighting.",
      "social": "A study in blue light and quiet expression. #PortraitPhotography #StudioLight"
}
  },
  {
    id: "landscape",
    title: "River Through a Mountain Valley",
    category: "Landscape",
    thumbUrl: "/images/editorial/landscape.jpg",
    fullUrl: "/images/editorial/landscape.jpg",
    outputs: {
      "detailed": "A river curves through a wooded valley beneath tall rock cliffs. Trees line the water, with rocks visible in the foreground. Warm light colors the sky and distant cliffs, contrasting with the darker valley below.",
      "short": "A river winds between trees and tall cliffs beneath a warm evening sky.",
      "alt": "River and trees framed by mountain cliffs under a pink sky.",
      "social": "The river leads the way through a valley of trees and towering cliffs. #LandscapePhotography #Nature"
}
  },
  {
    id: "product",
    title: "Minimalist Watches",
    category: "E-Commerce",
    thumbUrl: "/images/editorial/product.jpg",
    fullUrl: "/images/editorial/product.jpg",
    outputs: {
      "detailed": "Two round wristwatches with pale straps lie diagonally on a light gray surface. One watch has a dark circular face and a metallic rim. The second shows its pale back, with its strap extending toward the bottom of the image.",
      "short": "Two round watches with pale straps arranged on a light gray surface.",
      "alt": "Two pale wristwatches placed diagonally, showing a dark face and the back of a watch.",
      "social": "Two views of a simple watch design, set against soft gray. #WatchDesign #ProductPhotography"
}
  },
  {
    id: "infographic",
    title: "Analytics on Screen",
    category: "Chart & UI",
    thumbUrl: "/images/editorial/infographic.jpg",
    fullUrl: "/images/editorial/infographic.jpg",
    outputs: {
      "detailed": "A computer screen shows a dark analytics interface with cyan bar charts, line graphs and small panels of text. The charts vary in height and shape. A plant and bright background are visible above the screen; individual labels are too small to read in this view.",
      "short": "A dark analytics screen with cyan charts and line graphs.",
      "alt": "Computer screen displaying cyan bar charts and line graphs on a dark dashboard.",
      "social": "Charts, patterns and a closer look at the data. #Analytics #DataVisualization"
}
  }
];

