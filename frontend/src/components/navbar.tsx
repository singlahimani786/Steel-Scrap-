'use client'
import Link from "next/link";
import { Menu, X } from "lucide-react"; // Make sure you have lucide-react or use any icon set you prefer
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { useState } from "react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default  function Navbar(){
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="py-6 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4  flex justify-between items-center">
       <div className="text-2xl font-bold">
        <span className="text-orange-500">Scrap</span>ify
      </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className= " text-l  hover:text-orange-600 transition">
              {item.label}
            </Link>
          ))}
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
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block  hover:text-orange-600 transition   ">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
