import { Journalist } from "@/lib/mockData";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsTabProps {
  journalists: Journalist[];
}

const AnalyticsTab = ({ journalists }: AnalyticsTabProps) => {
  // Top Contributors
  const topContributors = journalists
    .slice(0, 10)
    .map(j => ({ name: j.name, articles: j.articleCount }));

  // Coverage Distribution by Topic
  const topicCounts: Record<string, number> = {};
  journalists.forEach(j => {
    j.topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });
  const coverageData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));

  const COLORS = [
    "hsl(var(--topic-politics))",
    "hsl(var(--topic-sports))",
    "hsl(var(--topic-business))",
    "hsl(var(--topic-tech))",
    "hsl(var(--topic-entertainment))",
    "hsl(var(--topic-health))",
    "hsl(var(--topic-orange))",
  ];

  // Activity Timeline (last 30 days)
  const timelineData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 20) + 10; // Mock data
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      articles: count,
    };
  });

  // Keyword Extraction
  const allKeywords = journalists.flatMap(j => j.keywords);
  const keywordCounts: Record<string, number> = {};
  allKeywords.forEach(keyword => {
    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
  });
  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 40);

  return (
    <div className="space-y-6">
      {/* Top Contributors */}
      <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
        <h3 className="text-lg font-semibold mb-4">Top 10 Contributors by Article Count</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topContributors} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }} 
            />
            <Bar dataKey="articles" fill="hsl(var(--secondary))" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Coverage Distribution */}
        <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
          <h3 className="text-lg font-semibold mb-4">Coverage Distribution by Topic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={coverageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {coverageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Timeline */}
        <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
          <h3 className="text-lg font-semibold mb-4">Publication Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="articles" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Keyword Cloud */}
      <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
        <h3 className="text-lg font-semibold mb-4">Trending Keywords from Article Titles</h3>
        <div className="flex flex-wrap gap-3 justify-center p-4">
          {topKeywords.map(([keyword, count]) => {
            const size = Math.min(12 + count * 0.5, 32);
            const opacity = 0.5 + (count / Math.max(...topKeywords.map(([, c]) => c))) * 0.5;
            return (
              <button
                key={keyword}
                className="px-3 py-1 rounded-full bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 cursor-pointer border border-secondary/30"
                style={{
                  fontSize: `${size}px`,
                  opacity,
                }}
                onClick={() => console.log("Filter by:", keyword)}
              >
                {keyword}
                <span className="ml-1 text-xs text-muted-foreground">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
