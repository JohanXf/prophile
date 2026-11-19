function createFont(defaultVar: string) {
  return (opts?: Record<string, any>) => ({
    variable: (opts?.variable as string) || defaultVar,
    className: "",
  });
}

export const Geist_Mono = createFont("--font-geist-mono");
export const Inter = createFont("--font-inter");
export const Roboto = createFont("--font-roboto");
export const Outfit = createFont("--font-outfit");
export const Space_Grotesk = createFont("--font-space-grotesk");
export const Playfair_Display = createFont("--font-playfair");
export const Montserrat = createFont("--font-montserrat");
export const DM_Sans = createFont("--font-dm-sans");
export const Syne = createFont("--font-syne");
export const Oxanium = createFont("--font-oxanium");
export const Pacifico = createFont("--font-pacifico");
export const Caveat = createFont("--font-caveat");
export const Dancing_Script = createFont("--font-dancing-script");
export const Pixelify_Sans = createFont("--font-pixelify");

export default function localFont(opts?: Record<string, any>) {
  return { variable: (opts?.variable as string) || "--font-local", className: "" };
}
