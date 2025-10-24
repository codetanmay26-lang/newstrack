import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  title: string;
  content: string | string[];
}

const Documentation = () => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const sections: Section[] = [
    {
      title: "Stage 0: Website Detection",
      content: "The system automatically identifies the official website of the entered media outlet in real-time using web search and verification. No pre-saved databases or manual configuration required. Detected website is displayed before proceeding to extraction.",
    },
    {
      title: "Stage 1: Journalist Ecosystem Extraction",
      content: "Identifies all author/journalist sections within detected website. Extracts metadata for each journalist: Name, Section/Beat, Article Count, Latest Article. Continues scraping until minimum 30 profiles retrieved. Real-time progress shown during extraction.",
    },
    {
      title: "Stage 2: Intelligence Analysis",
      content: "Categorizes journalists by publication frequency and topical focus. Extracts keywords and entities from article titles using simple NLP (no LLMs). Displays activity patterns through timeline graphs, topic distributions via charts, and highlights top contributors. Word clouds visualize trending terms.",
    },
    {
      title: "Stage 3: Network and Relationship Analysis",
      content: "Builds bipartite graph connecting journalists (blue nodes) to topics/sections (orange nodes) like Politics, Sports, Economy. Each journalist linked to topics they've covered based on article metadata. Visualizes internal clustering showing groups of journalists covering similar themes with colored region boundaries. Optional: Cross-outlet analysis aggregates data from multiple outlets to identify overlaps.",
    },
    {
      title: "Stage 4: Presentation and Visualization",
      content: "Real-time feed displays detected journalists as discovered. Searchable index with filtering by name, topic, section, or activity. Analytics dashboard shows comprehensive metrics: top beats, most active journalists, total authors. Interactive graph interface with zoom, pan, and click-to-highlight connections.",
    },
  ];

  const technicalConstraints = [
    "Uses only web scraping and public data extraction",
    "No LLMs or journalism-specific APIs",
    "No paid or proprietary datasets",
    "Ethical handling of publicly available information only",
  ];

  const dataFields = [
    { field: "Journalist Name", description: "Full name of author", example: "John Doe" },
    { field: "Section/Beat", description: "Coverage area", example: "Politics" },
    { field: "Article Count", description: "Total articles found", example: "45" },
    { field: "Latest Article", description: "Most recent piece", example: "Budget Analysis 2025" },
    { field: "Publication Date", description: "Date of latest article", example: "2025-10-20" },
    { field: "Topics Covered", description: "All covered themes", example: '["Politics", "Economy"]' },
    { field: "Contact/Social", description: "Public links if available", example: "Twitter/LinkedIn icon" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-secondary bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-muted-foreground">
            Complete guide to NewsTrace's 5-stage processing system
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">How It Works - 5 Stages</h2>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="gradient-card rounded-xl border border-border overflow-hidden shadow-elevated"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-left">{section.title}</h3>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-secondary" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.has(index) && (
                  <div className="px-6 pb-4 text-muted-foreground animate-fade-in">
                    {Array.isArray(section.content) ? (
                      <ul className="list-disc list-inside space-y-2">
                        {section.content.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Constraints */}
        <div className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Technical Constraints</h2>
          <div className="gradient-card p-6 rounded-xl border border-border shadow-elevated">
            <ul className="space-y-3">
              {technicalConstraints.map((constraint, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Data Fields */}
        <div className="animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Data Fields Extracted</h2>
          <div className="gradient-card rounded-xl border border-border shadow-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-6 font-semibold">Field Name</th>
                    <th className="text-left py-3 px-6 font-semibold">Description</th>
                    <th className="text-left py-3 px-6 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {dataFields.map((field, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-6 font-medium">{field.field}</td>
                      <td className="py-3 px-6 text-muted-foreground">{field.description}</td>
                      <td className="py-3 px-6 text-sm text-secondary">{field.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-4">
            <a href="/" className="text-secondary hover:underline">
              ← Back to Home
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="/about" className="text-secondary hover:underline">
              About NewsTrace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
