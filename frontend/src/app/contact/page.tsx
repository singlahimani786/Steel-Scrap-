"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import NavbarWrapper from "@/components/NavabarWrapper";

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarWrapper />
      
      <main className="flex flex-col items-center justify-center px-4 py-16 min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="w-full shadow-lg bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-800">Contact Us</CardTitle>
              <p className="text-gray-500 mt-2">Get in touch with our team for support and inquiries</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Mail className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-gray-600">support@scrapdetector.com</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Phone className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-orange-100">
                    <MapPin className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-sm text-gray-600">Mumbai, Maharashtra</p>
                </div>
              </div>

              {/* Contact Form */}
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="What is this about?"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="text-center">
                  <Button 
                    type="submit" 
                    className="px-8 py-3 text-lg bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
