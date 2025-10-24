import { ArrowRight } from "lucide-react";

const About = () => {
  const features = [
    "Automated website discovery",
    "Real-time journalist extraction",
    "Activity timeline analysis",
    "Keyword extraction from titles",
    "Interactive bipartite network graphs",
    "Visual clustering of journalist groups",
    "Cross-outlet comparison (optional)",
    "Multiple export formats (CSV, JSON)",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-secondary bg-clip-text text-transparent">
            About NewsTrace
          </h1>
          <p className="text-xl text-muted-foreground">
            Media Intelligence & Journalist Profiling System
          </p>
        </div>

        {/* Overview */}
        <div className="mb-12 animate-slide-up">
          <div className="gradient-card p-8 rounded-xl border border-border shadow-elevated">
            <p className="text-lg leading-relaxed text-muted-foreground">
              NewsTrace is a media intelligence system that autonomously maps journalist ecosystems by analyzing publicly available data from news outlets. Enter any outlet name to automatically detect its website, extract 30+ journalist profiles, and visualize their coverage patterns through interactive network graphs and analytics dashboards.
            </p>
          </div>
        </div>

        {/* Process Flow */}
        <div className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Process Flow</h2>
          <div className="gradient-card p-8 rounded-xl border border-border shadow-elevated">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-foreground">0</span>
                </div>
                <span className="text-sm text-center">Website<br />Detection</span>
              </div>
              
              <ArrowRight className="text-secondary hidden md:block" />
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <span className="text-sm text-center">Profile<br />Extraction</span>
              </div>
              
              <ArrowRight className="text-secondary hidden md:block" />
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-foreground">2</span>
                </div>
                <span className="text-sm text-center">Intelligence<br />Analysis</span>
              </div>
              
              <ArrowRight className="text-secondary hidden md:block" />
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-foreground">3</span>
                </div>
                <span className="text-sm text-center">Network<br />Mapping</span>
              </div>
              
              <ArrowRight className="text-secondary hidden md:block" />
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-foreground">4</span>
                </div>
                <span className="text-sm text-center">Dashboard<br />Output</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="gradient-card p-4 rounded-lg border border-border shadow-sm hover:shadow-glow transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></div>
                  <span className="text-card-foreground">{feature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-colors"
          >
            Start Analyzing
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <a href="/" className="hover:text-secondary transition-colors">
              Home
            </a>
            <span>•</span>
            <a href="/documentation" className="hover:text-secondary transition-colors">
              Documentation
            </a>
            <span>•</span>
            <a href="/dashboard" className="hover:text-secondary transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
