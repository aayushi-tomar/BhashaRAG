import {
  DocumentsResponse,
  HealthResponse,
  IndexResponse,
  QueryRequest,
  QueryResponse,
  UploadResponse,
} from "../types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Read the body once as text; a failed response.json() would consume the stream.
    const raw = await response.text().catch(() => "");
    let detail = raw;
    try {
      const j = JSON.parse(raw);
      detail =
        typeof j.detail === "string"
          ? j.detail
          : j.message || JSON.stringify(j.detail ?? j);
    } catch {
      /* not JSON, keep raw text */
    }
    throw new ApiError(
      detail || `Request failed with status ${response.status}`,
      response.status,
      detail,
    );
  }
  return response.json();
}

export const api = {
  /**
   * Health check
   */
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse<HealthResponse>(res);
  },

  /**
   * List uploaded documents
   */
  async getDocuments(): Promise<DocumentsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/documents`);
    return handleResponse<DocumentsResponse>(res);
  },

  /**
   * Upload multiple PDF files
   */
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<UploadResponse>(res);
  },

  /**
   * Index all uploaded documents
   */
  async indexDocuments(reset: boolean = true): Promise<IndexResponse> {
    const res = await fetch(`${API_BASE_URL}/api/index?reset=${reset}`, {
      method: "POST",
    });
    return handleResponse<IndexResponse>(res);
  },

  /**
   * Send a multilingual question
   */
  async query(payload: QueryRequest): Promise<QueryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<QueryResponse>(res);
  },

  /**
   * Resolve an audio URL relative to API_BASE_URL
   */
  resolveAudioUrl(audioUrl: string | null | undefined): string | null {
    if (!audioUrl) return null;
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      return audioUrl;
    }
    const cleanPath = audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`;
    return `${API_BASE_URL}${cleanPath}`;
  },
};
