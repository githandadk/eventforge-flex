import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading, error } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
              <p className="text-lg font-medium">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="h-12 w-12 text-warning" />
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground">
                You must be signed in to access the admin dashboard.
              </p>
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Shield className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have admin privileges to access this dashboard.
              </p>
              <Button variant="outline" asChild>
                <Link to="/">Return Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};