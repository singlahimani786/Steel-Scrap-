'use client'
import Link from "next/link";
import { Menu, X, Upload, BarChart3, History, Settings, Users, Building2, Shield, Home } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar(){
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Role-based navigation items
  const getRoleBasedNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Admin Panel", href: "/admin", icon: Shield }
      ];
    }
    
    if (user.role === 'owner') {
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Owner Panel", href: "/owner", icon: Building2 },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { label: "History", href: "/dashboard/history", icon: History }
      ];
    }
    
    if (user.role === 'labourer') {
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Upload Image", href: "/dashboard", icon: Upload }
      ];
    }
    
    return [];
  };

  // Get authenticated nav items based on role
  const getAuthenticatedNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'labourer') {
      return []; // Labourers only see upload image
    }
    
    return [
      { label: "Dashboard", href: "/dashboard", icon: BarChart3 }
    ];
  };

  return (
    <nav className="py-4 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 justify-between">
        <div className="text-2xl font-bold">
          <span className="text-orange-500">Scrap</span>ify
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6">
          {user && getRoleBasedNavItems().map((item) => (
            <Link key={item.href} href={item.href} className="text-l hover:text-orange-600 transition">
              {item.label}
            </Link>
          ))}
          {user && getAuthenticatedNavItems().map((item) => (
            <Link key={item.href} href={item.href} className="text-l hover:text-orange-600 transition">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs rounded-full px-3 py-1 font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                user.role === 'owner' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {user.role === 'admin' ? 'Admin' :
                 user.role === 'owner' ? 'Owner' :
                 'Labourer'}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-3 bg-white shadow">
          {user && (
            <>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-gray-500 mb-2">Navigation</p>
                {getRoleBasedNavItems().map((item) => (
                  <Link key={item.href} href={item.href} className="block hover:text-orange-600 transition">
                    {item.label}
                  </Link>
                ))}
              </div>
              {getAuthenticatedNavItems().length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Dashboard</p>
                  {getAuthenticatedNavItems().map((item) => (
                    <Link key={item.href} href={item.href} className="block hover:text-orange-600 transition">
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="pt-2 border-t">
            {isLoading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : user ? (
              <button
                onClick={() => { setIsOpen(false); logout(); }}
                className="w-full text-left px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
