import natural from 'natural';
import stopword from 'stopword';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Extract keywords from article titles using TF-IDF
 * @param {string[]} titles - Array of article titles
 * @param {number} topN - Number of top keywords to return
 * @returns {string[]} - Array of extracted keywords
 */
export function extractKeywords(titles, topN = 5) {
  if (!titles || titles.length === 0) return [];

  const tfidf = new TfIdf();

  // Add each title as a document
  titles.forEach(title => {
    if (title && typeof title === 'string') {
      tfidf.addDocument(title.toLowerCase());
    }
  });

  // Aggregate TF-IDF scores across all documents
  const keywordScores = {};

  titles.forEach((title, docIndex) => {
    const terms = tfidf.listTerms(docIndex);
    
    terms.forEach(term => {
      if (term.term.length > 3) {  // Ignore very short words
        keywordScores[term.term] = (keywordScores[term.term] || 0) + term.tfidf;
      }
    });
  });

  // Sort by score and return top N
  const sortedKeywords = Object.entries(keywordScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([keyword]) => keyword);

  // Remove stopwords
  const cleaned = stopword.removeStopwords(sortedKeywords);

  return cleaned.slice(0, topN);
}

/**
 * Extract entities (proper nouns) from text
 * @param {string} text - Input text
 * @returns {string[]} - Array of extracted entities
 */
export function extractEntities(text) {
  if (!text) return [];

  const tokens = tokenizer.tokenize(text);
  const entities = [];

  // Simple heuristic: Words starting with capital letter (excluding first word)
  tokens.forEach((token, index) => {
    if (index > 0 && /^[A-Z]/.test(token) && token.length > 2) {
      entities.push(token);
    }
  });

  return [...new Set(entities)];  // Remove duplicates
}

/**
 * Analyze journalist data to extract topics and keywords
 * @param {Object[]} journalists - Array of journalist objects
 * @returns {Object[]} - Enhanced journalist objects with NLP-derived keywords
 */
export function analyzeJournalistContent(journalists) {
  return journalists.map(journalist => {
    const titles = journalist.latestArticle ? [journalist.latestArticle] : [];
    
    // Extract keywords from article title
    const keywords = extractKeywords(titles, 5);
    
    // Extract entities
    const entities = extractEntities(journalist.latestArticle || '');

    // Derive topics from section and keywords
    const topics = [
      journalist.section,
      ...keywords.slice(0, 2),
      ...entities.slice(0, 1)
    ].filter(Boolean);

    return {
      ...journalist,
      keywords: keywords.length > 0 ? keywords : ['journalism', 'news', journalist.section?.toLowerCase()].filter(Boolean),
      topics: [...new Set(topics)],  // Remove duplicates
      entities: entities
    };
  });
}
