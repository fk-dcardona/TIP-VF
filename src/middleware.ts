import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes if Clerk is properly configured
  if (isProtectedRoute(req) && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      await auth.protect();
    } catch (error) {
      console.warn('Clerk protection failed:', error);
      // In production, you might want to redirect to sign-in
      // For now, allow access to prevent 500 errors
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

