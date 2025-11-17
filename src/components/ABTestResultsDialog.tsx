import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Eye, MousePointerClick, Target, TrendingUp } from "lucide-react";

interface ABTestResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string | null;
}

interface TestResult {
  variant_id: string;
  variant_name: string;
  total_sent: number;
  total_viewed: number;
  total_clicked: number;
  total_converted: number;
  view_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export function ABTestResultsDialog({ open, onOpenChange, testId }: ABTestResultsDialogProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && testId) {
      fetchResults();
    }
  }, [open, testId]);

  const fetchResults = async () => {
    if (!testId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_ab_test_results', {
        test_id_param: testId
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBestPerformingVariant = () => {
    if (results.length === 0) return null;
    return results.reduce((best, current) => 
      current.conversion_rate > best.conversion_rate ? current : best
    );
  };

  const chartData = results.map(r => ({
    name: `Variant ${r.variant_name}`,
    'View Rate': r.view_rate,
    'Click Rate': r.click_rate,
    'Conversion Rate': r.conversion_rate,
  }));

  const bestVariant = getBestPerformingVariant();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>A/B Test Results</DialogTitle>
          <DialogDescription>
            View performance metrics for each variant
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data collected yet. Start the test to begin collecting metrics.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.total_sent, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.total_viewed, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.total_clicked, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.total_converted, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="View Rate" fill="hsl(var(--primary))" />
                    <Bar dataKey="Click Rate" fill="hsl(var(--secondary))" />
                    <Bar dataKey="Conversion Rate" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="font-semibold">Detailed Results by Variant</h3>
              {results.map((result) => (
                <Card key={result.variant_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Variant {result.variant_name}</CardTitle>
                      {bestVariant?.variant_id === result.variant_id && (
                        <Badge className="bg-primary">Best Performer</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Sent</div>
                        <div className="text-2xl font-bold">{result.total_sent}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Viewed</div>
                        <div className="text-2xl font-bold">{result.total_viewed}</div>
                        <div className="text-sm text-muted-foreground">{result.view_rate}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Clicked</div>
                        <div className="text-2xl font-bold">{result.total_clicked}</div>
                        <div className="text-sm text-muted-foreground">{result.click_rate}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Converted</div>
                        <div className="text-2xl font-bold">{result.total_converted}</div>
                        <div className="text-sm text-muted-foreground">{result.conversion_rate}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
