"use client"

import { motion } from "framer-motion"
import { ArrowRight, Upload, Box, Move, Share2 } from "lucide-react"
import { Link } from "react-router-dom";

export function Home() {
  const features = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Upload Plan",
      description: "Drag & drop your 2D floor plan",
    },
    {
      icon: <Box className="h-6 w-6" />,
      title: "3D Conversion",
      description: "AI transforms it into a realistic 3D model",
    },
    {
      icon: <Move className="h-6 w-6" />,
      title: "Virtual Tour",
      description: "Walk through your space in first-person view",
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Share & Edit",
      description: "Customize and share with clients or team",
    },
  ]

  const audiences = ["Homeowners", "Architects & Designers", "Real Estate Agents", "Developers & Contractors"]

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#2E073F] via-[#7A1CAC] to-[#AD49E1] py-32 text-white">
        {/* Animated background elements */}
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
        <motion.div 
          className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#7A1CAC]/30 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
          }}
        />
        
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
            >
              See Your Space Before It's Built
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12 text-xl md:text-2xl font-light"
            >
              2D Floor Plans → 3D Walkthroughs. <br className="hidden md:inline" />
              <span className="font-medium">Instantly.</span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col md:flex-row gap-4 justify-center"
            >
              <Link to="/tool">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-[#2E073F] shadow-lg transition-all hover:shadow-xl"
                >
                  Start Now <ArrowRight className="ml-2" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center rounded-full bg-transparent border border-white/30 px-8 py-4 font-medium text-white transition-all hover:bg-white/10"
              >
                Watch Demo
              </motion.button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="mt-16 md:mt-20"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <h3 className="text-3xl font-bold mb-1">4+</h3>
                  <p className="text-white/70">Users</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-1">[x]%</h3>
                  <p className="text-white/70">Accuracy</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-1">[z]min</h3>
                  <p className="text-white/70">Turnaround</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-1">[y]/5</h3>
                  <p className="text-white/70">Rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center"
          >
            <p className="text-white/60 text-sm mb-2">Scroll to explore</p>
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L10 9L19 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center text-3xl font-bold"
          >
            How It Works
          </motion.h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl bg-[#EBD3F8]/30 p-6 shadow-sm transition-all hover:shadow-md dark:bg-[#2E073F]/20"
              >
                <div className="mb-4 inline-flex rounded-lg bg-[#7A1CAC]/20 p-3 text-[#7A1CAC] dark:bg-[#7A1CAC]/30 dark:text-[#AD49E1]">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Visual */}
      <section className="bg-[#EBD3F8]/20 py-20 dark:bg-[#2E073F]/20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="aspect-video overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#2E073F]"
            >
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-[#7A1CAC] dark:text-[#AD49E1]">
                    <Box className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-xl font-medium mb-3">Interactive 3D Preview</p>
                  <Link to="/tool">
                    <button className="mt-4 inline-flex items-center rounded-full bg-[#7A1CAC] px-6 py-3 text-sm font-medium text-white hover:bg-[#AD49E1]">
                      Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center text-3xl font-bold"
          >
            Perfect For
          </motion.h2>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 md:grid-cols-2">
              {audiences.map((audience, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-700"
                >
                  <div className="mr-3 rounded-full bg-purple-100 p-1 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M13.3337 4L6.00033 11.3333L2.66699 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="font-medium">{audience}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-purple-700 py-16 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">Transform your floor plan today</h2>
            <Link to="/tool">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-purple-900 shadow-lg transition-all hover:shadow-xl"
              >
                Get Started <ArrowRight className="ml-2" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

