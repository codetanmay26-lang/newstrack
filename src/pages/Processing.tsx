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
  const [showHomeButton, setShowHomeButton] = useState(false);
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

        if (!website) {
          setStatusMessages((prev) => [
            ...prev,
            "❌ No official website detected for this outlet.",
            "Process stopped — please verify the outlet name.",
          ]);
          setStages((prev) =>
            prev.map((s) =>
              s.id === 0 ? { ...s, status: "complete" } : s
            )
          );
          setShowHomeButton(true);
          return;
        }

        setDetectedWebsite(website);
        setStatusMessages((prev) => [
          ...prev,
          `🌐 Detected website: ${website}`,
          "Proceeding to journalist extraction...",
        ]);
        setStages((prev) =>
          prev.map((s) =>
            s.id === 0 ? { ...s, status: "complete" } : s
          )
        );

        // Stage 1: Journalist Extraction
        setStages((prev) =>
          prev.map((s) =>
            s.id === 1 ? { ...s, status: "processing" } : s
          )
        );
        setStatusMessages((prev) => [
          ...prev,
          "Extracting journalist details from the website...",
        ]);

        // ✅ FIX: extractJournalists returns an object, not array
        let extractedData: any;

        try {
          extractedData = await extractJournalists(website);

          // ✅ Extract the journalists array from the response object
          const journalists = extractedData.journalists || [];

          if (!journalists || journalists.length === 0) {
            setStatusMessages((prev) => [
              ...prev,
              "❌ No journalist profiles found.",
              "Stopping process — no valid data detected.",
            ]);
            setStages((prev) =>
              prev.map((s) =>
                s.id === 1 ? { ...s, status: "complete" } : s
              )
            );
            setShowHomeButton(true);
            return;
          }

          // Stage 2: Analysis
          setStatusMessages((prev) => [
            ...prev,
            `✓ Extracted ${journalists.length} journalist profiles.`,
            "Starting intelligence analysis...",
          ]);
          setStages((prev) =>
            prev.map((s) =>
              s.id === 2 ? { ...s, status: "processing" } : s
            )
          );

          const analyzed = analyzeJournalists(journalists);

          setStatusMessages((prev) => [...prev, "✓ Analysis complete."]);
          setStages((prev) =>
            prev.map((s) =>
              s.id === 2 ? { ...s, status: "complete" } : s
            )
          );

          // Stage 3: Network Graph
          setStatusMessages((prev) => [...prev, "Building network graph..."]);
          setStages((prev) =>
            prev.map((s) =>
              s.id === 3 ? { ...s, status: "processing" } : s
            )
          );
          setTimeout(() => {
            setStages((prev) =>
              prev.map((s) =>
                s.id === 3 ? { ...s, status: "complete" } : s
              )
            );
            setStatusMessages((prev) => [
              ...prev,
              "✓ Network graph built successfully.",
            ]);
          }, 1000);

          // Stage 4: Visualization
          setStages((prev) =>
            prev.map((s) =>
              s.id === 4 ? { ...s, status: "processing" } : s
            )
          );
          setStatusMessages((prev) => [
            ...prev,
            "Preparing visualization...",
          ]);

          // ✅ Save complete data with analytics
          sessionStorage.setItem(
            "outletData",
            JSON.stringify({
              outlet,
              detectedWebsite: extractedData.detectedWebsite || website,
              journalists: analyzed.journalists,
              totalArticles: extractedData.totalArticles || analyzed.journalists.reduce((a, j) => a + (j.articleCount || 0), 0),
              topSection: extractedData.topSection || { name: "N/A", percentage: 0 },
              mostActive: extractedData.mostActive || { name: "N/A", count: 0 },
            })
          );

          setTimeout(() => {
            setStages((prev) =>
              prev.map((s) =>
                s.id === 4 ? { ...s, status: "complete" } : s
              )
            );
            setStatusMessages((prev) => [
              ...prev,
              "✓ Visualization ready! Redirecting to dashboard...",
            ]);
            navigate("/dashboard");
          }, 1500);

        } catch (err) {
          setStatusMessages((prev) => [
            ...prev,
            "❌ Live extraction failed.",
            (err as Error).message || "Unknown error occurred.",
          ]);
          setStages((prev) =>
            prev.map((s) =>
              s.id === 1 ? { ...s, status: "complete" } : s
            )
          );
          setShowHomeButton(true);
          return;
        }

      } catch (error) {
        setStatusMessages((prev) => [
          ...prev,
          "❌ Critical error occurred.",
          (error as Error).message,
        ]);
        setShowHomeButton(true);
      }
    };

    runProcessing();
  }, [outlet, navigate]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col justify-between">
      <div className="container max-w-5xl mx-auto flex-grow">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Analyzing {outlet}</h1>
          <p className="text-muted-foreground">Processing in real-time...</p>
        </div>

        {detectedWebsite && (
          <div className="mb-12 animate-slide-up">
            <div className="gradient-card p-8 rounded-xl shadow-elevated border border-secondary/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">
                    🌐 Detected Official Website
                  </h2>
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary mb-2">
                {detectedWebsite}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Verified ✓</span>
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
                      <h3
                        className={`font-medium ${
                          stage.status === "complete"
                            ? "text-green-500"
                            : stage.status === "processing"
                            ? "text-secondary"
                            : "text-muted-foreground"
                        }`}
                      >
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
                {statusMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="text-sm text-muted-foreground animate-fade-in py-1 border-l-2 border-secondary/30 pl-3"
                  >
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Bottom Button */}
      {showHomeButton && (
        <div className="flex justify-center pb-10 mt-12">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-lg bg-secondary text-white font-medium hover:bg-secondary/80 transition-all shadow-lg"
          >
            ⬅ Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default Processing;