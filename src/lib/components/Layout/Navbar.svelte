<!-- src/lib/components/Layout/Navbar.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { authClient } from '$lib/auth-client';
    
    // User state
    let user = $derived(page.data.user);
    let isLoggedIn = $derived(Boolean(user));
    let isMobileMenuOpen = $state(false);
    
    // Logout function
    async function handleLogout() {
      try {
        await authClient.signOut();
        goto('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Toggle mobile menu
    function toggleMobileMenu() {
      isMobileMenuOpen = !isMobileMenuOpen;
    }
  </script>
  
  <nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-blue-600 font-bold text-xl">
              GS1 Label Generator
            </a>
          </div>
          
          <!-- Desktop navigation -->
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a 
              href="/" 
              class="{page.url.pathname === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              Home
            </a>
            
            {#if isLoggedIn}
              <a 
                href="/dashboard" 
                class="{page.url.pathname === '/dashboard' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </a>
              
              <a 
                href="/labels" 
                class="{page.url.pathname.startsWith('/labels') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Labels
              </a>
            {/if}
          </div>
        </div>
        
        <!-- User menu -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          {#if isLoggedIn}
            <div class="ml-3 relative">
              <div class="flex items-center space-x-4">
                <span class="text-sm font-medium text-gray-700">
                  {user?.username || 'User'}
                </span>
                <button
                  onclick={handleLogout}
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-center space-x-4">
              <a
                href="/login"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login
              </a>
              <a
                href="/signup"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up
              </a>
            </div>
          {/if}
        </div>
        
        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden">
          <button
            onclick={toggleMobileMenu}
            type="button"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-expanded="false"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Icon when menu is closed -->
            {#if !isMobileMenuOpen}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            {:else}
              <!-- Icon when menu is open -->
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu, show/hide based on menu state -->
    {#if isMobileMenuOpen}
      <div class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <a
            href="/"
            class="{page.url.pathname === '/' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Home
          </a>
          
          {#if isLoggedIn}
            <a
              href="/dashboard"
              class="{page.url.pathname === '/dashboard' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Dashboard
            </a>
            
            <a
              href="/labels"
              class="{page.url.pathname.startsWith('/labels') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Labels
            </a>
          {/if}
        </div>
        
        <div class="pt-4 pb-3 border-t border-gray-200">
          {#if isLoggedIn}
            <div class="flex items-center px-4">
              <div class="ml-3">
                <div class="text-base font-medium text-gray-800">{user?.username || 'User'}</div>
                <div class="text-sm font-medium text-gray-500">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            <div class="mt-3 space-y-1">
              <button
                onclick={handleLogout}
                class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                Logout
              </button>
            </div>
          {:else}
            <div class="mt-3 space-y-1">
              <a
                href="/login"
                class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Login
              </a>
              <a
                href="/signup"
                class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign Up
              </a>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </nav>
