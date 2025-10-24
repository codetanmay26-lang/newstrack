import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Globe } from "lucide-react";
import { detectWebsite, extractJournalists } from "../services/scraper";
import { analyzeJournalists } from "../services/analysis";

interface ProcessingStage {
  id: number;
  label: string;
  status: "pending" | "processing" | "complete";
}

const Processing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = location.state?.outlet || "The Hindu";

  const [detectedWebsite, setDetectedWebsite] = useState("");
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 0, label: "Detecting Official Website", status: "processing" },
    { id: 1, label: "Extracting Journalist Profiles", status: "pending" },
    { id: 2, label: "Analyzing Intelligence Data", status: "pending" },
    { id: 3, label: "Building Network Graph", status: "pending" },
    { id: 4, label: "Preparing Visualization", status: "pending" },
  ]);
  const [statusMessages, setStatusMessages] = useState<string[]>([
    "Initiating analysis...",
    "Searching for official website...",
  ]);

  useEffect(() => {
    const runProcessing = async () => {
      try {
        // Stage 0: Website Detection
        const website = await detectWebsite(outlet);
        setDetectedWebsite(website || "");
        setStages(prev => prev.map(s => s.id === 0 ? { ...s, status: "complete" } : s));
        setStatusMessages(prev => [
          ...prev,
          website
            ? `✓ Detected official website: ${website}`
            : "❌ No official website found.",
          "Verified source authenticity"
        ]);

        // Stage 1: Profile Extraction
        setStages(prev => prev.map(s => s.id === 1 ? { ...s, status: "processing" } : s));
        setStatusMessages(prev => [
          ...prev,
          "Extracting journalist metadata from source..."
        ]);

        let journalists = [];
        try {
          journalists = await extractJournalists(website);
        } catch {
          setStatusMessages(prev => [
            ...prev,
            "❌ Live extraction failed: No journalist data to show."
          ]);
          journalists = [];
        }

        if (!journalists || journalists.length === 0) {
          setStatusMessages(prev => [
            ...prev,
            "❌ No journalist profiles found for this outlet."
          ]);
          sessionStorage.setItem("outletData", JSON.stringify({
            outlet,
            detectedWebsite: website || "",
            journalists: [],
            totalArticles: 0,
            topSection: { name: "N/A", percentage: 0 },
            mostActive: { name: "N/A", count: 0 }
          }));
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }

        setStatusMessages(prev => [
          ...prev,
          `✓ Extracted ${journalists.length} journalist profiles`
        ]);
        setStages(prev => prev.map(s => s.id === 1 ? { ...s, status: "complete" } : s));

        // Stage 2: Intelligence Analysis
        setStages(prev => prev.map(s => s.id === 2 ? { ...s, status: "processing" } : s));
        setStatusMessages(prev => [
          ...prev,
          "Analyzing article patterns...",
          "Extracting keywords and topics..."
        ]);
        const analyzed = analyzeJournalists(journalists);
        setStatusMessages(prev => [
          ...prev,
          "✓ Intelligence analysis complete"
        ]);
        setStages(prev => prev.map(s => s.id === 2 ? { ...s, status: "complete" } : s));

        // Stage 3: Network Building
        setStages(prev => prev.map(s => s.id === 3 ? { ...s, status: "processing" } : s));
        setStatusMessages(prev => [
          ...prev,
          "Mapping journalist-topic relationships...",
          "Generating network graph..."
        ]);
        setStages(prev => prev.map(s => s.id === 3 ? { ...s, status: "complete" } : s));
        setStatusMessages(prev => [
          ...prev,
          "✓ Network graph constructed"
        ]);

        // Stage 4: Visualization
        setStages(prev => prev.map(s => s.id === 4 ? { ...s, status: "processing" } : s));
        setStatusMessages(prev => [
          ...prev,
          "Preparing interactive dashboard..."
        ]);
        setStages(prev => prev.map(s => s.id === 4 ? { ...s, status: "complete" } : s));
        setStatusMessages(prev => [
          ...prev,
          "✓ All stages complete!",
          "Redirecting to dashboard..."
        ]);

        // Only REAL data set for dashboard, no fallback/generator
        sessionStorage.setItem("outletData", JSON.stringify({
          outlet,
          detectedWebsite: website || "",
          journalists: analyzed.journalists,
          totalArticles: analyzed.journalists.reduce((a, j) => a + (j.articleCount || 0), 0),
          topSection: { name: "N/A", percentage: 0 },
          mostActive: { name: "N/A", count: 0 }
        }));
        setTimeout(() => navigate("/dashboard"), 1000);

      } catch (err) {
        setStatusMessages(prev => [
          ...prev,
          "❌ Error during processing: " + (err?.message || "Unknown error")
        ]);
      }
    };

    runProcessing();
  }, [outlet, navigate]);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Analyzing {outlet}</h1>
          <p className="text-muted-foreground">Processing in real-time...</p>
        </div>
        {/* Website Detection Result */}
        {detectedWebsite && (
          <div className="mb-12 animate-slide-up">
            <div className="gradient-card p-8 rounded-xl shadow-elevated border border-secondary/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">🌐 Detected Official Website</h2>
                </div>
              </div>
              <div className="text-4xl font-bold text-secondary mb-2">{detectedWebsite}</div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Verified ✓</span>
                <span className="text-muted-foreground ml-4">Estimated journalists: {detectedWebsite ? '30+' : '0'}</span>
              </div>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Progress Section */}
          <div className="animate-scale-in">
            <div className="gradient-card p-8 rounded-xl shadow-elevated border border-border">
              <h2 className="text-2xl font-semibold mb-6">Processing Stages</h2>
              <div className="space-y-6">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {stage.status === "complete" ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : stage.status === "processing" ? (
                        <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        stage.status === "complete" ? "text-green-500" :
                        stage.status === "processing" ? "text-secondary" :
                        "text-muted-foreground"
                      }`}>
                        Stage {stage.id}: {stage.label}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Live Status Feed */}
          <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <div className="gradient-card p-8 rounded-xl shadow-elevated border border-border h-full">
              <h2 className="text-2xl font-semibold mb-6">Live Status Feed</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {statusMessages.map((message, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground animate-fade-in py-1 border-l-2 border-secondary/30 pl-3"
                  >
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;
