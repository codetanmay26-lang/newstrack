import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, Users, Network, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-network.jpg";

const Landing = () => {
  const [outletName, setOutletName] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (outletName.trim()) {
      navigate("/processing", { state: { outlet: outletName } });
    }
  };

  const features = [
    {
      icon: Globe,
      title: "Automated Website Detection",
      description: "Instantly discovers official media outlet websites",
    },
    {
      icon: Users,
      title: "30+ Journalist Profiles",
      description: "Comprehensive ecosystem mapping with detailed profiles",
    },
    {
      icon: Network,
      title: "Network Analysis",
      description: "Visual bipartite graphs connecting journalists to topics",
    },
    {
      icon: TrendingUp,
      title: "Intelligence Insights",
      description: "Deep analytics on coverage patterns and trends",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 33, 84, 0.85), rgba(15, 33, 84, 0.85)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-glow to-secondary bg-clip-text text-transparent">
              NewsTrace
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-foreground">
              Media Intelligence System
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12">
              Autonomously Map Journalist Ecosystems from Any News Outlet
            </p>

            <div className="max-w-2xl mx-auto animate-slide-up">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Enter media outlet name (e.g., The Hindu)"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                  className="h-14 text-lg bg-card/50 backdrop-blur-sm border-primary/30 focus:border-secondary"
                />
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Analyze
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="gradient-card p-8 rounded-xl shadow-elevated hover:shadow-glow transition-all duration-300 animate-scale-in border border-border/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="/about" className="hover:text-secondary transition-colors">
              About
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
