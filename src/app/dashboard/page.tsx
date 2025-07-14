import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MainDashboard from "@/components/MainDashboard";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();
  const user = await currentUser();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // If user has no organization, redirect to onboarding
  if (!orgId) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Supply Chain Intelligence</h1>
              <OrganizationSwitcher 
                appearance={{
                  elements: {
                    rootBox: "flex",
                    organizationSwitcherTrigger: "border border-gray-300 rounded-md px-3 py-2"
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <MainDashboard />
      </main>
    </div>
  );
}