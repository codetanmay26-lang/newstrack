import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ZoomIn, ZoomOut, RefreshCw, Network } from "lucide-react";

interface Journalist {
  id: number;
  name: string;
  section: string;
  articleCount: number;
  topics: string[];
  [key: string]: any;
}

interface NetworkGraphProps {
  journalists: Journalist[];
}

const NetworkGraph = ({ journalists }: NetworkGraphProps) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Fixed dimensions with proper centering
  const svgWidth = 1200;
  const svgHeight = 700;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Color palette
  const sectionColors: Record<string, string> = {
    'Politics': '#3b82f6',
    'Business': '#10b981',
    'Technology': '#8b5cf6',
    'Sports': '#f59e0b',
    'Entertainment': '#ec4899',
    'Health': '#14b8a6',
    'General': '#6b7280',
    'News': '#6366f1',
    'Opinion': '#f97316',
  };

  // Prepare nodes with proper positioning
  const { journalistNodes, topicNodes, connections } = useMemo(() => {
    const topJournalists = journalists.slice(0, 25);
    const allTopics = Array.from(new Set(topJournalists.flatMap(j => j.topics || [j.section])));

    // Journalists in outer circle
    const jNodes = topJournalists.map((j, i) => {
      const angle = (i / topJournalists.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 280;
      return {
        id: `j-${j.id}`,
        type: 'journalist' as const,
        name: j.name,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: 8 + Math.min(j.articleCount / 8, 10),
        color: sectionColors[j.section] || sectionColors['General'],
        data: j,
      };
    });

    // Topics in inner circle
    const tNodes = allTopics.map((topic, i) => {
      const angle = (i / allTopics.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 100;
      return {
        id: `t-${topic}`,
        type: 'topic' as const,
        name: topic,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: 14,
        color: sectionColors[topic] || '#6b7280',
        data: { topic },
      };
    });

    const conns = topJournalists.flatMap(j => {
      const topics = j.topics || [j.section];
      return topics.map(topic => ({
        source: `j-${j.id}`,
        target: `t-${topic}`,
      }));
    });

    return { journalistNodes: jNodes, topicNodes: tNodes, connections: conns };
  }, [journalists]);

  const allNodes = [...journalistNodes, ...topicNodes];

  return (
    <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Network className="h-5 w-5 text-secondary" />
            Network Visualization
          </h2>
          <p className="text-sm text-muted-foreground">
            {journalistNodes.length} journalists • {topicNodes.length} topics • {connections.length} connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setZoom(1); setSelectedNode(null); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Graph Container - CENTERED */}
      <div className="relative bg-gradient-to-br from-background via-background to-secondary/5 rounded-lg border border-border shadow-inner flex items-center justify-center" style={{ minHeight: '750px' }}>
        <svg 
          width={svgWidth} 
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
          }}
          className="mx-auto"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
            </filter>
          </defs>

          {/* Background circles */}
          <g opacity="0.04">
            <circle cx={centerX} cy={centerY} r="100" fill="none" stroke="currentColor" strokeWidth="1"/>
            <circle cx={centerX} cy={centerY} r="200" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4"/>
            <circle cx={centerX} cy={centerY} r="280" fill="none" stroke="currentColor" strokeWidth="1"/>
          </g>

          {/* Connections - THICKER */}
          <g>
            {connections.map((conn, i) => {
              const source = allNodes.find(n => n.id === conn.source);
              const target = allNodes.find(n => n.id === conn.target);
              if (!source || !target) return null;

              const isHighlighted = selectedNode === source.id || selectedNode === target.id ||
                                   hoveredNode === source.id || hoveredNode === target.id;

              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? source.color : 'currentColor'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  opacity={isHighlighted ? 0.8 : 0.2}
                  className="transition-all duration-200"
                />
              );
            })}
          </g>

          {/* Topic nodes */}
          {topicNodes.map(node => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const highlight = isSelected || isHovered;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                filter={highlight ? "url(#glow)" : "url(#shadow)"}
              >
                {/* Pulse ring */}
                {highlight && (
                  <rect
                    x={node.x - node.size - 6}
                    y={node.y - node.size - 6}
                    width={(node.size + 6) * 2}
                    height={(node.size + 6) * 2}
                    rx="6"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                )}
                
                <rect
                  x={node.x - node.size}
                  y={node.y - node.size}
                  width={node.size * 2}
                  height={node.size * 2}
                  rx="5"
                  fill={node.color}
                  stroke={highlight ? 'white' : 'none'}
                  strokeWidth="3"
                  opacity={highlight ? 1 : 0.9}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + node.size + 20}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={highlight ? 14 : 11}
                  fontWeight={highlight ? 'bold' : 'normal'}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}

          {/* Journalist nodes */}
          {journalistNodes.map(node => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const highlight = isSelected || isHovered;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                filter={highlight ? "url(#glow)" : "url(#shadow)"}
              >
                {/* Pulse ring */}
                {highlight && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size + 6}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={node.color}
                  stroke={highlight ? 'white' : 'none'}
                  strokeWidth="3"
                  opacity={highlight ? 1 : 0.9}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + node.size + 18}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={highlight ? 12 : 9}
                  fontWeight={highlight ? 'bold' : 'normal'}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name.length > 18 ? node.name.substring(0, 16) + '...' : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-md p-4 rounded-xl border border-border shadow-xl max-w-xs">
          <h4 className="text-sm font-semibold mb-3">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Journalists (outer circle)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Topics (inner circle)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <span>Connection</span>
            </div>
          </div>
        </div>

        {/* Selected Info */}
        {selectedNode && (() => {
          const node = allNodes.find(n => n.id === selectedNode);
          if (!node) return null;

          return (
            <div className="absolute top-6 right-6 bg-card/95 backdrop-blur-md p-5 rounded-xl border-2 border-secondary shadow-2xl max-w-sm">
              <h4 className="font-bold text-secondary mb-3">{node.name}</h4>
              {node.type === 'journalist' ? (
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section:</span>
                    <Badge style={{ backgroundColor: node.color, color: 'white' }}>
                      {node.data.section}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Articles:</span>
                    <span className="font-bold">{node.data.articleCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {node.data.topics.map((t: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Covered by <span className="font-bold text-foreground">
                      {journalists.filter(j => (j.topics || [j.section]).includes(node.name)).length}
                    </span> journalists
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Zoom */}
        <div className="absolute bottom-6 right-6 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border text-xs">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Hover over nodes to highlight • Click to view details • Use zoom controls
      </div>
    </div>
  );
};

export default NetworkGraph;
