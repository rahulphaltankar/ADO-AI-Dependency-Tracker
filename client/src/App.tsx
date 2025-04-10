import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Dependencies from "@/pages/Dependencies";
import WorkItems from "@/pages/WorkItems";
import SprintTimeline from "@/pages/SprintTimeline";
import AiAnalysis from "@/pages/AiAnalysis";
import Analytics from "@/pages/Analytics";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import PhysicsSettings from "@/pages/PhysicsSettings";
import AppLayout from "@/components/layout/AppLayout";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dependencies" component={Dependencies} />
        <Route path="/work-items" component={WorkItems} />
        <Route path="/sprint-timeline" component={SprintTimeline} />
        <Route path="/ai-analysis" component={AiAnalysis} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/physics-settings" component={PhysicsSettings} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Router />
        <Toaster />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
