import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Upload, 
  Box, 
  Eye, 
  Settings,
  PanelLeft, 
  Compass, 
  HelpCircle,
  Maximize2,
  RefreshCw,
  X,
  Save,
  FileUp
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFloorPlan, getProjectById, saveProject, upload3DModel } from "@/lib/firebase-storage";
import { WalkthroughViewer } from "@/components/WalkthroughViewer";

const DEFAULT_MODEL_PATH = '/assets/models/scene.gltf';

export function Tool() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("walkthrough");
  const [viewMode, setViewMode] = useState("firstPerson");
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [searchParams] = useSearchParams();
  const [currentProject, setCurrentProject] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [modelPath, setModelPath] = useState(DEFAULT_MODEL_PATH);
  const modelInputRef = useRef<HTMLInputElement>(null);
  
  // Check for mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && !collapsed) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Load project data if project ID is in URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      loadProject(projectId);
    }
  }, [searchParams]);

  // Load project from Firebase
  const loadProject = async (projectId: string) => {
    setIsLoading(true);
    startLoading();
    
    try {
      const project = await getProjectById(projectId);
      if (project) {
        setCurrentProject(project);
        setProjectName(project.name);
        setPreviewImage(project.originalImageUrl);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save project to Firebase
  const saveCurrentProject = async () => {
    if (!currentUser) {
      alert("Please sign in to save your project");
      navigate("/auth");
      return;
    }
    
    if (!previewImage) {
      alert("Please upload a floor plan first");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const projectData = {
        name: projectName || "Untitled Project",
        previewUrl: previewImage,
        originalImageUrl: previewImage,
      };
      
      const savedProject = await saveProject(projectData, currentProject?.id);
      
      if (savedProject) {
        setCurrentProject(savedProject);
        setShowSaveSuccess(true);
        
        // If it's a new project, update the URL to include the project ID
        if (!currentProject?.id) {
          navigate(`/tool?project=${savedProject.id}`, { replace: true });
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Simulate loading progress with better animation
  const startLoading = () => {
    setIsLoading(true);
    setProgressValue(0);
    
    const intervals = [300, 200, 400, 300, 500, 200, 600, 400, 100, 200];
    let currentStep = 0;
    
    const incrementProgress = () => {
      if (currentStep < 10) {
        setProgressValue((currentStep + 1) * 10);
        setTimeout(incrementProgress, intervals[currentStep]);
        currentStep++;
      } else {
        setIsLoading(false);
      }
    };
    
    setTimeout(incrementProgress, intervals[0]);
  };

  // File upload handler with validation and Firebase upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File validation
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPG, PNG, or PDF file.");
      return;
    }
    
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 20MB.");
      return;
    }
    
    // If projectName is empty, use file name without extension
    if (!projectName) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setProjectName(fileName || "New Floor Plan");
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    startLoading();
    
    // Upload to Firebase if user is logged in
    if (currentUser) {
      try {
        const project = await uploadFloorPlan(file, projectName || file.name.split('.')[0]);
        if (project) {
          setCurrentProject(project);
          // Update the URL with the new project ID
          navigate(`/tool?project=${project.id}`, { replace: true });
        }
      } catch (error) {
        console.error("Error uploading to Firebase:", error);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const clearUpload = () => {
    setPreviewImage(null);
    setProjectName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle 3D model upload
  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File validation
    const validTypes = ['model/gltf-binary', 'model/gltf+json'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(file.type) && 
        !file.name.endsWith('.glb') && 
        !file.name.endsWith('.gltf')) {
      alert("Invalid file type. Please upload a glTF/GLB file.");
      return;
    }
    
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 50MB.");
      return;
    }
    
    // Create a URL for the uploaded file for immediate preview
    const objectUrl = URL.createObjectURL(file);
    setModelPath(objectUrl);
    
    // If projectName is empty, use file name without extension
    if (!projectName) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setProjectName(fileName || "New 3D Model");
    }
    
    // Upload to Firebase if user is logged in and we have a project ID
    if (currentUser) {
      setIsLoading(true);
      startLoading();
      
      try {
        // If we don't have a project yet, create one first
        if (!currentProject?.id) {
          // Create a basic project first to get an ID
          const projectData = {
            name: projectName || "New 3D Model",
            previewUrl: previewImage || "",
            originalImageUrl: previewImage || "",
          };
          
          const newProject = await saveProject(projectData);
          if (newProject) {
            setCurrentProject(newProject);
            
            // Now upload the 3D model using the new project ID
            const modelUrl = await upload3DModel(file, newProject.id);
            
            // Update the project with the model URL
            if (modelUrl) {
              const updatedProject = await saveProject({ modelUrl }, newProject.id);
              if (updatedProject) {
                setCurrentProject(updatedProject);
              }
            }
            
            // Update URL with new project ID
            navigate(`/tool?project=${newProject.id}`, { replace: true });
          }
        } else {
          // If we already have a project, just add the model to it
          const modelUrl = await upload3DModel(file, currentProject.id);
          
          // Update project with the model URL
          if (modelUrl) {
            const updatedProject = await saveProject({ modelUrl }, currentProject.id);
            if (updatedProject) {
              setCurrentProject(updatedProject);
            }
          }
        }
      } catch (error) {
        console.error("Error uploading 3D model to Firebase:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const triggerModelUpload = () => {
    modelInputRef.current?.click();
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (modelPath.startsWith('blob:')) {
        URL.revokeObjectURL(modelPath);
      }
    };
  }, [modelPath]);

  return (
    <div className="h-screen flex flex-col bg-[#F9F6FC] dark:bg-[#1F042C] overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 bg-white dark:bg-[#2E073F] flex items-center px-4 shrink-0">
        <div className="flex-1 flex items-center">
          <Link to={currentUser ? "/profile" : "/"}>
            <motion.button
              whileHover={{ x: -3 }}
              className="flex items-center text-sm font-medium text-[#2E073F] dark:text-[#EBD3F8]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {currentUser ? "Profile" : "Home"}
            </motion.button>
          </Link>
        </div>
        
        <h1 className="flex-1 text-center text-lg md:text-xl font-bold text-[#2E073F] dark:text-white truncate px-2">
          {projectName || currentProject?.name || "3D Floor Plan Viewer"}
        </h1>
        
        <div className="flex-1 flex justify-end gap-2">
          {/* Save button */}
          {currentUser && previewImage && (
            <button 
              onClick={saveCurrentProject}
              disabled={isSaving || isLoading}
              className="p-2 rounded-full hover:bg-[#EBD3F8]/10 text-[#7A1CAC] relative"
            >
              {isSaving ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              
              {/* Save success indicator */}
              {showSaveSuccess && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </button>
          )}
          
          <button className="p-2 rounded-full hover:bg-[#EBD3F8]/10 text-[#7A1CAC]">
            <HelpCircle size={20} />
          </button>
        </div>
      </header>
      
      {/* Main content - Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Controls */}
        <motion.div 
          className={`${collapsed ? 'w-14' : 'w-80'} shrink-0 border-r border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 bg-white dark:bg-[#2E073F] flex flex-col transition-all duration-300 z-10`}
          animate={{ width: collapsed ? 56 : 320 }}
        >
          {/* Panel toggle */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#2E073F] border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 rounded-r-lg p-1 shadow-sm text-[#7A1CAC]"
            style={{ marginLeft: collapsed ? 56 : 320 }}
          >
            <PanelLeft size={16} className={collapsed ? 'rotate-180' : ''} />
          </button>
          
          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!collapsed && (
              <>
                {/* Project Info Section */}
                <div className="mb-6 space-y-3">
                  <label className="block text-sm font-semibold text-[#2E073F] dark:text-white">
                    Project Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="flex-1 py-2 px-4 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white text-sm"
                    />
                    <button
                      onClick={saveCurrentProject}
                      disabled={isSaving || isLoading || !previewImage}
                      className="py-2 px-3 bg-[#7A1CAC] hover:bg-[#AD49E1] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                    </button>
                  </div>
                  
                  {showSaveSuccess && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Project saved successfully!
                    </div>
                  )}
                </div>

                {/* Tab navigation */}
                <div className="flex border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 rounded-lg overflow-hidden mb-6">
                  <button 
                    onClick={() => setActiveTab("walkthrough")}
                    className={`flex-1 py-2 text-sm font-medium ${
                      activeTab === "walkthrough" 
                        ? "bg-[#7A1CAC] text-white" 
                        : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8] hover:bg-[#EBD3F8]/10"
                    }`}
                  >
                    Walkthrough
                  </button>
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className={`flex-1 py-2 text-sm font-medium ${
                      activeTab === "settings" 
                        ? "bg-[#7A1CAC] text-white" 
                        : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8] hover:bg-[#EBD3F8]/10"
                    }`}
                  >
                    Settings
                  </button>
                </div>
                
                {/* Tab content */}
                {activeTab === "walkthrough" && (
                  <div className="space-y-6">
                    {/* File upload section */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                        <Upload size={16} className="mr-2" />
                        Floor Plan Upload
                      </h3>
                      
                      <div className="flex flex-col gap-2">
                        {/* Hidden file input */}
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                        />
                        
                        {/* Project name input */}
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Project name (optional)"
                          className="w-full py-2 px-4 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white text-sm"
                        />
                        
                        <button 
                          onClick={triggerFileUpload}
                          className="w-full py-2 px-4 bg-[#7A1CAC] hover:bg-[#AD49E1] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                          ) : (
                            <Upload size={16} className="mr-2" />
                          )}
                          {isLoading ? "Processing..." : "Upload Floor Plan"}
                        </button>
                        
                        <div className="text-xs text-center text-[#2E073F]/60 dark:text-[#EBD3F8]/60">
                          Supports JPG, PNG, PDF up to 20MB
                        </div>
                      </div>
                      
                      {/* Small preview of uploaded image */}
                      {previewImage && !isLoading && (
                        <div className="mt-4 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg overflow-hidden relative">
                          <img 
                            src={previewImage} 
                            alt="Floor plan preview" 
                            className="w-full h-auto max-h-48 object-cover"
                          />
                          <button 
                            onClick={clearUpload}
                            className="absolute top-2 right-2 bg-white/80 dark:bg-[#2E073F]/80 rounded-full p-1 hover:bg-white dark:hover:bg-[#2E073F]"
                          >
                            <X size={16} className="text-[#7A1CAC]" />
                          </button>
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#2E073F] dark:text-white">Processing...</span>
                            <span className="text-[#7A1CAC]">{progressValue}%</span>
                          </div>
                          <div className="w-full bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[#7A1CAC] h-full transition-all duration-300" 
                              style={{ width: `${progressValue}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </section>
                    
                    {/* 3D Model upload section */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                        <FileUp size={16} className="mr-2" />
                        3D Model Upload (Optional)
                      </h3>
                      
                      <div className="flex flex-col gap-2">
                        {/* Hidden file input for 3D models */}
                        <input 
                          type="file"
                          ref={modelInputRef}
                          onChange={handleModelUpload}
                          accept=".glb,.gltf"
                          className="hidden"
                        />
                        
                        <button 
                          onClick={triggerModelUpload}
                          className="w-full py-2 px-4 bg-[#7A1CAC]/20 hover:bg-[#7A1CAC]/30 text-[#7A1CAC] rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                        >
                          <FileUp size={16} className="mr-2" />
                          Upload 3D Model
                        </button>
                        
                        <div className="text-xs text-center text-[#2E073F]/60 dark:text-[#EBD3F8]/60">
                          Supports glTF/GLB files up to 50MB
                        </div>
                      </div>
                    </section>
                    
                    {/* View controls - only show if we have an image */}
                    {previewImage && !isLoading && (
                      <>
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                            <Eye size={16} className="mr-2" />
                            View Controls
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">View Mode</span>
                              <div className="flex border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 rounded-lg overflow-hidden">
                                <button 
                                  onClick={() => setViewMode("firstPerson")}
                                  className={`px-3 py-1 text-xs ${
                                    viewMode === "firstPerson" 
                                      ? "bg-[#7A1CAC] text-white" 
                                      : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8]"
                                  }`}
                                >
                                  First Person
                                </button>
                                <button 
                                  onClick={() => setViewMode("topDown")}
                                  className={`px-3 py-1 text-xs ${
                                    viewMode === "topDown" 
                                      ? "bg-[#7A1CAC] text-white" 
                                      : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8]"
                                  }`}
                                >
                                  Top Down
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">Show Furniture</span>
                              <div className="relative inline-block w-10 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="toggle-furniture" 
                                  className="sr-only peer"
                                  checked={showFurniture}
                                  onChange={(e) => setShowFurniture(e.target.checked)}
                                />
                                <label 
                                  htmlFor="toggle-furniture"
                                  className="block h-6 overflow-hidden rounded-full bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 cursor-pointer peer-checked:bg-[#7A1CAC]"
                                >
                                  <span className="absolute transform transition-transform duration-200 h-4 w-4 rounded-full bg-white top-1 left-1 peer-checked:translate-x-4"></span>
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">Show Dimensions</span>
                              <div className="relative inline-block w-10 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="toggle-dimensions" 
                                  className="sr-only peer"
                                  checked={showDimensions}
                                  onChange={(e) => setShowDimensions(e.target.checked)}
                                />
                                <label 
                                  htmlFor="toggle-dimensions"
                                  className="block h-6 overflow-hidden rounded-full bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 cursor-pointer peer-checked:bg-[#7A1CAC]"
                                >
                                  <span className="absolute transform transition-transform duration-200 h-4 w-4 rounded-full bg-white top-1 left-1 peer-checked:translate-x-4"></span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </section>
                        
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                            <Compass size={16} className="mr-2" />
                            Navigation
                          </h3>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <button className="p-2 rounded-lg border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 hover:bg-[#EBD3F8]/10 text-[#2E073F] dark:text-[#EBD3F8]">
                              <div className="mb-1 flex justify-center">
                                <Box size={16} />
                              </div>
                              <span className="text-xs">Kitchen</span>
                            </button>
                            
                            <button className="p-2 rounded-lg border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 hover:bg-[#EBD3F8]/10 text-[#2E073F] dark:text-[#EBD3F8]">
                              <div className="mb-1 flex justify-center">
                                <Box size={16} />
                              </div>
                              <span className="text-xs">Living Room</span>
                            </button>
                            
                            <button className="p-2 rounded-lg border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 hover:bg-[#EBD3F8]/10 text-[#2E073F] dark:text-[#EBD3F8]">
                              <div className="mb-1 flex justify-center">
                                <Box size={16} />
                              </div>
                              <span className="text-xs">Bedroom</span>
                            </button>
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                )}
                
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                        <Settings size={16} className="mr-2" />
                        Display Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-[#2E073F] dark:text-[#EBD3F8] mb-1">
                            Wall Height
                          </label>
                          <input 
                            type="range" 
                            min="8" 
                            max="12" 
                            defaultValue="9"
                            className="w-full h-2 bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 rounded-lg appearance-none cursor-pointer accent-[#7A1CAC]"
                          />
                          <div className="flex justify-between text-xs text-[#2E073F]/60 dark:text-[#EBD3F8]/60 mt-1">
                            <span>8 ft</span>
                            <span>10 ft</span>
                            <span>12 ft</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-[#2E073F] dark:text-[#EBD3F8] mb-1">
                            Render Quality
                          </label>
                          <select className="w-full p-2 text-sm rounded-lg border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 bg-white dark:bg-[#2E073F] text-[#2E073F] dark:text-[#EBD3F8] focus:outline-none focus:ring-1 focus:ring-[#7A1CAC]">
                            <option>High (Best visual quality)</option>
                            <option selected>Medium (Recommended)</option>
                            <option>Low (Best performance)</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">Auto-place Furniture</span>
                          <div className="relative inline-block w-10 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id="toggle-auto-furniture" 
                              className="sr-only peer"
                              defaultChecked
                            />
                            <label 
                              htmlFor="toggle-auto-furniture"
                              className="block h-6 overflow-hidden rounded-full bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 cursor-pointer peer-checked:bg-[#7A1CAC]"
                            >
                              <span className="absolute transform transition-transform duration-200 h-4 w-4 rounded-full bg-white top-1 left-1 peer-checked:translate-x-4"></span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">Save Changes Automatically</span>
                          <div className="relative inline-block w-10 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id="toggle-auto-save" 
                              className="sr-only peer"
                              defaultChecked
                            />
                            <label 
                              htmlFor="toggle-auto-save"
                              className="block h-6 overflow-hidden rounded-full bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/20 cursor-pointer peer-checked:bg-[#7A1CAC]"
                            >
                              <span className="absolute transform transition-transform duration-200 h-4 w-4 rounded-full bg-white top-1 left-1 peer-checked:translate-x-4"></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
        
        {/* Main 3D view area */}
        <div className="flex-1 relative bg-[#F5F0F9] dark:bg-[#1A0326] flex items-center justify-center overflow-hidden">
          {/* Display the walkthrough when in first person mode, otherwise show preview image */}
          {previewImage && !isLoading ? (
            viewMode === "firstPerson" ? (
              <WalkthroughViewer 
                modelPath={modelPath} 
                showFurniture={showFurniture} 
                showDimensions={showDimensions}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={previewImage} 
                  alt={projectName || "Floor plan"} 
                  className="max-w-[90%] max-h-[90%] object-contain"
                />
                <div className="absolute bottom-6 left-6 bg-white dark:bg-[#2E073F] px-3 py-1 rounded-md text-xs text-[#7A1CAC] font-medium shadow-md">
                  Top Down View
                </div>
              </div>
            )
          ) : (
            // Show default walkthrough when no image is uploaded
            viewMode === "firstPerson" ? (
              <WalkthroughViewer 
                modelPath={modelPath} 
                showFurniture={showFurniture} 
                showDimensions={showDimensions}
              />
            ) : (
              // Placeholder when no image is uploaded and not in first person mode
              <div className="text-center px-6">
                <div className="w-32 h-32 bg-[#7A1CAC]/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Box className="h-12 w-12 text-[#7A1CAC]" />
                </div>
                <h2 className="text-xl font-bold text-[#2E073F] dark:text-white mb-2">
                  {isLoading ? "Processing your floor plan..." : "Upload a floor plan to begin"}
                </h2>
                <p className="text-sm text-[#2E073F]/70 dark:text-[#EBD3F8]/70 max-w-md">
                  {isLoading 
                    ? "We're converting your 2D plan into an interactive 3D model." 
                    : "Upload your floor plan to see it transformed into an immersive 3D environment you can explore."}
                </p>
                <p className="text-sm text-[#7A1CAC] mt-2">
                  Switch to "First Person" mode to explore the demo environment.
                </p>
                
                {!isLoading && (
                  <button 
                    onClick={triggerFileUpload} 
                    className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-[#7A1CAC] text-white text-sm font-medium hover:bg-[#AD49E1] transition-colors"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Floor Plan
                  </button>
                )}
              </div>
            )
          )}
          
          {/* Mobile controls for collapsed state */}
          {isMobile && collapsed && !isLoading && (
            <div className="absolute bottom-24 right-6 flex flex-col gap-2">
              <button 
                onClick={triggerFileUpload}
                className="w-12 h-12 rounded-full bg-[#7A1CAC] text-white flex items-center justify-center shadow-md"
              >
                <Upload size={20} />
              </button>
            </div>
          )}
          
          {/* Controls overlay */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2E073F] text-[#7A1CAC] flex items-center justify-center shadow-md hover:bg-[#EBD3F8]/30 dark:hover:bg-[#7A1CAC]/20">
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
        
        {/* Mobile quick save button */}
        {isMobile && collapsed && currentUser && previewImage && !isLoading && (
          <div className="absolute bottom-40 right-6 flex flex-col gap-2">
            <button 
              onClick={saveCurrentProject}
              disabled={isSaving}
              className="w-12 h-12 rounded-full bg-[#7A1CAC] text-white flex items-center justify-center shadow-md"
            >
              {isSaving ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
