type FontSource = {
  family: string;
  url: string;
  format: "truetype" | "opentype" | "woff" | "woff2";
  weight: string;
  style: "normal" | "italic";
};

type FontDefinition = {
  labelKey: string;
  value: string;
  aliases: string[];
  sources: FontSource[];
};

export const DEFAULT_FONT_FAMILY = "\"Plus Jakarta Sans\", sans-serif";

const FONT_DEFINITIONS: FontDefinition[] = [
  {
    labelKey: "plusJakartaSans",
    value: DEFAULT_FONT_FAMILY,
    aliases: [
      "Plus Jakarta Sans, sans-serif",
      "\"Plus Jakarta Sans\", sans-serif",
    ],
    sources: [
      {
        family: "Plus Jakarta Sans",
        url: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TKn8.woff2",
        format: "woff2",
        weight: "400",
        style: "normal",
      },
      {
        family: "Plus Jakarta Sans",
        url: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qVw9TKn8.woff2",
        format: "woff2",
        weight: "600",
        style: "normal",
      },
      {
        family: "Plus Jakarta Sans",
        url: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qVA8TKn8.woff2",
        format: "woff2",
        weight: "700",
        style: "normal",
      },
    ],
  },
  {
    labelKey: "inter",
    value: "\"Inter\", sans-serif",
    aliases: ["Inter, sans-serif", "\"Inter\", sans-serif"],
    sources: [
      {
        family: "Inter",
        url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
        format: "woff2",
        weight: "400",
        style: "normal",
      },
      {
        family: "Inter",
        url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
        format: "woff2",
        weight: "600",
        style: "normal",
      },
      {
        family: "Inter",
        url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
        format: "woff2",
        weight: "700",
        style: "normal",
      },
    ],
  },
  {
    labelKey: "poppins",
    value: "\"Poppins\", sans-serif",
    aliases: ["Poppins, sans-serif", "\"Poppins\", sans-serif"],
    sources: [
      {
        family: "Poppins",
        url: "https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2",
        format: "woff2",
        weight: "400",
        style: "normal",
      },
      {
        family: "Poppins",
        url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2",
        format: "woff2",
        weight: "600",
        style: "normal",
      },
      {
        family: "Poppins",
        url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2",
        format: "woff2",
        weight: "700",
        style: "normal",
      },
    ],
  },
  {
    labelKey: "lora",
    value: "\"Lora\", serif",
    aliases: ["Lora, serif", "\"Lora\", serif"],
    sources: [
      {
        family: "Lora",
        url: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.woff2",
        format: "woff2",
        weight: "400",
        style: "normal",
      },
      {
        family: "Lora",
        url: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.woff2",
        format: "woff2",
        weight: "600",
        style: "normal",
      },
      {
        family: "Lora",
        url: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.woff2",
        format: "woff2",
        weight: "700",
        style: "normal",
      },
    ],
  },
];

const fontDataUrlCache = new Map<string, Promise<string>>();

const toDataUrl = async (url: string) => {
  if (!fontDataUrlCache.has(url)) {
    fontDataUrlCache.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load font: ${url}`);
          }
          return response.blob();
        })
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error(`Failed to read font: ${url}`));
              reader.readAsDataURL(blob);
            })
        )
    );
  }

  return fontDataUrlCache.get(url)!;
};

const findFontDefinition = (fontFamily?: string) => {
  const normalizedValue = fontFamily?.trim();
  if (!normalizedValue) {
    return FONT_DEFINITIONS[0];
  }

  return (
    FONT_DEFINITIONS.find(
      (definition) =>
        definition.value === normalizedValue ||
        definition.aliases.includes(normalizedValue) ||
        definition.aliases.some((alias) =>
          normalizedValue.includes(alias.replace(/"/g, ""))
        )
    ) || FONT_DEFINITIONS[0]
  );
};

const buildFontFaceRule = (source: FontSource, resolvedUrl: string) => `@font-face {
  font-family: "${source.family}";
  src: url("${resolvedUrl}") format("${source.format}");
  font-weight: ${source.weight};
  font-style: ${source.style};
  font-display: swap;
}`;

export const normalizeFontFamily = (fontFamily?: string) =>
  findFontDefinition(fontFamily).value;

export const getFontOptions = (t: (key: string) => string) =>
  FONT_DEFINITIONS.map((definition) => ({
    value: definition.value,
    label: t(definition.labelKey)
  }));

export const getFontFaceCss = async (
  fontFamily?: string,
  inline = false
) => {
  const definition = findFontDefinition(fontFamily);

  const rules = await Promise.all(
    definition.sources.map(async (source) => {
      let resolvedUrl = source.url;
      if (inline) {
        try {
          resolvedUrl = await toDataUrl(source.url);
        } catch {
          resolvedUrl = source.url;
        }
      }
      return buildFontFaceRule(source, resolvedUrl);
    })
  );

  return rules.join("\n");
};
