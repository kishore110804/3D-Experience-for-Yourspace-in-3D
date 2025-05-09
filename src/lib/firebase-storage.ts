import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { storage, db, auth } from "./firebase";

export interface Project {
  id: string;
  name: string;
  date: string | Date;
  previewUrl: string;
  originalImageUrl: string;
  modelUrl?: string; // URL to 3D model if uploaded
  userId: string;
  createdAt: Date;
}

// Upload a floor plan image and create a project document
export async function uploadFloorPlan(file: File, name: string): Promise<Project | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Create a reference to the file in Firebase Storage
    const userId = user.uid;
    const timestamp = Date.now();
    const storageRef = ref(storage, `floorplans/${userId}/${timestamp}_${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Create a project document in Firestore
    const projectData = {
      name: name || `Project ${timestamp}`,
      originalImageUrl: downloadURL,
      previewUrl: downloadURL, // Using same URL for both for now
      userId,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "projects"), projectData);
    
    return {
      id: docRef.id,
      ...projectData,
      date: new Date(),
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error uploading floor plan:", error);
    return null;
  }
}

// Upload a 3D model (glTF/GLB) to Firebase Storage
export async function upload3DModel(file: File, projectId: string): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Create a reference to the file in Firebase Storage
    const userId = user.uid;
    const timestamp = Date.now();
    const storageRef = ref(storage, `models/${userId}/${projectId}/${timestamp}_${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // If this is for an existing project, update the project record
    if (projectId) {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        modelUrl: downloadURL,
        lastUpdated: serverTimestamp()
      });
    }
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading 3D model:", error);
    return null;
  }
}

// Fetch all projects for the current user
export async function getUserProjects(): Promise<Project[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userId = user.uid;
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        name: data.name,
        previewUrl: data.previewUrl,
        originalImageUrl: data.originalImageUrl,
        modelUrl: data.modelUrl,
        userId: data.userId,
        date: data.createdAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    // Sort by creation date (newest first)
    return projects.sort((a, b) => {
      if (a.createdAt instanceof Date && b.createdAt instanceof Date) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
}

// Get a single project by ID
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("__name__", "==", projectId));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      name: data.name,
      previewUrl: data.previewUrl,
      originalImageUrl: data.originalImageUrl,
      modelUrl: data.modelUrl,
      userId: data.userId,
      date: data.createdAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

// Save or update a project
export async function saveProject(projectData: Partial<Project>, existingProjectId?: string): Promise<Project | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userId = user.uid;
    
    // If updating an existing project
    if (existingProjectId) {
      const projectRef = doc(db, "projects", existingProjectId);
      
      const updateData = {
        ...projectData,
        lastUpdated: serverTimestamp(),
      };
      
      await updateDoc(projectRef, updateData);
      
      // Get the updated project
      return await getProjectById(existingProjectId);
    }
    // Creating a new project
    else {
      const newProjectData = {
        name: projectData.name || `Project ${Date.now()}`,
        previewUrl: projectData.previewUrl || "",
        originalImageUrl: projectData.originalImageUrl || "",
        modelUrl: projectData.modelUrl || "",
        userId,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "projects"), newProjectData);
      
      return {
        id: docRef.id,
        ...newProjectData,
        date: new Date(),
        createdAt: new Date()
      };
    }
  } catch (error) {
    console.error("Error saving project:", error);
    return null;
  }
}
