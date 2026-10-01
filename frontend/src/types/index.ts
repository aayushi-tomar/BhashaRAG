export interface DocumentSource {
  document: string;
  page: number;
}

export interface QueryRequest {
  question: string;
  use_expansion: boolean;
  use_reranker: boolean;
  voice: boolean;
  voice_lang: string;
}

export interface QueryResponse {
  answer: string;
  sources: DocumentSource[];
  audio_url: string | null;
}

export interface UploadResponse {
  status: string;
  files: string[];
}

export interface IndexResponse {
  status: string;
  files_indexed: number;
}

export interface DocumentsResponse {
  documents: string[];
}

export interface HealthResponse {
  status: string;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: DocumentSource[];
  audioUrl?: string | null;
  timestamp: Date;
  isError?: boolean;
  is404NotIndexed?: boolean;
  queryConfig?: {
    use_expansion: boolean;
    use_reranker: boolean;
    voice: boolean;
    voice_lang: string;
  };
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export interface VoiceLanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: VoiceLanguageOption[] = [
  { code: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी", region: "India" },
  {
    code: "en-IN",
    label: "English",
    nativeLabel: "Indian English",
    region: "India",
  },
  {
    code: "bn-IN",
    label: "Bengali",
    nativeLabel: "বাংলা",
    region: "West Bengal",
  },
  { code: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்", region: "Tamil Nadu" },
  {
    code: "te-IN",
    label: "Telugu",
    nativeLabel: "తెలుగు",
    region: "Andhra / Telangana",
  },
  {
    code: "mr-IN",
    label: "Marathi",
    nativeLabel: "मराठी",
    region: "Maharashtra",
  },
  {
    code: "gu-IN",
    label: "Gujarati",
    nativeLabel: "ગુજરાતી",
    region: "Gujarat",
  },
  {
    code: "kn-IN",
    label: "Kannada",
    nativeLabel: "ಕನ್ನಡ",
    region: "Karnataka",
  },
  {
    code: "ml-IN",
    label: "Malayalam",
    nativeLabel: "മലയാളം",
    region: "Kerala",
  },
  { code: "pa-IN", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", region: "Punjab" },
  { code: "od-IN", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", region: "Odisha" },
];
