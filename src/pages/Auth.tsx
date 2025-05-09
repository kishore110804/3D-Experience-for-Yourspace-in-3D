import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, AlertCircle, LogIn, UserPlus, RefreshCw } from "lucide-react";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      } else {
        // Register
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created successfully! You can now log in.");
        setIsLogin(true);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent. Check your inbox.");
      setError("");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E073F] via-[#7A1CAC] to-[#AD49E1] py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-[#AD49E1]/20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />
      
      <div className="z-10 max-w-md w-full bg-white dark:bg-[#2E073F] rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-center text-3xl font-bold text-[#2E073F] dark:text-white mb-6">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-300 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#2E073F] dark:text-[#EBD3F8] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A1CAC]">
                      <User size={18} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg focus:ring-[#7A1CAC] focus:border-[#7A1CAC] bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2E073F] dark:text-[#EBD3F8] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A1CAC]">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg focus:ring-[#7A1CAC] focus:border-[#7A1CAC] bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#2E073F] dark:text-[#EBD3F8] mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A1CAC]">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg focus:ring-[#7A1CAC] focus:border-[#7A1CAC] bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white"
                    placeholder={isLogin ? "Your password" : "Create a password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7A1CAC]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-sm text-[#7A1CAC] hover:text-[#AD49E1] font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7A1CAC] hover:bg-[#AD49E1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A1CAC] disabled:opacity-70"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : isLogin ? (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#2E073F] text-[#2E073F] dark:text-[#EBD3F8]">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg shadow-sm text-sm font-medium text-[#2E073F] dark:text-white bg-white dark:bg-[#2E073F]/50 hover:bg-[#EBD3F8]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A1CAC]"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleForm}
                className="text-sm text-[#7A1CAC] hover:text-[#AD49E1] font-medium flex items-center justify-center mx-auto"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
