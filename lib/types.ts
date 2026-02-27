export type Role = 'admin' | 'member';

export type BookAvailability = 'available' | 'checked_out';

export type TransactionAction = 'checkout' | 'checkin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  publishedYear?: number;
  coverUrl?: string;
  description?: string;
  aiSummary?: string;
  aiSuggestedGenre?: string;
  tags: string[];
  searchBlob: string;
  availability: BookAvailability;
  borrowedByUid?: string;
  borrowedByName?: string;
  borrowedAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdByUid: string;
  updatedByUid: string;
}

export interface CirculationTransaction {
  id: string;
  bookId: string;
  bookTitle: string;
  action: TransactionAction;
  memberUid: string;
  memberName: string;
  actorUid: string;
  actorName: string;
  dueDate?: string;
  createdAt: string;
}

export interface CirculationMutationResponse {
  book: Book;
  transaction: CirculationTransaction;
}

export interface CirculationHistoryResponse {
  items: CirculationTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiUserContext {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface BooksListResponse {
  items: Book[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalyticsOverview {
  activeLoans: number;
  overdueCount: number;
  totalBooks: number;
  monthlyCheckouts: Array<{ month: string; count: number }>;
}

export interface DashboardAiInsight {
  overview: string;
  healthStatus: 'stable' | 'watch' | 'critical';
  highlights: string[];
  recommendations: string[];
}

export interface CatalogAiRecommendation {
  recommendedBook: Pick<Book, 'id' | 'title' | 'author' | 'genre' | 'coverUrl' | 'tags' | 'availability'> | null;
  reason: string;
  whyItFits: string[];
  basedOn: {
    checkoutCount: number;
    checkinCount: number;
    favoriteGenres: string[];
    favoriteTags: string[];
  };
}

export interface BookAiEnrichmentResponse {
  aiSummary: string;
  aiSuggestedGenre: string;
  tags: string[];
  source: 'ai' | 'fallback';
}
