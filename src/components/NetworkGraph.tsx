import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Journalist, getTopicColor } from "@/lib/mockData";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface NetworkGraphProps {
  journalists: Journalist[];
}

const NetworkGraph = ({ journalists }: NetworkGraphProps) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showClusters, setShowClusters] = useState(true);

  // Get unique topics
  const allTopics = Array.from(new Set(journalists.flatMap(j => j.topics)));
  
  // Calculate positions for bipartite layout
  const journalistNodes = journalists.slice(0, 20); // Show top 20 for clarity
  const topicNodes = allTopics;

  return (
    <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Network Graph - Bipartite Visualization</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showClusters ? "default" : "outline"}
            onClick={() => setShowClusters(!showClusters)}
            className="bg-secondary hover:bg-secondary/90"
          >
            {showClusters ? "Hide" : "Show"} Clusters
          </Button>
          <Button size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative bg-background/50 rounded-lg p-8 min-h-[600px] overflow-auto">
        <svg width="100%" height="600" className="overflow-visible">
          <defs>
            {/* Cluster backgrounds */}
            {showClusters && (
              <>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </>
            )}
          </defs>

          {/* Cluster regions */}
          {showClusters && (
            <>
              <ellipse
                cx="200"
                cy="150"
                rx="120"
                ry="100"
                fill="hsl(var(--topic-politics))"
                opacity="0.1"
                stroke="hsl(var(--topic-politics))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text x="200" y="130" textAnchor="middle" className="text-xs fill-topic-politics font-semibold">
                Political Affairs Cluster
              </text>

              <ellipse
                cx="200"
                cy="450"
                rx="120"
                ry="100"
                fill="hsl(var(--topic-sports))"
                opacity="0.1"
                stroke="hsl(var(--topic-sports))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text x="200" y="430" textAnchor="middle" className="text-xs fill-topic-sports font-semibold">
                Sports & Culture Cluster
              </text>
            </>
          )}

          {/* Connections (edges) */}
          {journalistNodes.map((journalist, jIndex) => {
            const jY = 50 + (jIndex * 550 / journalistNodes.length);
            return journalist.topics.map((topic, tIndex) => {
              const topicIndex = topicNodes.indexOf(topic);
              const tY = 50 + (topicIndex * 550 / topicNodes.length);
              const isSelected = selectedNode === journalist.name || selectedNode === topic;
              return (
                <line
                  key={`${journalist.id}-${topic}`}
                  x1="200"
                  y1={jY}
                  x2="700"
                  y2={tY}
                  stroke={isSelected ? "hsl(var(--secondary))" : "hsl(var(--border))"}
                  strokeWidth={isSelected ? "3" : "1"}
                  opacity={isSelected ? "0.8" : "0.3"}
                  className="transition-all duration-300"
                />
              );
            });
          })}

          {/* Journalist nodes (left side - circles) */}
          {journalistNodes.map((journalist, index) => {
            const y = 50 + (index * 550 / journalistNodes.length);
            const isSelected = selectedNode === journalist.name;
            const radius = 6 + (journalist.articleCount / 20);
            
            return (
              <g
                key={journalist.id}
                className="cursor-pointer"
                onClick={() => setSelectedNode(isSelected ? null : journalist.name)}
              >
                <circle
                  cx="200"
                  cy={y}
                  r={radius}
                  fill="hsl(var(--secondary))"
                  stroke={isSelected ? "hsl(var(--primary-glow))" : "transparent"}
                  strokeWidth="3"
                  opacity={isSelected ? "1" : "0.8"}
                  className="transition-all duration-300 hover:opacity-100"
                  filter={isSelected ? "url(#glow)" : undefined}
                />
                <text
                  x="220"
                  y={y + 4}
                  className={`text-xs fill-card-foreground ${isSelected ? "font-bold" : ""}`}
                >
                  {journalist.name}
                </text>
              </g>
            );
          })}

          {/* Topic nodes (right side - squares) */}
          {topicNodes.map((topic, index) => {
            const y = 50 + (index * 550 / topicNodes.length);
            const isSelected = selectedNode === topic;
            const count = journalists.filter(j => j.topics.includes(topic)).length;
            const size = 8 + (count / 2);

            return (
              <g
                key={topic}
                className="cursor-pointer"
                onClick={() => setSelectedNode(isSelected ? null : topic)}
              >
                <rect
                  x={700 - size}
                  y={y - size}
                  width={size * 2}
                  height={size * 2}
                  fill="hsl(var(--topic-orange))"
                  stroke={isSelected ? "hsl(var(--primary-glow))" : "transparent"}
                  strokeWidth="3"
                  opacity={isSelected ? "1" : "0.8"}
                  className="transition-all duration-300 hover:opacity-100"
                  filter={isSelected ? "url(#glow)" : undefined}
                />
                <text
                  x="720"
                  y={y + 4}
                  className={`text-xs fill-card-foreground ${isSelected ? "font-bold" : ""}`}
                >
                  {topic}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-4 rounded-lg border border-border">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-secondary"></div>
              <span>Journalists (size = article count)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-topic-orange"></div>
              <span>Topics/Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-border"></div>
              <span>Coverage connection</span>
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm p-4 rounded-lg border border-secondary shadow-glow max-w-xs animate-scale-in">
            <h4 className="font-semibold text-secondary mb-2">{selectedNode}</h4>
            {journalists.find(j => j.name === selectedNode) ? (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Section:</span>{" "}
                  {journalists.find(j => j.name === selectedNode)?.section}
                </p>
                <p>
                  <span className="text-muted-foreground">Articles:</span>{" "}
                  {journalists.find(j => j.name === selectedNode)?.articleCount}
                </p>
                <p>
                  <span className="text-muted-foreground">Topics:</span>{" "}
                  {journalists.find(j => j.name === selectedNode)?.topics.join(", ")}
                </p>
              </div>
            ) : (
              <div className="text-sm">
                <p>
                  <span className="text-muted-foreground">Covered by:</span>{" "}
                  {journalists.filter(j => j.topics.includes(selectedNode)).length} journalists
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkGraph;
