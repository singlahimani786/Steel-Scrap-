"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Upload, LineChart, Rocket, Shield, Users, BarChart3, CheckCircle, ArrowRight, Star, Zap, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import NavbarWrapper from "@/components/NavabarWrapper";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface StatProps {
  number: string;
  label: string;
  description: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const features = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms for accurate scrap classification and identification",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Real-time Results",
      description: "Instant analysis with confidence scores and detailed predictions",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Comprehensive Analytics",
      description: "Detailed insights into scrap types, trends, and processing recommendations",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control",
      color: "from-red-500 to-red-600"
    }
  ];

  const stats = [
    {
      number: "99.2%",
      label: "Accuracy Rate",
      description: "Industry-leading precision in scrap classification"
    },
    {
      number: "7",
      label: "Scrap Types",
      description: "Comprehensive coverage of steel scrap varieties"
    },
    {
      number: "24/7",
      label: "Availability",
      description: "Round-the-clock analysis capabilities"
    },
    {
      number: "<2s",
      label: "Response Time",
      description: "Lightning-fast analysis results"
    }
  ];

  const benefits = [
    "Reduce manual sorting errors by 95%",
    "Increase recycling efficiency by 40%",
    "Save up to 60% in processing time",
    "Improve quality control standards",
    "Generate detailed compliance reports",
    "Optimize resource allocation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <NavbarWrapper />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              AI-Powered Industrial Solution
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Intelligent
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Scrap Analysis
              </span>
              System
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your steel scrap processing with AI-powered classification, 
              real-time analytics, and intelligent sorting recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                className="px-8 py-4 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!user && (
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="px-8 py-4 text-lg border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-semibold rounded-full transition-all duration-300"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Scrapify?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our advanced AI system provides everything you need for efficient scrap processing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple three-step process to get accurate scrap analysis results
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Upload Images</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload high-quality images of your steel scrap and truck identification plates
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">AI Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithms analyze and classify the scrap with high accuracy
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Get Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive detailed analysis, confidence scores, and processing recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrap Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Seven Scrap Types We Analyze
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI system can identify and classify all major types of steel scrap with industry-leading accuracy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* CRC */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">CRC</CardTitle>
                <p className="text-sm text-blue-600 font-medium">Cold Rolled Coil</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  High-quality surface finish scrap with zinc coating and chromium content
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹52,000/ton</div>
                  <div>Energy: 2.8 MWh/ton</div>
                  <div>Carbon: 0.9 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* Burada */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white mb-4">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">Burada</CardTitle>
                <p className="text-sm text-green-600 font-medium">Iron Ore Fines</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Iron ore fines and sinter feed material for steel production
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹38,000/ton</div>
                  <div>Energy: 3.2 MWh/ton</div>
                  <div>Carbon: 1.1 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* K2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">K2</CardTitle>
                <p className="text-sm text-purple-600 font-medium">High Carbon Steel</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  High-grade steel scrap with specific alloy composition
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹65,000/ton</div>
                  <div>Energy: 3.5 MWh/ton</div>
                  <div>Carbon: 1.3 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* Selected */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">Selected</CardTitle>
                <p className="text-sm text-orange-600 font-medium">Premium Steel</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Premium quality selected steel scrap for high-end applications
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹75,000/ton</div>
                  <div>Energy: 2.2 MWh/ton</div>
                  <div>Carbon: 0.7 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* Piece to Piece */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">Piece to Piece</CardTitle>
                <p className="text-sm text-red-600 font-medium">Mixed Steel</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Individual pieces of steel scrap requiring manual handling
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹42,000/ton</div>
                  <div>Energy: 2.8 MWh/ton</div>
                  <div>Carbon: 0.9 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* Melting */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white mb-4">
                  <Rocket className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">Melting</CardTitle>
                <p className="text-sm text-indigo-600 font-medium">Low Grade Steel</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Low-grade scrap suitable for basic melting processes
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹35,000/ton</div>
                  <div>Energy: 4.0 MWh/ton</div>
                  <div>Carbon: 1.5 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>

            {/* Sponge Iron */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-teal-50 to-teal-100">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">Sponge Iron</CardTitle>
                <p className="text-sm text-teal-600 font-medium">Direct Reduced Iron</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Direct reduced iron with high porosity structure
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Price: ₹28,000/ton</div>
                  <div>Energy: 5.5 MWh/ton</div>
                  <div>Carbon: 2.0 tons CO2/ton</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Each scrap type has unique characteristics, processing requirements, and market values
            </p>
            <Button 
              onClick={handleGetStarted}
              className="px-8 py-4 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Start Analyzing Your Scrap
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transform Your Operations
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join leading industrial companies that have revolutionized their scrap processing 
                with our AI-powered solution. Experience unprecedented efficiency and accuracy.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={handleGetStarted}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Start Your Transformation
                  <Zap className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-100">
                <div className="text-center mb-6">
                  <TrendingUp className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Performance Metrics</h3>
                  <p className="text-gray-600">Real results from our users</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-700">Processing Speed</span>
                    <span className="font-bold text-orange-600">+300%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Accuracy Improvement</span>
                    <span className="font-bold text-green-600">+95%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Cost Reduction</span>
                    <span className="font-bold text-blue-600">-40%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700">Efficiency Gain</span>
                    <span className="font-bold text-purple-600">+250%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Revolutionize Your Scrap Processing?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of industrial companies that trust our AI-powered solution 
            for accurate, efficient, and reliable scrap analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleGetStarted}
              className="px-8 py-4 text-lg bg-white text-orange-600 hover:bg-gray-100 font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
            >
              {user ? 'Access Dashboard' : 'Start Free Trial'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {!user && (
              <Button 
                onClick={() => router.push('/login')}
                variant="outline"
                className="px-8 py-4 text-lg border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold rounded-full transition-all duration-300"
              >
                Contact Sales
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Scrapify</h3>
              <p className="text-gray-400 leading-relaxed">
                AI-powered scrap analysis system for industrial efficiency and sustainability.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Analytics</li>
                <li>API</li>
                <li>Documentation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Community</li>
                <li>Status</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Scrapify. All rights reserved. | AI-Powered Industrial Solutions</p>
          </div>
        </div>
      </footer>
    </div>
  );
}