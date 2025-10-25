// src/services/analysis.ts

export interface Journalist {
  id: number;
  name: string;
  section: string;
  articleCount: number;
  latestArticle: string;
  date: string;
  topics: string[];
  contact?: string;
  keywords: string[];
  beat?: string;
  email?: string;
  twitter?: string;
  expertise?: string[];
}

export function analyzeJournalists(journalists: Journalist[]) {
  // Ensure all journalists have required fields
  const enrichedJournalists = journalists.map((j, index) => ({
    ...j,
    id: index + 1,
    // Ensure topics array exists
    topics: j.topics && Array.isArray(j.topics) ? j.topics : [j.section || 'General'],
    // Ensure keywords array exists
    keywords: j.keywords && Array.isArray(j.keywords) ? j.keywords : ['journalism', 'news'],
    // Ensure beat is set
    beat: j.beat || j.section || 'General',
    // Ensure expertise is set
    expertise: j.expertise || [j.section || 'General', 'Reporting'],
  }));

  return {
    journalists: enrichedJournalists,
  };
}
