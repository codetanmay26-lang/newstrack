import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, FileJson, X, Users, FileText, TrendingUp, Award, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import StatsCard from "@/components/StatsCard";
import JournalistCard from "@/components/JournalistCard";
import NetworkGraph from "@/components/NetworkGraph";
import AnalyticsTab from "@/components/AnalyticsTab";
import DataTable from "@/components/DataTable";
import { OutletData } from "@/lib/mockData";

const Dashboard = () => {
  const navigate = useNavigate();
  const [outletData, setOutletData] = useState<OutletData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const dataStr = sessionStorage.getItem("outletData");
    if (dataStr) {
      let parsed = JSON.parse(dataStr);
      if (
        !parsed.journalists ||
        !Array.isArray(parsed.journalists) ||
        parsed.journalists.length === 0
      ) {
console.error("No journalists found");
toast.error("No journalists found. Please try a different outlet.");
navigate("/");
return;
      }
      setOutletData(parsed);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // ============= CLEAR CACHE FUNCTION =============
  const handleClearCache = async () => {
    if (!window.confirm('⚠️ Clear all cached data?\n\nThis will delete all saved journalist information from the database and cannot be undone.\n\nAre you sure?')) {
      return;
    }

    setIsClearing(true);
    
    try {
      const response = await fetch('/api/database/clear', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Cache Cleared Successfully!\n\n` +
          `Deleted:\n` +
          `• ${data.deleted.journalists} journalists\n` +
          `• ${data.deleted.topics} topics\n` +
          `• ${data.deleted.keywords} keywords`,
          {
            duration: 5000,
          }
        );
        
        // Clear session storage as well
        sessionStorage.removeItem('outletData');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(`Failed to clear cache: ${data.error}`);
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      toast.error(`Failed to clear cache: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };
  // ===============================================

  if (!outletData) return null;

  if (!outletData.journalists || outletData.journalists.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-muted-foreground">
        No journalist profiles found for this outlet.
      </div>
    );
  }

  const journalists = outletData.journalists ?? [];
  const totalArticles = outletData.totalArticles ?? journalists.reduce((a, j) => a + (j.articleCount || 0), 0);
  const topSection = outletData.topSection ?? { name: "Unknown", percentage: "0" };
  const mostActive = outletData.mostActive ?? { name: "Unknown", count: "0" };
  const outletName = outletData.outlet ?? "Unknown";
  const detectedWebsite = outletData.detectedWebsite ?? "Unknown";

  const handleExportCSV = () => {
    const csvContent = [
      ["Name", "Section", "Article Count", "Latest Article", "Date", "Topics", "Contact"].join(","),
      ...journalists.map(j => [
        j.name,
        j.section,
        j.articleCount,
        `"${j.latestArticle}"`,
        j.date,
        `"${j.topics.join(", ")}"`,
        j.contact || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newstrace_${outletName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully!");
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(outletData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newstrace_${outletName}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("JSON exported successfully!");
  };

  const handleNewSearch = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-glow to-secondary bg-clip-text text-transparent">
              NewsTrace
            </a>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Analyze new outlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      navigate("/processing", { state: { outlet: searchQuery } });
                    }
                  }}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
            
            {/* ============= UPDATED BUTTONS WITH CLEAR CACHE ============= */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCache}
                disabled={isClearing}
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 transition-all"
                title="Clear all cached journalist data from database"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearing ? "Clearing..." : "Clear Cache"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
            {/* ========================================================== */}
          </div>
        </div>
      </header>

      {/* Website Banner */}
      {showBanner && (
        <div className="bg-primary/10 border-b border-primary/30 animate-slide-up">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-card-foreground">
                  <strong>Analyzing:</strong> {outletName}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-card-foreground">
                  <strong>Website:</strong> {detectedWebsite}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-green-500 flex items-center gap-1">
                  <strong>Status:</strong> Complete ✓
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <StatsCard
            title="Total Journalists Extracted"
            value={journalists.length}
            icon={Users}
          />
          <StatsCard
            title="Total Articles Analyzed"
            value={totalArticles}
            icon={FileText}
          />
          <StatsCard
            title="Top Section/Beat"
            value={topSection.name}
            icon={TrendingUp}
            subtitle={`${topSection.percentage}% of coverage`}
          />
          <StatsCard
            title="Most Active Journalist"
            value={mostActive.name}
            icon={Award}
            subtitle={`${mostActive.count} articles`}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Journalist Feed */}
          <div className="lg:col-span-4 animate-slide-up">
            <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Journalist Profiles Feed</h2>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {journalists.slice(0, 12).map((journalist) => (
                  <JournalistCard key={journalist.id} journalist={journalist} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Tabs defaultValue="network" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-card border border-border">
                <TabsTrigger value="network">Network Graph</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="data">Data Table</TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="network" className="m-0">
                  <NetworkGraph journalists={journalists} />
                </TabsContent>
                <TabsContent value="analytics" className="m-0">
                  <AnalyticsTab journalists={journalists} />
                </TabsContent>
                <TabsContent value="data" className="m-0">
                  <DataTable journalists={journalists} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;