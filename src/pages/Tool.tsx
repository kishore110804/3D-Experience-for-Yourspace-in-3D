import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Upload,  
  Eye, 
  Settings,
  PanelLeft,  
  HelpCircle,
  Maximize2,
  RefreshCw,
  X,
  Save,
  FileUp,
  Minimize2
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
  const [viewMode, setViewMode] = useState<"firstPerson" | "topDown">("firstPerson");
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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [modelUploadError, setModelUploadError] = useState<string | null>(null);

  // Handle fullscreen toggling - helps with Pointer Lock API issues
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error(`Error enabling fullscreen: ${err.message}`));
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error(`Error exiting fullscreen: ${err.message}`));
      }
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Enhanced model upload handler with better error handling
  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setModelUploadError(null);
    
    // File validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    // Accept files regardless of MIME type if they have the right extension
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setModelUploadError("Invalid file type. Please upload a glTF/GLB file.");
      return;
    }
    
    if (file.size > maxSize) {
      setModelUploadError("File is too large. Maximum size is 50MB.");
      return;
    }
    
    // Create a URL for the uploaded file for immediate preview
    try {
      const objectUrl = URL.createObjectURL(file);
      setModelPath(objectUrl);
      
      // If projectName is empty, use file name without extension
      if (!projectName) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setProjectName(fileName || "New 3D Model");
      }
      
      // Start processing
      setIsLoading(true);
      startLoading();
      
      // Upload to Firebase if user is logged in and we have a project ID
      if (currentUser) {
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
          setModelUploadError("Error uploading 3D model. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error creating object URL:", error);
      setModelUploadError("Error processing 3D model. Please try again.");
    } finally {
      setIsLoading(false);
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
                    {/* Combined upload section with clear OR choice */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                        <Upload size={16} className="mr-2" />
                        Create Your Project
                      </h3>
                      
                      {/* Project name input - SINGLE FIELD */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Project name"
                          className="flex-1 py-2 px-4 border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/30 rounded-lg bg-white dark:bg-[#2E073F]/50 text-[#2E073F] dark:text-white text-sm"
                        />
                      </div>
                      
                      <div className="p-3 bg-[#EBD3F8]/20 dark:bg-[#7A1CAC]/10 rounded-lg">
                        <p className="text-xs text-center text-[#2E073F]/90 dark:text-[#EBD3F8]/90 mb-3">
                          Upload a floor plan image OR a 3D model to create your project
                        </p>
                        
                        <div className="flex flex-col gap-3">
                          {/* Hidden file inputs */}
                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                          />
                          
                          <input 
                            type="file"
                            ref={modelInputRef}
                            onChange={handleModelUpload}
                            accept=".glb,.gltf"
                            className="hidden"
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
                          
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/30"></div>
                            <span className="text-xs font-medium text-[#2E073F]/60 dark:text-[#EBD3F8]/60">OR</span>
                            <div className="h-px flex-1 bg-[#EBD3F8]/30 dark:bg-[#7A1CAC]/30"></div>
                          </div>
                          
                          <button 
                            onClick={triggerModelUpload}
                            className="w-full py-2 px-4 bg-[#7A1CAC] hover:bg-[#AD49E1] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center border-2 border-[#AD49E1] shadow-md"
                          >
                            <FileUp size={16} className="mr-2" />
                            Upload 3D Model
                          </button>
                          
                          <div className="flex justify-between text-xs text-center text-[#2E073F]/60 dark:text-[#EBD3F8]/60">
                            <span>Images: JPG, PNG, PDF (max 20MB)</span>
                            <span>Models: glTF, GLB (max 50MB)</span>
                          </div>
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
                      
                      {/* Loading indicator */}
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
                    
                    {/* View controls - only showing the view mode */}
                    {previewImage && !isLoading && (
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                          <Eye size={16} className="mr-2" />
                          View Mode
                        </h3>
                        
                        <div className="flex justify-center">
                          <div className="flex border border-[#EBD3F8]/30 dark:border-[#7A1CAC]/20 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => setViewMode("firstPerson")}
                              className={`px-5 py-2 text-sm ${
                                viewMode === "firstPerson" 
                                  ? "bg-[#7A1CAC] text-white" 
                                  : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8]"
                              }`}
                            >
                              First Person
                            </button>
                            <button 
                              onClick={() => setViewMode("topDown")}
                              className={`px-5 py-2 text-sm ${
                                viewMode === "topDown" 
                                  ? "bg-[#7A1CAC] text-white" 
                                  : "bg-transparent text-[#2E073F] dark:text-[#EBD3F8]"
                              }`}
                            >
                              Top Down
                            </button>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                )}
                
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#2E073F] dark:text-white flex items-center">
                        <Settings size={16} className="mr-2" />
                        Settings
                      </h3>
                      
                      <div className="p-4 rounded-lg bg-[#EBD3F8]/20 dark:bg-[#7A1CAC]/10 text-center">
                        <p className="text-sm text-[#2E073F] dark:text-[#EBD3F8]">
                          Your projects are automatically saved when you make changes.
                        </p>
                      </div>
                      
                      {/* Add any real settings here as they become available */}
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
        
        {/* Main 3D view area */}
        <div 
          ref={fullscreenRef}
          className="flex-1 relative bg-[#F5F0F9] dark:bg-[#1A0326] flex items-center justify-center overflow-hidden"
        >
          {/* Always use WalkthroughViewer and pass the viewMode prop instead of conditionally rendering */}
          {previewImage && !isLoading ? (
            <WalkthroughViewer 
              modelPath={modelPath}
              viewMode={viewMode} 
            />
          ) : (
            // Show default walkthrough when no image is uploaded
            <WalkthroughViewer 
              modelPath={modelPath}
              viewMode={viewMode}
            />
          )}
          
          {/* View mode indicator for top down */}
          {viewMode === "topDown" && (
            <div className="absolute bottom-6 left-6 px-3 py-1 text-xs font-medium text-[#7A1CAC] bg-white dark:bg-[#2E073F] rounded-md shadow-md">
              Top Down View
            </div>
          )}
          
          {/* Fullscreen button - REPOSITIONED TO BOTTOM */}
          <button 
            onClick={toggleFullscreen}
            className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white dark:bg-[#2E073F] text-[#7A1CAC] flex items-center justify-center shadow-md hover:bg-[#EBD3F8]/30 dark:hover:bg-[#7A1CAC]/20"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          {/* Upload error message */}
          {modelUploadError && (
            <div className="absolute top-16 right-4 bg-red-500 text-white p-2 rounded-md shadow-md text-sm">
              {modelUploadError}
              <button 
                onClick={() => setModelUploadError(null)}
                className="ml-2 text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {/* Mobile controls for collapsed state - ADJUSTED POSITION TO AVOID OVERLAP */}
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
