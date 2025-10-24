import { useState, useMemo } from "react";
import { ArrowUpDown, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Journalist, getTopicColor } from "@/lib/mockData";

interface DataTableProps {
  journalists: Journalist[];
}

type SortField = "name" | "section" | "articleCount" | "date";
type SortDirection = "asc" | "desc";

const DataTable = ({ journalists }: DataTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("articleCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const sections = Array.from(new Set(journalists.map(j => j.section)));

  const filteredAndSorted = useMemo(() => {
    let filtered = journalists.filter(j => {
      const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.latestArticle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection = sectionFilter === "all" || j.section === sectionFilter;
      return matchesSearch && matchesSection;
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === "name" || sortField === "section") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [journalists, searchQuery, sectionFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(section => (
              <SelectItem key={section} value={section}>{section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground flex items-center">
          Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} profiles
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-2 hover:text-secondary transition-colors"
                >
                  Journalist Name
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort("section")}
                  className="flex items-center gap-2 hover:text-secondary transition-colors"
                >
                  Section/Beat
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort("articleCount")}
                  className="flex items-center gap-2 hover:text-secondary transition-colors"
                >
                  Articles
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-4">Latest Article</th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-2 hover:text-secondary transition-colors"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-4">Contact</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((journalist) => (
              <tr key={journalist.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-medium">{journalist.name}</td>
                <td className="py-3 px-4">
                  <Badge className={`${getTopicColor(journalist.section)} text-white`}>
                    {journalist.section}
                  </Badge>
                </td>
                <td className="py-3 px-4">{journalist.articleCount}</td>
                <td className="py-3 px-4 max-w-xs truncate">{journalist.latestArticle}</td>
                <td className="py-3 px-4 text-muted-foreground">{journalist.date}</td>
                <td className="py-3 px-4">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(v) => setRowsPerPage(parseInt(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
