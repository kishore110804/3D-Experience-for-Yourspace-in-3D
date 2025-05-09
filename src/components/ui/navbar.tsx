import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  authRequired?: boolean;
  guestOnly?: boolean;
}

interface NavbarProps {
  items?: NavItem[];
}

export function Navbar({ items = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, signOut } = useAuth();

  const defaultItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Tool", href: "/tool", authRequired: true },
    { label: "Pricing", href: "/pricing" },
  ];

  const navItems = items.length 
    ? items 
    : defaultItems.filter(item => {
        if (item.authRequired && !currentUser) return false;
        if (item.guestOnly && currentUser) return false;
        return true;
      });

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 z-50 w-auto max-w-2xl px-4"
    >
      <motion.nav
        className="flex items-center justify-between rounded-full border border-[#EBD3F8]/20 bg-[#2E073F]/80 p-2 backdrop-blur-md"
        layout
      >
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-[#7A1CAC] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Account Button */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <Link
                to="/profile"
                className="rounded-full bg-[#7A1CAC] p-2 text-white transition-colors hover:bg-[#AD49E1]"
              >
                <User size={20} />
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-full p-2 text-white/80 transition-colors hover:bg-[#7A1CAC] hover:text-white"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-[#7A1CAC] p-2 text-white transition-colors hover:bg-[#AD49E1]"
            >
              <User size={20} />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full p-2 text-white transition-colors hover:bg-[#7A1CAC] md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 rounded-xl bg-[#2E073F] p-2 shadow-lg md:hidden"
        >
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="block rounded-lg px-4 py-2 text-white hover:bg-[#7A1CAC]"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          
          {currentUser && (
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left rounded-lg px-4 py-2 text-white hover:bg-[#7A1CAC]"
            >
              Sign Out
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
