// src/services/analysis.ts

type Journalist = {
  latestArticle: string;
  topics?: string[];
};

export function analyzeJournalists(journalists: Journalist[]) {
  // Example keyword/topic extraction
  const keywords: Record<string, number> = {};
  journalists.forEach(j => {
    if (j.latestArticle) {
      j.latestArticle.split(" ").forEach(word => {
        if (word.length > 4) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    }
  });
  // Attach topics based on simple matching
  const topics = ["Politics", "Sports", "Business", "Technology", "Health"];
  journalists.forEach(j => {
    j.topics = [];
    topics.forEach(topic => {
      if (j.latestArticle && j.latestArticle.toLowerCase().includes(topic.toLowerCase())) {
        j.topics?.push(topic);
      }
    });
  });
  return { journalists, keywords: Object.entries(keywords) };
}
