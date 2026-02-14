import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public routes
  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/webhooks');

  // Redirect to sign-in if accessing protected route without auth
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to my-dashboard
  // (we'll redirect to dashboard if admin after role check)
  if (user && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/my-dashboard';
    return NextResponse.redirect(url);
  }

  // For authenticated users, fetch role from employees table
  if (user) {
    // Fetch role from employees table (source of truth)
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    const role = employee?.role || 'employee';

    // Redirect authenticated users from auth pages
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      const url = request.nextUrl.clone();
      url.pathname = role === 'employee' ? '/my-dashboard' : '/dashboard';
      return NextResponse.redirect(url);
    }

    // Role-based redirect: employees should go to my-dashboard, not admin routes
    if (pathname === '/dashboard' && role === 'employee') {
      const url = request.nextUrl.clone();
      url.pathname = '/my-dashboard';
      return NextResponse.redirect(url);
    }

    // Block employees from accessing admin routes
    const adminRoutes = ['/employees', '/training', '/admin', '/settings'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    
    if (role === 'employee' && isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/my-dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
