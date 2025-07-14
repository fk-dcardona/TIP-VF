"use client";

import { useAuth, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const { createOrganization, setActive } = useOrganizationList();
  
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // If user already has an organization, redirect to dashboard
    if (organization) {
      router.push("/dashboard");
    }
  }, [organization, router]);

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return;
    
    setCreating(true);
    try {
      const org = await createOrganization({
        name: orgName,
      });
      
      await setActive({ organization: org });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating organization:", error);
      setCreating(false);
    }
  };

  const handleJoinExisting = () => {
    // For MVP, we'll redirect to dashboard 
    // In production, this would show organization invites
    router.push("/dashboard");
  };

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Supply Chain Intelligence
          </h1>
          <p className="text-gray-600">
            Let's get your organization set up
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Organization */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <Building2 className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Create New Organization</CardTitle>
              <CardDescription>
                Start fresh with your own supply chain workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mb-4"
              />
              <Button 
                onClick={handleCreateOrganization}
                disabled={creating || !orgName.trim()}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Existing Organization */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Join Existing Team</CardTitle>
              <CardDescription>
                Accept an invitation to join your team's workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Check your email for organization invitations or ask your admin to invite you.
              </p>
              <Button 
                onClick={handleJoinExisting}
                variant="outline"
                className="w-full"
              >
                View Invitations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Organization selection will be added in future updates */}
      </div>
    </div>
  );
}