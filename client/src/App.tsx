import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import RabbitHole from "@/pages/RabbitHole";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import Connections from "@/pages/Connections";
import DepthReader from "@/pages/DepthReader";
import Admin from "@/pages/Admin";
import QA from "@/pages/QA";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/rabbithole/:slug/read" component={DepthReader} />
      <Route path="/rabbithole/:slug" component={RabbitHole} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/connections" component={Connections} />
      <Route path="/admin" component={Admin} />
      <Route path="/qa" component={QA} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground texture-overlay">
          <Navbar />
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
