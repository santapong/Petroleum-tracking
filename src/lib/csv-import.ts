import Papa from "papaparse";

export interface CsvParseResult<T> {
  rows: T[];
  errors: string[];
}

export async function readCsvFromRequest<T>(
  req: Request
): Promise<CsvParseResult<T>> {
  const contentType = req.headers.get("content-type") || "";
  let text: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return { rows: [], errors: ["No file field in multipart body"] };
    }
    text = await file.text();
  } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
    text = await req.text();
  } else {
    return { rows: [], errors: [`Unsupported content-type: ${contentType}`] };
  }

  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return {
    rows: parsed.data,
    errors: parsed.errors.map((e) => `${e.code}: ${e.message}`),
  };
}
