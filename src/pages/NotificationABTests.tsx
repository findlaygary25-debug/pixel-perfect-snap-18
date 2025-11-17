import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, TrendingUp, Eye, MousePointerClick, Target } from "lucide-react";
import { toast } from "sonner";
import { CreateABTestDialog } from "@/components/CreateABTestDialog";
import { ABTestResultsDialog } from "@/components/ABTestResultsDialog";

interface ABTest {
  id: string;
  name: string;
  description: string;
  notification_type: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function NotificationABTests() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const updateTestStatus = async (testId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('notification_ab_tests')
        .update({ status: newStatus })
        .eq('id', testId);
      
      if (error) throw error;
      
      toast.success(`Test ${newStatus === 'active' ? 'started' : 'paused'}`);
      fetchTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      toast.error('Failed to update test status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      active: { label: 'Active', className: 'bg-primary text-primary-foreground' },
      paused: { label: 'Paused', className: 'bg-secondary text-secondary-foreground' },
      completed: { label: 'Completed', className: 'bg-accent text-accent-foreground' },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filterTestsByStatus = (status: string) => {
    return tests.filter(test => test.status === status);
  };

  const renderTestCard = (test: ABTest) => (
    <Card key={test.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{test.name}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </div>
          {getStatusBadge(test.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium capitalize">{test.notification_type.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2 font-medium">{new Date(test.created_at).toLocaleDateString()}</span>
          </div>
          {test.start_date && (
            <div>
              <span className="text-muted-foreground">Start:</span>
              <span className="ml-2 font-medium">{new Date(test.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {test.end_date && (
            <div>
              <span className="text-muted-foreground">End:</span>
              <span className="ml-2 font-medium">{new Date(test.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTestId(test.id);
              setResultsDialogOpen(true);
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Results
          </Button>
          
          {test.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => updateTestStatus(test.id, 'active')}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Test
            </Button>
          )}
          
          {test.status === 'active' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateTestStatus(test.id, 'paused')}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Test
            </Button>
          )}
          
          {test.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => updateTestStatus(test.id, 'active')}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading A/B tests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification A/B Testing</h1>
          <p className="text-muted-foreground">Optimize notification engagement with A/B tests</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterTestsByStatus('active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterTestsByStatus('completed').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Tests</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterTestsByStatus('draft').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No A/B tests yet. Create your first test to get started.
              </CardContent>
            </Card>
          ) : (
            tests.map(renderTestCard)
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filterTestsByStatus('active').length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active tests at the moment.
              </CardContent>
            </Card>
          ) : (
            filterTestsByStatus('active').map(renderTestCard)
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {filterTestsByStatus('draft').length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No draft tests.
              </CardContent>
            </Card>
          ) : (
            filterTestsByStatus('draft').map(renderTestCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterTestsByStatus('completed').length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No completed tests yet.
              </CardContent>
            </Card>
          ) : (
            filterTestsByStatus('completed').map(renderTestCard)
          )}
        </TabsContent>
      </Tabs>

      <CreateABTestDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onTestCreated={fetchTests}
      />

      <ABTestResultsDialog
        open={resultsDialogOpen}
        onOpenChange={setResultsDialogOpen}
        testId={selectedTestId}
      />
    </div>
  );
}
