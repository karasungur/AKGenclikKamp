import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import SplashScreen from "@/pages/splash";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import QuestionsPage from "@/pages/questions";
import UsersPage from "@/pages/users";
import ReportsPage from "@/pages/reports";
import FeedbackPage from "@/pages/feedback";
import LogsPage from "@/pages/logs";
import ModeratorQuestionsPage from "@/pages/moderator-questions";
import ResponsesPage from "@/pages/responses";
import TablesPage from "@/pages/tables";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ProgramPage from "@/pages/program";
import PhotosPage from "@/pages/photos";
import SocialMediaPage from "@/pages/social-media";
import TeamPage from "@/pages/team";

function Router() {
  const { user, isLoading, showSplash } = useAuth();

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ak-yellow">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/program" component={ProgramPage} />
      <Route path="/photos" component={PhotosPage} />
      <Route path="/social-media" component={SocialMediaPage} />
      <Route path="/team" component={TeamPage} />
      {user && (
        <>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/questions" component={user.role === 'moderator' ? ModeratorQuestionsPage : QuestionsPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/feedback" component={FeedbackPage} />
          <Route path="/logs" component={LogsPage} />
          <Route path="/responses" component={ResponsesPage} />
          <Route path="/tables" component={TablesPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
