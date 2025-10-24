import { User, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Journalist, getTopicColor } from "@/lib/mockData";

interface JournalistCardProps {
  journalist: Journalist;
  onViewProfile?: (journalist: Journalist) => void;
}

const JournalistCard = ({ journalist, onViewProfile }: JournalistCardProps) => {
  return (
    <div className="gradient-card p-4 rounded-lg border border-border hover:border-secondary/50 transition-all duration-300 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">{journalist.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${getTopicColor(journalist.section)} text-white text-xs`}>
              {journalist.section}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{journalist.articleCount}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {journalist.latestArticle}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onViewProfile?.(journalist)}
            >
              View Profile
            </Button>
            {journalist.contact && (
              <a
                href={`https://${journalist.contact}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-secondary/80"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalistCard;
