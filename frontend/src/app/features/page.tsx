"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Brain, BarChart3, Zap, Shield, Clock } from "lucide-react";
import NavbarWrapper from "@/components/NavabarWrapper";

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarWrapper />
      
      <main className="flex flex-col items-center justify-center px-4 py-16 min-h-screen">
        <div className="w-full max-w-6xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Powerful <span className="text-orange-500">Features</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our AI-powered platform revolutionizes scrap metal identification and management
            </p>
          </div>

          {/* Core Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl">Image Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Advanced computer vision technology that accurately identifies and classifies different 
                    types of steel scrap from images.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-xl">AI Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Machine learning algorithms that continuously improve accuracy and provide detailed 
                    classification results.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-xl">Analytics & Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Comprehensive analytics and reporting tools to track efficiency improvements and 
                    cost savings over time.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-orange-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl">Real-time Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Instant results with processing times under 5 seconds, enabling quick decision-making 
                    in industrial environments.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-red-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle className="text-xl">Quality Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Built-in validation systems ensure consistent and reliable results across different 
                    operating conditions.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-full bg-indigo-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-indigo-500" />
                  </div>
                  <CardTitle className="text-xl">24/7 Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Cloud-based platform ensures continuous availability for round-the-clock industrial operations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Capabilities */}
          <Card className="shadow-lg mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">Advanced Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-orange-500">Multi-Material Detection</h4>
                  <p className="text-gray-600">
                    Identify various types of steel, aluminum, copper, and other metals with high accuracy.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-orange-500">Size Classification</h4>
                  <p className="text-gray-600">
                    Automatically categorize scrap by size ranges for optimal processing and handling.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-orange-500">Contamination Detection</h4>
                  <p className="text-gray-600">
                    Detect non-metallic contaminants and impurities that could affect recycling quality.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-orange-500">Batch Processing</h4>
                  <p className="text-gray-600">
                    Handle multiple images simultaneously for high-volume industrial applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Features */}
          <Card className="shadow-lg mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">Integration & Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="font-semibold text-lg mb-2">API Access</h4>
                  <p className="text-gray-600">
                    RESTful API for seamless integration with existing industrial systems and workflows.
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg mb-2">Mobile Support</h4>
                  <p className="text-gray-600">
                    Responsive design works perfectly on mobile devices for field operations.
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg mb-2">Export Options</h4>
                  <p className="text-gray-600">
                    Multiple export formats including CSV, PDF, and Excel for reporting and analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Experience These Features?</h2>
            <p className="text-gray-600 mb-6">
              Start using our platform today and see the difference AI can make
            </p>
            <Button 
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
