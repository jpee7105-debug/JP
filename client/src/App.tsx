import { Switch, Route, useLocation } from "wouter";
import { createContext, useContext } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import AdminLayout from "@/components/AdminLayout";
import OnboardingTour from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import RabbitHole from "@/pages/RabbitHole";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import Connections from "@/pages/Connections";
import DepthReader from "@/pages/DepthReader";
import Admin from "@/pages/Admin";
import AdminLive from "@/pages/AdminLive";
import QA from "@/pages/QA";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Account from "@/pages/Account";
import Live from "@/pages/Live";
import Channel from "@/pages/Channel";
import Watch from "@/pages/Watch";
import Replay from "@/pages/Replay";
import PersonDetail from "@/pages/PersonDetail";
import AdminPeople from "@/pages/AdminPeople";
import AdminInvestigationEditor from "@/pages/AdminInvestigationEditor";
import Library from "@/pages/Library";
import LibraryWork from "@/pages/LibraryWork";
import LibraryBook from "@/pages/LibraryBook";
import LibraryChapter from "@/pages/LibraryChapter";
import Guide from "@/pages/Guide";
import Pricing from "@/pages/Pricing";
import AdminTimeline from "@/pages/AdminTimeline";
import Timeline from "@/pages/Timeline";
import WorkspaceV2 from "@/pages/WorkspaceV2";
import WorkspaceReal from "@/pages/WorkspaceReal";

interface OnboardingContextType {
  restartTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({ restartTour: () => {} });
export const useOnboardingContext = () => useContext(OnboardingContext);

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/account" component={Account} />
      <Route path="/rabbithole/:slug/read" component={DepthReader} />
      <Route path="/rabbithole/:slug" component={RabbitHole} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/connections" component={Connections} />
      <Route path="/people/:handle" component={PersonDetail} />
      <Route path="/live" component={Live} />
      <Route path="/channel/:handle" component={Channel} />
      <Route path="/watch/:streamId" component={Watch} />
      <Route path="/replay/:streamId" component={Replay} />
      <Route path="/library/:workSlug/:bookSlug/:chapterNumber" component={LibraryChapter} />
      <Route path="/library/:workSlug/:bookSlug" component={LibraryBook} />
      <Route path="/library/:workSlug" component={LibraryWork} />
      <Route path="/library" component={Library} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/guide" component={Guide} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/qa" component={QA} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/investigations/:id" component={AdminInvestigationEditor} />
        <Route path="/admin/timeline" component={AdminTimeline} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/live" component={AdminLive} />
        <Route path="/admin/people" component={AdminPeople} />
        <Route component={Admin} />
      </Switch>
    </AdminLayout>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const isV2 = location.startsWith("/workspace-v2");

  if (isAdmin) {
    return <AdminRouter />;
  }

  // V2 workspace is full-screen — bypass Navbar and global layout.
  // /workspace-v2          → mock demonstration
  // /workspace-v2/:slug    → real investigation data
  if (isV2) {
    return (
      <Switch>
        <Route path="/workspace-v2/:slug" component={WorkspaceReal} />
        <Route path="/workspace-v2" component={WorkspaceV2} />
      </Switch>
    );
  }

  return (
    <>
      <Navbar />
      <PublicRouter />
    </>
  );
}

function App() {
  const onboarding = useOnboarding();
  const [currentPath] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingContext.Provider value={{ restartTour: onboarding.restartTour }}>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <AppRouter />
            {!currentPath.startsWith("/workspace-v2") && (
              <OnboardingTour
                active={onboarding.tourActive}
                step={onboarding.tourStep}
                onNext={onboarding.nextStep}
                onPrev={onboarding.prevStep}
                onComplete={onboarding.completeTour}
                onSkip={onboarding.completeTour}
              />
            )}
          </div>
        </OnboardingContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
