"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Upload, LineChart, Rocket } from "lucide-react";
import ThreeBackground from "@/components/ThreeBackground";
import { cinzel, playfair } from "./fonts";
import Image from "next/image";
import NavbarWrapper from "@/components/NavabarWrapper";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarWrapper/>
      
      {/* Hero Section - Now Uncommented and Enhanced */}
      <Hero />

      {/* Scrollable onboarding content */}
      <main className="flex flex-col items-center justify-center px-4 py-16  ">
        <Card className="w-full max-w-3xl shadow-lg bg-white z-10 hover:shadow-bg-orange-500 transition-transform transform hover:scale-103">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Welcome to Steel Scrap Detector</CardTitle>
            <p className="text-gray-500 mt-2">AI-powered scrap classification for industrial efficiency</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Step
                icon={<Upload className="h-6 w-6 text-blue-500" />}
                title="Upload Scrap Images"
                description="Easily upload your industrial scrap images to begin detection."
              />
              <Step
                icon={<LineChart className="h-6 w-6 text-green-500" />}
                title="View Predictions"
                description="See real-time classification and scrap segmentation results."
              />
              <Step
                icon={<Rocket className="h-6 w-6 text-purple-500" />}
                title="Optimize Workflow"
                description="Use insights to improve scrap handling and reduce waste."
              />
            </div>

            <div className="text-center">
              <Button onClick={() => router.push("/dashboard")} className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 transition-colors">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto">
        <AdditionalInfoSections />
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 w-full px-6 py-4 flex justify-between items-center z-20 bg-transparent">
      <div className="text-2xl font-bold">
        <span className="text-orange-500">Scrap</span>ify
      </div>
      <nav className="space-x-6 text-sm font-medium">
        <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
        <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
        <a href="#about" className="hover:text-orange-500 transition-colors">About Us</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-between px-8 pt-24 pb-16 overflow-hidden">
      {/* Background Shapes */}
     {/* Top Right Background Shape */}
<div className="absolute top-0 right-0 w-[60vw] max-w-[650px] h-[60vw] max-h-[650px] bg-orange-500  opacity-80 rounded-bl-[40%] -z-10"></div>

{/* Bottom Left Background Shape */}
<div className="absolute bottom-0 left-0 w-[30vw] max-w-[380px] h-[30vw] max-h-[380px] bg-orange-500 opacity-80 rounded-tr-[40%] -z-10"></div>

      
      {/* Hero Content */}
     <div className="w-full lg:w-1/2 z-10 px-4 text-center lg:text-left">
 <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 ${playfair.className} relative`}>
  AI-Powered 
  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mt-2 text-orange-500 relative z-[9999]">
    Scrap Analysis
  </span>
</h1>

  <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-6 mb-8 max-w-xl mx-auto lg:mx-0">
    Upload images of steel scrap and instantly receive accurate classification 
    and sorting recommendations. Save time, reduce waste, and maximize recycling value.
  </p>
  <div className="flex justify-center lg:justify-start">
    <Button 
      className="bg-orange-500 hover:bg-orange-600 rounded-full px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium transition-all hover:-translate-y-1 hover:shadow-lg"
      onClick={() => router.push("/dashboard")}
    >
      Try It Now
    </Button>
  </div>
</div>

      
      {/* Hero Image */}
    <div className="hidden lg:block w-1/2 z-10 relative">
        <div className="w-[500px] h-[500px] rounded-full overflow-hidden bg-orange-500 relative">
          <Image 
            src="/scrap.jpg" 
            alt="Industrial workers examining equipment" 
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>


      
    </section>
  );
}

function Step({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="p-3 rounded-full shadow-md">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function AdditionalInfoSections() {
  return (
    <div className="w-full px-4 py-10 flex flex-col items-center space-y-10">
      <section className="border border-gray-700 rounded-xl p-8 shadow-lg max-w-5xl w-full">
        <h2 className="text-3xl font-bold mb-4 text-orange-400">What Our Partners Say</h2>
        <blockquote className="italic text-lg leading-relaxed">
          "The Steel Scrap Detector has revolutionized how we sort and classify scrap metal in our facility.
          Efficiency has gone up and waste has gone down. A true game changer."
        </blockquote>
        <p className="mt-4 text-gray-400 text-right text-sm">— Industrial Partner, Mumbai</p>
      </section>

      <section id="contact" className="border border-gray-700 rounded-xl p-8 text-center shadow-lg max-w-5xl w-full">
        <h2 className="text-3xl font-bold text-orange-500 mb-3">Have Questions?</h2>
        <p className="mb-6">
          We're here to help you integrate this AI system into your workflow.
        </p>
        <Button className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 transition-colors">
          Contact Us
        </Button>
      </section>
    </div>
  );
}