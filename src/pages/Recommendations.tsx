import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, Sparkles, TrendingUp, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PromoteRecommendationDialog from "@/components/PromoteRecommendationDialog";
import { motion } from "framer-motion";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Tool {
  name: string;
  description: string;
  category: string;
  url?: string;
  affiliateUrl?: string;
  tags: string[];
  recommended?: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

const toolsByLetter: Record<string, Tool[]> = {
  A: [
    {
      name: "AI Tools",
      description: "Artificial Intelligence platforms for content generation, automation, and intelligent features.",
      category: "Technology",
      tags: ["AI", "Automation", "Machine Learning"],
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop",
      imageAlt: "#AI #ArtificialIntelligence #MachineLearning #Automation #Voice2Fire #AITools #TechInnovation",
    },
    {
      name: "Analytics",
      description: "Track your app performance, user behavior, and gain insights to improve your platform.",
      category: "Business",
      tags: ["Analytics", "Metrics", "Insights"],
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop",
      imageAlt: "#Analytics #DataAnalytics #Metrics #BusinessIntelligence #Voice2Fire #DataScience #Insights",
    },
    {
      name: "API Development",
      description: "RESTful and GraphQL API development tools for building scalable backend services.",
      category: "Development",
      tags: ["API", "REST", "GraphQL"],
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop",
      imageAlt: "#API #RESTful #GraphQL #BackendDevelopment #Voice2Fire #WebServices #APIDesign",
    },
  ],
  B: [
    {
      name: "Blockchain Technology",
      description: "Decentralized platforms and tools for building blockchain-based applications.",
      category: "Technology",
      tags: ["Blockchain", "Crypto", "Web3"],
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop",
      imageAlt: "#Blockchain #Crypto #Web3 #Decentralized #Voice2Fire #SmartContracts #DeFi",
    },
    {
      name: "Business Intelligence",
      description: "Data visualization and reporting tools for making informed business decisions.",
      category: "Business",
      tags: ["BI", "Reports", "Dashboards"],
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop",
      imageAlt: "#BusinessIntelligence #DataVisualization #Dashboards #Reports #Voice2Fire #Analytics #DataInsights",
    },
  ],
  C: [
    {
      name: "Cloud Services",
      description: "Backend infrastructure and cloud computing platforms for scalable applications.",
      category: "Infrastructure",
      tags: ["Cloud", "Backend", "Hosting"],
      imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&h=100&fit=crop",
      imageAlt: "#Cloud #CloudComputing #Backend #Infrastructure #Voice2Fire #Hosting #Scalability",
    },
    {
      name: "CRM Systems",
      description: "Customer relationship management platforms for managing sales and customer data.",
      category: "Business",
      tags: ["CRM", "Sales", "Customer Management"],
      imageUrl: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=100&h=100&fit=crop",
      imageAlt: "#CRM #CustomerRelationshipManagement #Sales #CustomerData #Voice2Fire #BusinessTools #SalesManagement",
    },
  ],
  D: [
    {
      name: "Database Management",
      description: "Tools for managing, querying, and optimizing your application databases.",
      category: "Development",
      tags: ["Database", "SQL", "Storage"],
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop",
      imageAlt: "#Database #SQL #DataManagement #Storage #Voice2Fire #DatabaseAdmin #DataStorage",
    },
    {
      name: "DevOps Tools",
      description: "CI/CD pipelines, deployment automation, and infrastructure as code platforms.",
      category: "Infrastructure",
      tags: ["DevOps", "CI/CD", "Automation"],
      imageUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=100&h=100&fit=crop",
      imageAlt: "#DevOps #CICD #Automation #Deployment #Voice2Fire #Infrastructure #ContinuousIntegration",
    },
  ],
  E: [
    {
      name: "E-commerce Platforms",
      description: "Complete online store solutions with shopping carts, payments, and inventory management.",
      category: "Business",
      tags: ["E-commerce", "Shopping", "Retail"],
      imageUrl: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=100&h=100&fit=crop",
      imageAlt: "#Ecommerce #OnlineShopping #Retail #ShoppingCart #Voice2Fire #OnlineStore #DigitalCommerce",
    },
    {
      name: "Email Marketing",
      description: "Email campaign management, automation, and analytics for digital marketing.",
      category: "Marketing",
      tags: ["Email", "Marketing", "Campaigns"],
      imageUrl: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=100&h=100&fit=crop",
      imageAlt: "#EmailMarketing #Campaigns #DigitalMarketing #Automation #Voice2Fire #EmailAutomation #MarketingTools",
    },
  ],
  F: [
    {
      name: "Frontend Frameworks",
      description: "Modern JavaScript frameworks for building interactive user interfaces.",
      category: "Development",
      tags: ["Frontend", "JavaScript", "React"],
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop",
      imageAlt: "#Frontend #JavaScript #React #WebDevelopment #Voice2Fire #UI #UserInterface",
    },
    {
      name: "File Management",
      description: "Document storage, versioning, and collaboration platforms for teams.",
      category: "Productivity",
      tags: ["Files", "Documents", "Collaboration"],
      imageUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?w=100&h=100&fit=crop",
      imageAlt: "#FileManagement #DocumentStorage #Collaboration #Cloud #Voice2Fire #FileSharing #TeamWork",
    },
  ],
  G: [
    {
      name: "Graphics Design",
      description: "Professional design tools for creating logos, graphics, and visual content.",
      category: "Design",
      tags: ["Design", "Graphics", "Creative"],
      imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=100&h=100&fit=crop",
      imageAlt: "#GraphicDesign #DesignTools #Creative #VisualContent #Voice2Fire #Branding #LogoDesign",
    },
    {
      name: "Gaming Platforms",
      description: "Game development engines and platforms for creating interactive experiences.",
      category: "Entertainment",
      tags: ["Gaming", "Game Dev", "Interactive"],
      imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop",
      imageAlt: "#Gaming #GameDevelopment #Interactive #Entertainment #Voice2Fire #GameEngine #VideoGames",
    },
  ],
  H: [
    {
      name: "Hosting Services",
      description: "Web hosting and server management solutions for deploying applications.",
      category: "Infrastructure",
      tags: ["Hosting", "Servers", "Deployment"],
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop",
      imageAlt: "#WebHosting #Servers #Deployment #Infrastructure #Voice2Fire #CloudHosting #ServerManagement",
    },
    {
      name: "Healthcare Tech",
      description: "Digital health platforms, telemedicine, and patient management systems.",
      category: "Healthcare",
      tags: ["Healthcare", "Medical", "Telemedicine"],
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&h=100&fit=crop",
      imageAlt: "#Healthcare #HealthTech #Telemedicine #DigitalHealth #Voice2Fire #MedicalTech #PatientCare",
    },
  ],
  I: [
    {
      name: "IoT Platforms",
      description: "Internet of Things platforms for connecting and managing smart devices.",
      category: "Technology",
      tags: ["IoT", "Smart Devices", "Connected"],
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
      imageAlt: "#IoT #InternetOfThings #SmartDevices #Connected #Voice2Fire #SmartHome #IoTPlatform",
    },
    {
      name: "Image Processing",
      description: "AI-powered image editing, optimization, and manipulation tools.",
      category: "Media",
      tags: ["Images", "Photo Editing", "AI"],
      imageUrl: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop",
      imageAlt: "#ImageProcessing #PhotoEditing #AIImages #MediaTools #Voice2Fire #ImageOptimization #VisualContent",
    },
  ],
  J: [
    {
      name: "JavaScript Libraries",
      description: "Popular JavaScript libraries and utilities for modern web development.",
      category: "Development",
      tags: ["JavaScript", "Libraries", "Web Dev"],
      imageUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=100&h=100&fit=crop",
      imageAlt: "#JavaScript #Libraries #WebDev #Coding #Voice2Fire #FrontendDev #JSLibraries",
    },
  ],
  K: [
    {
      name: "Knowledge Management",
      description: "Documentation, wiki, and knowledge base platforms for organizing information.",
      category: "Productivity",
      tags: ["Knowledge", "Documentation", "Wiki"],
      imageUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=100&h=100&fit=crop",
      imageAlt: "#KnowledgeManagement #Documentation #Wiki #Information #Voice2Fire #KnowledgeBase #TeamDocs",
    },
  ],
  L: [
    {
      name: "Lovable",
      description: "The AI-powered full-stack development platform that lets you build production-ready web applications through conversation. Create beautiful UIs, manage databases, add authentication, and deploy—all without writing code manually.",
      category: "Development Platform",
      url: "https://lovable.dev",
      affiliateUrl: "https://lovable.dev/?via=gary-findlay",
      tags: ["AI", "No-Code", "Full-Stack", "Development"],
      recommended: true,
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop",
      imageAlt: "#Lovable #AI #NoCode #FullStack #WebDevelopment #DevTools #BuildFaster #Voice2Fire",
    },
    {
      name: "Learning Platforms",
      description: "Online education and e-learning platforms for courses and training.",
      category: "Education",
      tags: ["Learning", "Education", "E-learning"],
      imageUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=100&h=100&fit=crop",
      imageAlt: "#Learning #Education #Elearning #OnlineCourses #Voice2Fire #Training #EdTech",
    },
  ],
  M: [
    {
      name: "Marketing Automation",
      description: "Automated marketing campaigns, lead generation, and customer engagement tools.",
      category: "Marketing",
      tags: ["Marketing", "Automation", "Campaigns"],
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop",
      imageAlt: "#MarketingAutomation #DigitalMarketing #Campaigns #LeadGeneration #Voice2Fire #MarketingTools #Automation",
    },
    {
      name: "Mobile Development",
      description: "Cross-platform mobile app development frameworks and tools.",
      category: "Development",
      tags: ["Mobile", "iOS", "Android"],
      imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop",
      imageAlt: "#MobileDevelopment #iOS #Android #AppDevelopment #Voice2Fire #CrossPlatform #MobileApps",
    },
  ],
  N: [
    {
      name: "Notification Systems",
      description: "Multi-channel notification delivery systems for email, SMS, and in-app alerts.",
      category: "Communication",
      tags: ["Notifications", "Email", "SMS"],
      imageUrl: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=100&h=100&fit=crop",
      imageAlt: "#Notifications #Email #SMS #Communication #Voice2Fire #Alerts #Messaging",
    },
  ],
  O: [
    {
      name: "Observability Tools",
      description: "Monitoring, logging, and performance tracking for production applications.",
      category: "Infrastructure",
      tags: ["Monitoring", "Logging", "Performance"],
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop",
      imageAlt: "#Observability #Monitoring #Logging #Performance #Voice2Fire #APM #SystemMonitoring",
    },
  ],
  P: [
    {
      name: "Payment Processing",
      description: "Secure payment gateways and transaction processing for e-commerce applications.",
      category: "Finance",
      tags: ["Payments", "Stripe", "E-commerce"],
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop",
      imageAlt: "#Payments #Stripe #PaymentProcessing #Ecommerce #Voice2Fire #FinTech #Transactions",
    },
    {
      name: "Project Management",
      description: "Task tracking, team collaboration, and project planning software.",
      category: "Productivity",
      tags: ["Project Management", "Tasks", "Collaboration"],
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop",
      imageAlt: "#ProjectManagement #TaskTracking #Collaboration #Productivity #Voice2Fire #TeamWork #ProjectPlanning",
    },
  ],
  Q: [
    {
      name: "Quality Assurance",
      description: "Automated testing, QA tools, and bug tracking platforms for software quality.",
      category: "Development",
      tags: ["QA", "Testing", "Bug Tracking"],
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop",
      imageAlt: "#QualityAssurance #Testing #BugTracking #SoftwareQuality #Voice2Fire #AutomatedTesting #QA",
    },
  ],
  R: [
    {
      name: "Real-time Features",
      description: "Enable live updates, chat, and collaborative features in your applications.",
      category: "Technology",
      tags: ["Real-time", "WebSockets", "Live Updates"],
      imageUrl: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=100&h=100&fit=crop",
      imageAlt: "#Realtime #WebSockets #LiveUpdates #Collaboration #Voice2Fire #InstantMessaging #Chat",
    },
  ],
  S: [
    {
      name: "Storage Solutions",
      description: "File storage and content delivery networks for media-rich applications.",
      category: "Infrastructure",
      tags: ["Storage", "CDN", "Media"],
      imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop",
      imageAlt: "#Storage #CDN #MediaStorage #FileStorage #Voice2Fire #ContentDelivery #CloudStorage",
    },
    {
      name: "Security Tools",
      description: "Cybersecurity platforms for protecting applications and user data.",
      category: "Security",
      tags: ["Security", "Cybersecurity", "Protection"],
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&h=100&fit=crop",
      imageAlt: "#Security #Cybersecurity #DataProtection #InfoSec #Voice2Fire #SecurityTools #ThreatProtection",
    },
  ],
  T: [
    {
      name: "Testing Frameworks",
      description: "Unit testing, integration testing, and end-to-end testing tools.",
      category: "Development",
      tags: ["Testing", "QA", "Automation"],
      imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=100&h=100&fit=crop",
      imageAlt: "#Testing #TestingFrameworks #QA #Automation #Voice2Fire #UnitTesting #E2ETesting",
    },
  ],
  U: [
    {
      name: "UI/UX Design",
      description: "Design systems, prototyping, and user experience tools for creating intuitive interfaces.",
      category: "Design",
      tags: ["UI", "UX", "Design"],
      imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop",
      imageAlt: "#UIDesign #UXDesign #UserExperience #DesignSystems #Voice2Fire #InterfaceDesign #Prototyping",
    },
  ],
  V: [
    {
      name: "Video Platforms",
      description: "Video hosting, streaming, and processing services for content creators.",
      category: "Media",
      tags: ["Video", "Streaming", "Content"],
      imageUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=100&h=100&fit=crop",
      imageAlt: "#Video #Streaming #VideoHosting #ContentCreators #Voice2Fire #LiveStreaming #VideoProduction",
    },
  ],
  W: [
    {
      name: "Web Development",
      description: "Modern frameworks and tools for building responsive, fast web applications.",
      category: "Development",
      tags: ["Web", "React", "Frontend"],
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop",
      imageAlt: "#WebDevelopment #React #Frontend #WebDesign #Voice2Fire #Coding #WebApps",
    },
  ],
  X: [
    {
      name: "XML & Data Exchange",
      description: "Data interchange formats, APIs, and integration tools for system communication.",
      category: "Development",
      tags: ["XML", "API", "Integration"],
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop",
      imageAlt: "#XML #DataExchange #API #Integration #Voice2Fire #DataFormats #SystemIntegration",
    },
  ],
  Y: [
    {
      name: "YouTube Integration",
      description: "Tools and APIs for integrating YouTube content, analytics, and live streaming.",
      category: "Media",
      tags: ["YouTube", "Video", "Content"],
      imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
      imageAlt: "#YouTube #VideoContent #Streaming #ContentCreation #Voice2Fire #VideoMarketing #YouTubeAPI",
    },
  ],
  Z: [
    {
      name: "Zero-Trust Security",
      description: "Modern security architecture for protecting distributed applications and remote teams.",
      category: "Security",
      tags: ["Security", "Zero-Trust", "Network"],
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&h=100&fit=crop",
      imageAlt: "#ZeroTrust #Security #NetworkSecurity #Cybersecurity #Voice2Fire #SecureAccess #ModernSecurity",
    },
  ],
};

export default function Recommendations() {
  const [activeLetter, setActiveLetter] = useState("L");
  const [promoteDialog, setPromoteDialog] = useState<{ open: boolean; toolName: string; toolCategory: string }>({
    open: false,
    toolName: "",
    toolCategory: "",
  });

  const hasContent = (letter: string) => {
    return toolsByLetter[letter] && toolsByLetter[letter].length > 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Recommendations A-Z</h1>
        <p className="text-muted-foreground">
          Discover tools, platforms, and services organized alphabetically to help you build amazing applications.
        </p>
      </div>

      <Tabs value={activeLetter} onValueChange={setActiveLetter} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto p-1 gap-1">
          {ALPHABET.map((letter) => (
            <TabsTrigger
              key={letter}
              value={letter}
              disabled={!hasContent(letter)}
              className="flex-1 min-w-[40px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {letter}
            </TabsTrigger>
          ))}
        </TabsList>

        {ALPHABET.map((letter) => (
          <TabsContent key={letter} value={letter} className="mt-6">
            {hasContent(letter) ? (
              <div className="grid gap-6 md:grid-cols-2">
                {toolsByLetter[letter].map((tool, index) => (
                  <Card key={index} className={tool.recommended ? "border-primary shadow-lg" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        {tool.imageUrl ? (
                          <img 
                            src={tool.imageUrl} 
                            alt={tool.imageAlt || `${tool.name} #Voice2Fire #${tool.tags.map(t => t.replace(/\s+/g, '')).join(' #')}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-primary/10"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const iconContainer = e.currentTarget.nextElementSibling as HTMLElement;
                              if (iconContainer) iconContainer.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 hidden">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            {tool.name}
                            {tool.recommended && (
                              <Heart className="w-5 h-5 fill-primary text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">{tool.category}</CardDescription>
                        </div>
                        {(tool.affiliateUrl || tool.url) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="flex-shrink-0"
                          >
                            <a href={tool.affiliateUrl || tool.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tool.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {tool.recommended && (
                        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium text-primary">
                            ⭐ Highly Recommended by Voice2Fire
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setPromoteDialog({
                            open: true,
                            toolName: tool.name,
                            toolCategory: tool.category,
                          })
                        }
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Promote This
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No recommendations available for letter "{letter}" yet.</p>
                <p className="text-sm mt-2">Check back soon for more tools and resources!</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-bold mb-4">About Lovable</h2>
        <p className="text-muted-foreground mb-4">
          Lovable is an AI-powered development platform that revolutionizes how applications are built. 
          With Lovable, you can create full-stack web applications through natural conversation, 
          eliminating the need for manual coding while maintaining professional quality and best practices.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">🚀 Fast Development</h3>
            <p className="text-sm text-muted-foreground">Build production-ready apps in minutes, not months.</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">🎨 Beautiful Design</h3>
            <p className="text-sm text-muted-foreground">Automatic responsive design with modern UI components.</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">☁️ Full-Stack Power</h3>
            <p className="text-sm text-muted-foreground">Database, auth, storage, and serverless functions included.</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">
            Note: Lovable does not currently have an official affiliate program. However, we highly recommend 
            it based on our experience building Voice2Fire with this amazing platform.
          </p>
        </div>
      </div>

      <PromoteRecommendationDialog
        open={promoteDialog.open}
        onOpenChange={(open) => setPromoteDialog({ ...promoteDialog, open })}
        toolName={promoteDialog.toolName}
        toolCategory={promoteDialog.toolCategory}
      />
    </div>
  );
}
