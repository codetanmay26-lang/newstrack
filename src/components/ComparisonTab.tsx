import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutletData } from "@/lib/mockData";

interface ComparisonTabProps {
  currentOutlet: OutletData;
}

const ComparisonTab = ({ currentOutlet }: ComparisonTabProps) => {
  const [outlets] = useState<OutletData[]>([currentOutlet]);

  // Get all topics from current outlet
  const allTopics = Array.from(new Set(currentOutlet.journalists.flatMap(j => j.topics)));

  return (
    <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Multi-Outlet Analysis</h2>
        <Button className="bg-secondary hover:bg-secondary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      {outlets.length === 1 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Analyze additional outlets to compare</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add more media outlets to see comparative analysis, shared topics, and ecosystem overlaps
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Enter another outlet name..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button className="bg-secondary hover:bg-secondary/90">
              Analyze
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Comparison Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Outlet Name</th>
                  <th className="text-left py-3 px-4">Total Journalists</th>
                  <th className="text-left py-3 px-4">Top Section</th>
                  <th className="text-left py-3 px-4">Most Active</th>
                  <th className="text-left py-3 px-4">Common Topics</th>
                </tr>
              </thead>
              <tbody>
                {outlets.map((outlet, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{outlet.outlet}</td>
                    <td className="py-3 px-4">{outlet.journalists.length}</td>
                    <td className="py-3 px-4">
                      {outlet.topSection.name} ({outlet.topSection.percentage}%)
                    </td>
                    <td className="py-3 px-4">
                      {outlet.mostActive.name} ({outlet.mostActive.count})
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {allTopics.slice(0, 3).map(topic => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overlap Analysis */}
          <div className="gradient-card p-6 rounded-lg border border-border/50">
            <h3 className="text-lg font-semibold mb-4">Topic Overlap Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Visual overlap diagram will appear here when multiple outlets are analyzed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;
