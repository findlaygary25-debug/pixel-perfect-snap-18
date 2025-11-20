import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap, CalendarIcon, ArrowLeft, DollarSign, Target, BarChart3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const PROMOTION_TIERS = [
  {
    id: 1,
    name: "Starter Boost",
    price: 5,
    reach: "1,000",
    icon: Users,
    description: "Perfect for getting started",
  },
  {
    id: 2,
    name: "Growth Pack",
    price: 15,
    reach: "5,000",
    icon: TrendingUp,
    description: "Expand your audience",
    popular: true,
  },
  {
    id: 3,
    name: "Viral Push",
    price: 30,
    reach: "15,000",
    icon: Zap,
    description: "Maximum visibility",
  },
  {
    id: 4,
    name: "Premium Reach",
    price: 50,
    reach: "30,000",
    icon: TrendingUp,
    description: "Go viral fast",
  },
  {
    id: 5,
    name: "Ultimate Boost",
    price: 100,
    reach: "75,000",
    icon: Zap,
    description: "Explosive growth",
  },
];

const Advertise = () => {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const tier = PROMOTION_TIERS.find((t) => t.id === selectedTier);

  const handleGetStarted = () => {
    if (!selectedTier) {
      toast({
        title: "Select a package",
        description: "Please select an advertising package to continue",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Coming Soon",
      description: "Advertising checkout will be available soon. Stay tuned!",
    });
  };

  return (
    <div className="container max-w-7xl py-8 px-4">
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://voice2fire.com/" },
          { name: "Advertise", url: "https://voice2fire.com/advertise" }
        ]}
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Advertise on Voice2Fire
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Reach thousands of engaged users and grow your brand with our powerful promotion packages
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Target className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>Targeted Reach</CardTitle>
            <CardDescription>
              Get your content in front of the right audience
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <BarChart3 className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>Real-Time Analytics</CardTitle>
            <CardDescription>
              Track your campaign performance in real-time
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <DollarSign className="h-10 w-10 mb-2 text-primary" />
            <CardTitle>Flexible Pricing</CardTitle>
            <CardDescription>
              Choose the package that fits your budget
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Package</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PROMOTION_TIERS.map((promotionTier) => {
            const Icon = promotionTier.icon;
            const isSelected = selectedTier === promotionTier.id;

            return (
              <Card
                key={promotionTier.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg relative",
                  isSelected && "ring-2 ring-primary shadow-lg",
                  promotionTier.popular && "border-primary"
                )}
                onClick={() => setSelectedTier(promotionTier.id)}
              >
                {promotionTier.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">{promotionTier.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {promotionTier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold">${promotionTier.price}</div>
                  <p className="text-sm text-muted-foreground">
                    Reach up to <strong>{promotionTier.reach}</strong> people
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedTier && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Campaign Details (Optional)</CardTitle>
            <CardDescription>
              Set a custom schedule for your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {tier && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Campaign Summary</h3>
                <div className="text-sm space-y-1">
                  <p>Package: <strong>{tier.name}</strong></p>
                  <p>Investment: <strong>${tier.price}</strong></p>
                  <p>Estimated Reach: <strong>{tier.reach} people</strong></p>
                  {startDate && <p>Start: <strong>{format(startDate, "PPP")}</strong></p>}
                  {endDate && <p>End: <strong>{format(endDate, "PPP")}</strong></p>}
                </div>
              </div>
            )}

            <Button onClick={handleGetStarted} className="w-full" size="lg">
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Advertise;
