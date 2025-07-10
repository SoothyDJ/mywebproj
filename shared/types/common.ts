 
// File Path: /shared/types/common.ts
// Common TypeScript type definitions for Web Automation Platform
// REF-068: Complete type definitions for video analysis system

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export interface AutomationTask {
  id: number;
  userId: number;
  prompt: string;
  taskType: TaskType;
  status: TaskStatus;
  parameters: TaskParameters;
  resultsSummary?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
}

export type TaskType = 'youtube_scrape' | 'reddit_scrape' | 'general_analysis';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TaskParameters {
  maxResults?: number;
  timeFilter?: TimeFilter;
  searchQuery?: string;
  additionalOptions?: Record<string, any>;
}

export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year';

// Video types
export interface VideoData {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  description?: string;
  viewCount: string;
  likeCount?: number;
  commentCount?: number;
  duration: string;
  uploadDate: string;
  thumbnailUrl?: string;
  videoUrl: string;
  tags?: string[];
  category?: string;
  scrapedAt: string;
}

export interface ScrapedVideo extends VideoData {
  id: number;
  taskId: number;
  durationSeconds?: number;
  aiAnalysis?: string;
  sentimentScore?: number;
}

// AI Analysis types
export interface VideoAnalysis {
  summary: string;
  themes: string[];
  sentiment: SentimentType;
  sentimentScore: number;
  keyTopics: string[];
  contentType: ContentType;
  targetAudience: string;
  credibilityScore: number;
  engagementFactors: string[];
  notableElements: string[];
  recommendations: string;
}

export type SentimentType = 'positive' | 'negative' | 'neutral';

export type ContentType = 
  | 'educational' 
  | 'entertainment' 
  | 'documentary' 
  | 'horror' 
  | 'comedy' 
  | 'music' 
  | 'gaming' 
  | 'news' 
  | 'tutorial'
  | 'review'
  | 'unknown';

// Storyboard types
export interface Storyboard {
  title: string;
  totalScenes: number;
  estimatedDuration: string;
  scenes: StoryboardScene[];
  productionNotes?: string;
}

export interface StoryboardScene {
  sequenceNumber: number;
  sceneTitle?: string;
  duration: string;
  narrationText: string;
  visualElements: string[];
  audioCues: string[];
  transitionNotes?: string;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface StoryboardItem {
  id: number;
  videoId: number;
  sequenceNumber: number;
  sceneDescription: string;
  narrationText: string;
  timestampStart?: number;
  timestampEnd?: number;
  visualElements?: string[];
  audioCues?: string[];
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface TaskResponse extends ApiResponse<AutomationTask> {}

export interface TaskListResponse extends ApiResponse<{
  tasks: AutomationTask[];
  total: number;
  page?: number;
  limit?: number;
}> {}

export interface TaskResultsResponse extends ApiResponse<{
  task: AutomationTask;
  results: VideoAnalysisResult[];
  metadata: ResultsMetadata;
}> {}

// Combined result types
export interface VideoAnalysisResult {
  video: VideoData;
  analysis?: VideoAnalysis;
  storyboard?: Storyboard;
  attribution: AttributionInfo;
}

export interface AttributionInfo {
  originalUrl: string;
  channel: string;
  scrapedAt: string;
}

export interface ResultsMetadata {
  totalVideos: number;
  generatedAt: string;
  analysisComplete: number;
  storyboardsGenerated: number;
  averageViews?: number;
  topThemes?: ThemeCount[];
  sentimentDistribution?: SentimentDistribution;
}

export interface ThemeCount {
  theme: string;
  count: number;
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

// Content Analysis types
export interface ContentAnalyzerOptions {
  maxResults?: number;
  timeFilter?: TimeFilter;
  aiService?: 'openai' | 'claude';
  generateStoryboards?: boolean;
  includeSummary?: boolean;
}

export interface ContentAnalysisResults {
  videos: VideoData[];
  analyses: VideoAnalysis[];
  storyboards: Storyboard[];
  summary?: string;
  metadata: ResultsMetadata;
}

// Scraper types
export interface ScraperOptions {
  headless?: boolean;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
  proxy?: string;
}

export interface SearchParameters {
  query: string;
  timeFilter: TimeFilter;
  maxResults: number;
  sortBy?: 'relevance' | 'date' | 'views' | 'rating';
}

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

// AI Service types
export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIAnalysisRequest {
  videoData: VideoData;
  options?: {
    includeStoryboard?: boolean;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    customPrompt?: string;
  };
}

// Report types
export interface ReportData {
  videos: VideoData[];
  analyses: VideoAnalysis[];
  storyboards: Storyboard[];
  summary?: string;
  metadata: ResultsMetadata;
  prompt?: string;
}

export interface ReportOptions {
  format: 'html' | 'json' | 'pdf';
  includeStoryboards?: boolean;
  includeAnalysis?: boolean;
  customStyling?: string;
  exportPath?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: number;
  taskId?: number;
}

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'SCRAPER_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Utility types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  status?: TaskStatus;
  taskType?: TaskType;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Configuration types
export interface AppConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
  };
  database: DatabaseConfig;
  ai: {
    openai: AIServiceConfig;
    claude: AIServiceConfig;
    defaultService: 'openai' | 'claude';
  };
  scraper: ScraperOptions;
  storage: {
    uploadPath: string;
    maxFileSize: number;
    allowedTypes: string[];
  };
}

// Export all types as a namespace for easier importing
export namespace WebAutomationTypes {
  export type Task = AutomationTask;
  export type Video = VideoData;
  export type Analysis = VideoAnalysis;
  export type Story = Storyboard;
  export type Scene = StoryboardScene;
  export type Results = ContentAnalysisResults;
  export type Config = AppConfig;
  export type Error = AppError;
}