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
}

export interface OutletData {
  outlet: string;
  detectedWebsite: string;
  journalists: Journalist[];
  totalArticles: number;
  topSection: { name: string; percentage: number };
  mostActive: { name: string; count: number };
}

const sections = ["Politics", "Sports", "Business", "Technology", "Entertainment", "Health", "Economy"];
const topicMap: Record<string, string[]> = {
  Politics: ["Politics", "Government", "Elections", "Policy"],
  Sports: ["Sports", "Cricket", "Football", "Olympics"],
  Business: ["Business", "Markets", "Startups", "Finance"],
  Technology: ["Technology", "AI", "Software", "Innovation"],
  Entertainment: ["Entertainment", "Cinema", "Music", "Culture"],
  Health: ["Health", "Medicine", "Wellness", "Research"],
  Economy: ["Economy", "Trade", "GDP", "Banking"],
};

const firstNames = [
  "Priya", "Rajesh", "Anjali", "Vikram", "Kavya", "Arjun", "Sneha", "Rohan", 
  "Divya", "Karan", "Meera", "Aditya", "Nisha", "Sanjay", "Pooja", "Rahul",
  "Simran", "Amit", "Isha", "Nikhil", "Riya", "Varun", "Ananya", "Kunal",
  "Tanvi", "Siddharth", "Neha", "Akash", "Kriti", "Manish", "Shreya", "Dev",
  "Maya", "Ravi", "Tara", "Jay", "Zara", "Neil", "Sara", "Kabir", "Aarav", "Diya"
];

const lastNames = [
  "Sharma", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Gupta", "Menon",
  "Iyer", "Joshi", "Chopra", "Verma", "Kapoor", "Rao", "Desai", "Mehta",
  "Shah", "Bhat", "Pillai", "Shetty", "Bhatt", "Agarwal", "Malhotra", "Ghosh"
];

const articleTitles = [
  "Budget Analysis 2025: Key Highlights",
  "Breaking: Major Policy Reform Announced",
  "Market Surge: Tech Stocks Rally",
  "Cricket World Cup: India Advances",
  "Healthcare Reform Bill Passed",
  "Election Campaign Heats Up",
  "Startup Unicorn Raises $500M",
  "Climate Summit: Nations Agree on Targets",
  "Box Office Report: New Blockbuster",
  "AI Breakthrough in Medical Diagnosis",
  "Infrastructure Development Plan Unveiled",
  "Sports Academy Expansion Program",
  "Economic Growth Projections Revised",
  "Technology Innovation Summit 2025",
  "Entertainment Industry Awards Season",
];

const keywords = [
  "reform", "policy", "economy", "growth", "innovation", "technology", "healthcare",
  "education", "infrastructure", "investment", "market", "trade", "development",
  "sustainability", "digital", "transformation", "leadership", "governance", "strategy",
  "budget", "finance", "security", "climate", "energy", "research", "progress"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateMockJournalists(count: number = 40): Journalist[] {
  const journalists: Journalist[] = [];
  const usedNames = new Set<string>();

  for (let i = 1; i <= count; i++) {
    let name: string;
    do {
      name = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const section = getRandomElement(sections);
    const topics = getRandomElements(topicMap[section] || [section], Math.floor(Math.random() * 3) + 1);
    const articleCount = Math.floor(Math.random() * 80) + 5;
    
    journalists.push({
      id: i,
      name,
      section,
      articleCount,
      latestArticle: getRandomElement(articleTitles),
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      topics,
      contact: Math.random() > 0.5 ? `twitter.com/${name.toLowerCase().replace(' ', '')}` : undefined,
      keywords: getRandomElements(keywords, Math.floor(Math.random() * 4) + 2),
    });
  }

  return journalists.sort((a, b) => b.articleCount - a.articleCount);
}

export function generateOutletData(outletName: string): OutletData {
  const journalists = generateMockJournalists(40);
  const totalArticles = journalists.reduce((sum, j) => sum + j.articleCount, 0);
  
  const sectionCounts: Record<string, number> = {};
  journalists.forEach(j => {
    sectionCounts[j.section] = (sectionCounts[j.section] || 0) + j.articleCount;
  });
  
  const topSection = Object.entries(sectionCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  const mostActive = journalists[0];

  return {
    outlet: outletName,
    detectedWebsite: `www.${outletName.toLowerCase().replace(/\s+/g, '')}.com`,
    journalists,
    totalArticles,
    topSection: {
      name: topSection[0],
      percentage: Math.round((topSection[1] / totalArticles) * 100),
    },
    mostActive: {
      name: mostActive.name,
      count: mostActive.articleCount,
    },
  };
}

export function getTopicColor(topic: string): string {
  const topicColors: Record<string, string> = {
    Politics: "bg-topic-politics",
    Government: "bg-topic-politics",
    Elections: "bg-topic-politics",
    Policy: "bg-topic-politics",
    Sports: "bg-topic-sports",
    Cricket: "bg-topic-sports",
    Football: "bg-topic-sports",
    Olympics: "bg-topic-sports",
    Business: "bg-topic-business",
    Markets: "bg-topic-business",
    Startups: "bg-topic-business",
    Finance: "bg-topic-business",
    Technology: "bg-topic-tech",
    AI: "bg-topic-tech",
    Software: "bg-topic-tech",
    Innovation: "bg-topic-tech",
    Entertainment: "bg-topic-entertainment",
    Cinema: "bg-topic-entertainment",
    Music: "bg-topic-entertainment",
    Culture: "bg-topic-entertainment",
    Health: "bg-topic-health",
    Medicine: "bg-topic-health",
    Wellness: "bg-topic-health",
    Research: "bg-topic-health",
    Economy: "bg-topic-orange",
    Trade: "bg-topic-orange",
    GDP: "bg-topic-orange",
    Banking: "bg-topic-orange",
  };
  
  return topicColors[topic] || "bg-muted";
}
