import { Home } from "./pages/Home"
import { Tool } from "./pages/Tool"
import { Auth } from "./pages/Auth"
import { Profile } from "./pages/Profile"
import { SiteHeader } from "@/components/site-header"
import { useRoutes } from "react-router-dom"
import { TailwindIndicator } from "./components/tailwind-indicator"
import { ThemeProvider } from "./components/theme-provider"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute"
import { sfProDisplay, jetbrainsMono } from "./styles/fonts"

function AppRoutes() {
  const routes = useRoutes([
    { path: "/", element: <Home /> },
    { 
      path: "/tool", 
      element: (
        <ProtectedRoute>
          <Tool />
        </ProtectedRoute>
      ) 
    },
    { 
      path: "/auth", 
      element: (
        <PublicOnlyRoute>
          <Auth />
        </PublicOnlyRoute>
      ) 
    },
    { 
      path: "/profile", 
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      )
    }
  ]);

  return routes;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <div className={`relative flex min-h-screen flex-col ${sfProDisplay.variable} ${jetbrainsMono.variable}`}>
          <SiteHeader />
          <div className="flex-1">
            <AppRoutes />
          </div>
        </div>
        <TailwindIndicator />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
