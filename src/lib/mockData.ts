// src/lib/mockData.ts

export interface Journalist {
  id: number;
  name: string;
  profileUrl?: string;
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
  topSection: {
    name: string;
    percentage: number;
  };
  mostActive: {
    name: string;
    count: number;
  };
}

export function getTopicColor(topic: string): string {
  const topicColors: Record<string, string> = {
    // ✅ Solid, vibrant colors (always visible)
    Politics: "bg-blue-600",
    Government: "bg-blue-600",
    
    Sports: "bg-green-600",
    Cricket: "bg-green-600",
    
    Business: "bg-purple-600",
    Economy: "bg-purple-600",
    
    Technology: "bg-cyan-600",
    Science: "bg-cyan-600",
    
    Entertainment: "bg-pink-600",
    Cinema: "bg-pink-600",
    
    Health: "bg-red-600",
    Medicine: "bg-red-600",
    
    Education: "bg-yellow-600",
    Environment: "bg-emerald-600",
    International: "bg-indigo-600",
    Opinion: "bg-orange-600",
    News: "bg-slate-600",
    General: "bg-gray-600",
  };
  
  return topicColors[topic] || "bg-gray-600";
}

