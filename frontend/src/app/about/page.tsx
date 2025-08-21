"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Target, Award, Globe } from "lucide-react";
import NavbarWrapper from "@/components/NavabarWrapper";

export default function AboutPage() {
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
              About <span className="text-orange-500">Steel Scrap Detector</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Revolutionizing industrial scrap management through cutting-edge AI technology
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Target className="h-6 w-6 text-orange-500" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To provide industries with intelligent, efficient, and sustainable solutions for scrap metal 
                  identification and classification, reducing waste and maximizing recycling value.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Globe className="h-6 w-6 text-orange-500" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To become the global leader in AI-powered industrial waste management, creating a more 
                  sustainable future for manufacturing and recycling industries.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Company Story */}
          <Card className="shadow-lg mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Founded in 2023, Steel Scrap Detector emerged from a simple observation: industries were 
                struggling with inefficient scrap metal sorting processes that led to significant waste and 
                financial losses.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our team of AI engineers and industrial experts came together to develop a solution that 
                combines computer vision, machine learning, and deep understanding of industrial processes 
                to create an intelligent scrap classification system.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we serve manufacturing facilities across India, helping them reduce waste by up to 
                40% and increase recycling efficiency significantly.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="p-4 rounded-full bg-orange-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We strive for excellence in every aspect of our technology and service delivery.
                </p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-full bg-orange-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We continuously innovate to provide cutting-edge solutions for our clients.
                </p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-full bg-orange-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
                <p className="text-gray-600">
                  We're committed to environmental responsibility and sustainable business practices.
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          <Card className="shadow-lg mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our team consists of experienced professionals from diverse backgrounds including AI/ML, 
                computer vision, industrial engineering, and business development.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Technical Excellence</h4>
                  <p className="text-gray-600">
                    Our engineers bring years of experience in developing AI solutions for industrial applications.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Industry Knowledge</h4>
                  <p className="text-gray-600">
                    We understand the challenges and requirements of modern manufacturing and recycling facilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Join the revolution in industrial scrap management
            </p>
            <Button 
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Try Our Platform
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
