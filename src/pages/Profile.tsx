import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, FileUp, Folder, Settings, RefreshCw, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserProjects } from "@/lib/firebase-storage";

interface Project {
  id: string;
  name: string;
  date: string | Date;
  previewUrl: string;
}

export function Profile() {
  const { currentUser, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the user's projects from Firebase
  useEffect(() => {
    async function fetchUserProjects() {
      setIsLoading(true);
      try {
        const userProjects = await getUserProjects();
        setProjects(userProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (currentUser) {
      fetchUserProjects();
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#F9F6FC] dark:bg-[#1F042C] pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-[#2E073F] dark:text-white mb-2">My Account</h1>
              <p className="text-[#2E073F]/70 dark:text-[#EBD3F8]/70">
                {currentUser?.email || "User"}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link to="/tool">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center px-4 py-2 bg-[#7A1CAC] text-white rounded-lg hover:bg-[#AD49E1] transition-colors"
                >
                  <PlusCircle size={18} className="mr-2" />
                  New Project
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={signOut}
                className="flex items-center px-4 py-2 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg hover:bg-[#EBD3F8]/10 text-[#2E073F] dark:text-white transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Sign Out
              </motion.button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button className="border-[#7A1CAC] text-[#7A1CAC] whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">
                My Projects
              </button>
              <button className="border-transparent text-[#2E073F]/60 hover:text-[#2E073F] dark:text-[#EBD3F8]/60 dark:hover:text-[#EBD3F8] whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">
                Account Settings
              </button>
            </nav>
          </div>
          
          {/* Project list */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#2E073F] dark:text-white">Recent Projects</h2>
              
              <div className="flex gap-2">
                <button className="text-sm text-[#7A1CAC] hover:text-[#AD49E1]">
                  View All
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 text-[#7A1CAC] animate-spin" />
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-[#2E073F] rounded-xl shadow-sm overflow-hidden border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30"
                  >
                    <div className="h-48 bg-[#EBD3F8]/20 flex items-center justify-center">
                      {project.previewUrl ? (
                        <img
                          src={project.previewUrl}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Folder className="h-16 w-16 text-[#7A1CAC]/40" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#2E073F] dark:text-white mb-1">{project.name}</h3>
                      <p className="text-sm text-[#2E073F]/60 dark:text-[#EBD3F8]/60">
                        Last edited: {new Date(project.date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Link to={`/tool?project=${project.id}`} className="flex-1">
                          <button className="w-full py-2 px-3 bg-[#7A1CAC] text-white text-sm rounded-lg hover:bg-[#AD49E1] transition-colors">
                            Open
                          </button>
                        </Link>
                        <button className="p-2 text-[#2E073F] dark:text-[#EBD3F8] hover:bg-[#EBD3F8]/10 rounded-lg">
                          <Settings size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add new project card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-[#2E073F] rounded-xl shadow-sm overflow-hidden border border-dashed border-[#EBD3F8]/50 dark:border-[#7A1CAC]/50 flex flex-col items-center justify-center h-[280px]"
                >
                  <div className="text-center p-6">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#EBD3F8]/20 dark:bg-[#7A1CAC]/20 flex items-center justify-center">
                      <FileUp className="h-8 w-8 text-[#7A1CAC]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#2E073F] dark:text-white mb-2">Create New Project</h3>
                    <p className="text-sm text-[#2E073F]/70 dark:text-[#EBD3F8]/70 mb-4">
                      Upload a floor plan to get started
                    </p>
                    <Link to="/tool">
                      <button className="py-2 px-4 bg-[#7A1CAC]/10 text-[#7A1CAC] rounded-lg hover:bg-[#7A1CAC]/20 transition-colors">
                        Start Now
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#2E073F]/50 rounded-xl border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#EBD3F8]/20 dark:bg-[#7A1CAC]/20 flex items-center justify-center">
                  <Folder className="h-8 w-8 text-[#7A1CAC]" />
                </div>
                <h3 className="text-lg font-medium text-[#2E073F] dark:text-white mb-2">No Projects Yet</h3>
                <p className="text-sm text-[#2E073F]/70 dark:text-[#EBD3F8]/70 mb-4">
                  Upload your first floor plan to get started
                </p>
                <Link to="/tool">
                  <button className="py-2 px-4 bg-[#7A1CAC] text-white rounded-lg hover:bg-[#AD49E1] transition-colors">
                    Create New Project
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
