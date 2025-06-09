"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Gamepad2,
  Search,
  Star,
  Trophy,
  Users,
  Play,
  Calendar,
  BarChart3,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
} from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

interface StatusCard {
  status: string
  count: string
  color: string
  icon: React.ReactNode
}

export default function HomePage() {
  const [currentFeature, setCurrentFeature] = useState<number>(0)

  const features: Feature[] = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Discover Games",
      description:
        "Search through thousands of games and find your next favorite",
      color: "from-blue-500 to-purple-600",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Track Progress",
      description:
        "Keep track of what you're playing, completed, or plan to play",
      color: "from-green-500 to-teal-600",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Rate & Review",
      description: "Rate games and write reviews to share your thoughts",
      color: "from-yellow-500 to-orange-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Gaming Stats",
      description: "View detailed statistics about your gaming habits",
      color: "from-purple-500 to-pink-600",
    },
  ]

  const statusCards: StatusCard[] = [
    {
      status: "Playing",
      count: "12",
      color: "bg-green-500",
      icon: <Play className="w-5 h-5" />,
    },
    {
      status: "Completed",
      count: "47",
      color: "bg-blue-500",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      status: "Plan to Play",
      count: "23",
      color: "bg-purple-500",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      status: "On Hold",
      count: "8",
      color: "bg-yellow-500",
      icon: <Clock className="w-5 h-5" />,
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              My
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Game
              </span>
              List
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Track your gaming journey, discover amazing titles, and connect
              with fellow gamers. Your personal gaming companion.
            </p>

            {/* Feature Showcase */}
            <div className="max-w-4xl mx-auto">
              {/* Feature Description */}
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div
                    className={`p-3 bg-gradient-to-r ${features[currentFeature].color} rounded-xl`}
                  >
                    {features[currentFeature].icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {features[currentFeature].title}
                    </h3>
                    <p className="text-gray-300">
                      {features[currentFeature].description}
                    </p>
                  </div>
                </div>

                {/* Feature Indicators */}
                <div className="flex gap-2 justify-center">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-12 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? "bg-purple-500"
                          : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-300">
              Powerful features to enhance your gaming experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl w-fit mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Game Discovery
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Browse through thousands of games with advanced search and
                filtering options. Find hidden gems and upcoming releases.
              </p>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl w-fit mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Achievement Tracking
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Track your gaming achievements, completion rates, and personal
                milestones. Celebrate your gaming journey.
              </p>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl w-fit mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-300 leading-relaxed">
                Connect with other gamers, share reviews, and discover games
                through community recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Gaming Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of gamers who are already tracking their progress
            with MyGameList
          </p>
          <Link
            href="/signup"
            className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto w-fit"
          >
            <Gamepad2 className="w-6 h-6" />
            Start Tracking Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Gamepad2 className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-white">MyGameList</span>
            </div>
            <div className="flex gap-8 text-gray-400">
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/features"
                className="hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/support"
                className="hover:text-white transition-colors"
              >
                Support
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 MyGameList. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
