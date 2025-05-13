import { useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  PointerLockControls, 
  Environment, 
  useGLTF, 
  Stats,
  Text
} from '@react-three/drei';
import * as THREE from 'three';
import { Keyboard } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// Update the path to match the actual file location
const DEFAULT_MODEL_PATH = '/assets/models/scene.gltf';

// Define types for props
interface WalkthroughViewerProps {
  modelPath?: string;
  showFurniture?: boolean;
  showDimensions?: boolean;
}

interface SceneProps {
  modelPath: string;
  showFurniture: boolean;
  showDimensions: boolean;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
}

interface ModelProps {
  path: string;
  showFurniture: boolean;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
}

interface RoomDimension {
  position: [number, number, number];
  text: string;
}

// Main component for 3D walkthrough viewer
export function WalkthroughViewer({ 
  modelPath = DEFAULT_MODEL_PATH, 
  showFurniture = true,
  showDimensions = false
}: WalkthroughViewerProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Check if using default model
  const isDefaultModel = modelPath === DEFAULT_MODEL_PATH;

  // Check for mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Hide controls after 5 seconds
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <ErrorBoundary>
        <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
          <Scene 
            modelPath={modelPath} 
            showFurniture={showFurniture} 
            showDimensions={showDimensions}
            onProgress={setLoadingProgress}
            onLoaded={() => setIsLoaded(true)}
          />
        </Canvas>
      </ErrorBoundary>
      
      {/* Loading overlay */}
      {loadingProgress < 100 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-[#1F042C]/70">
          <div className="w-64 h-1 rounded-full bg-white/20 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 bg-[#AD49E1]" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm">Loading environment... {Math.round(loadingProgress)}%</p>
        </div>
      )}
      
      {/* Demo warning */}
      {isDefaultModel && isLoaded && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg p-3 text-white bg-[#7A1CAC]/90 shadow-lg backdrop-blur-sm max-w-xs mx-auto">
          <div className="text-center text-sm">
            <p className="font-medium mb-1">⚠️ Demo Environment</p>
            <p className="text-xs opacity-90">Upload your own floor plan or 3D model to see your custom space</p>
          </div>
        </div>
      )}
      
      {/* Controls hint overlay */}
      {isLoaded && showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg p-3 text-white bg-[#2E073F]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <Keyboard size={20} />
            <span>{isMobile ? 'Tap and drag to look around' : 'WASD to move, Space to jump, Mouse to look around'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 3D Scene component
function Scene({ modelPath, showFurniture, showDimensions, onProgress, onLoaded }: SceneProps) {
  const { camera } = useThree();
  
  // Adjust camera position to fit the specific scene.gltf model
  useEffect(() => {
    camera.position.set(0, 1.7, 5); // Position slightly further back to view the scene
    camera.lookAt(0, 1.7, 0);
  }, [camera]);

  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        intensity={1.2} 
        position={[10, 10, 5]} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Environment (skybox) */}
      <Environment preset="apartment" />
      
      {/* Load the 3D model */}
      <Model 
        path={modelPath} 
        showFurniture={showFurniture} 
        onProgress={onProgress}
        onLoaded={onLoaded}
      />
      
      {/* Floor grid for reference - increased size to cover more space */}
      <gridHelper args={[100, 100, '#AD49E1', '#7A1CAC']} position={[0, 0, 0]} />
      
      {/* Show dimensions if enabled */}
      {showDimensions && <DimensionLabels />}
      
      {/* First person controls */}
      <FirstPersonController />
      
      {/* Performance stats (only in development) */}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </>
  );
}

// Model loading component - enhanced for scene.gltf
function Model({ path, showFurniture, onProgress, onLoaded }: ModelProps) {
  const [error, setError] = useState<string | null>(null);
  const gltf = useGLTF(path);
  const model = useRef<THREE.Group | null>(null);
  
  // Set up progress monitoring
  useEffect(() => {
    onProgress(0);
    const timer = setTimeout(() => {
      onProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, [onProgress]);
  
  // Process and position the model correctly
  useEffect(() => {
    try {
      if (gltf && gltf.scene) {
        // Clone the scene to avoid modifying the cached original
        model.current = gltf.scene.clone();
        
        if (model.current) {
          // Enable shadows and process materials
          model.current.traverse((node: THREE.Object3D) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              // Hide furniture if needed
              if (!showFurniture && node.name.toLowerCase().includes('furniture')) {
                node.visible = false;
              }
            }
          });

          // Calculate bounding box to position model on the floor
          const boundingBox = new THREE.Box3().setFromObject(model.current);
          const modelHeight = boundingBox.max.y - boundingBox.min.y;
          const modelWidth = boundingBox.max.x - boundingBox.min.x;
          const modelDepth = boundingBox.max.z - boundingBox.min.z;
          
          // Position the model so its bottom sits at y=0 (the floor)
          model.current.position.y = -boundingBox.min.y;
          
          // Center the model horizontally for better viewing
          model.current.position.x = -boundingBox.min.x - modelWidth / 2;
          model.current.position.z = -boundingBox.min.z - modelDepth / 2;
          
          // Log the size for debugging
          console.log(`Model dimensions: ${modelWidth.toFixed(2)} x ${modelHeight.toFixed(2)} x ${modelDepth.toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error("Error processing model:", err);
      setError(err instanceof Error ? err.message : "Failed to process 3D model");
    }
    
    onLoaded();
  }, [gltf, showFurniture, onLoaded]);
  
  // Clean up function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up Three.js resources when component unmounts
      if (gltf && gltf.scene) {
        gltf.scene.traverse((object: THREE.Object3D) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [gltf]);
  
  // Display fallback if there's an error or no model
  if (error || !model.current) {
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7A1CAC" />
      </mesh>
    );
  }
  
  return <primitive object={model.current} />;
}

// First person controls implementation with adjusted speed for this scene
function FirstPersonController() {
  const { camera, scene } = useThree();
  const moveSpeed = 0.15;
  const keysPressed = useRef<Record<string, boolean>>({});
  const playerHeight = 1.7; // Average eye level height in meters
  const gravity = 0.01; // Gravity force
  const isGrounded = useRef(true);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const raycaster = useRef(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10));
  
  // Setup key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      
      // Jump only when on ground
      if (e.code === 'Space' && isGrounded.current) {
        velocity.current.y = 0.2; // Jump force
        isGrounded.current = false;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Set initial position at player height
    camera.position.y = playerHeight;
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera]);
  
  // Animation loop for movement with physics
  useFrame(() => {
    // Apply gravity when not on ground
    if (!isGrounded.current) {
      velocity.current.y -= gravity;
    }
    
    // Check for ground collision
    raycaster.current.ray.origin.copy(camera.position);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const distance = intersects[0].distance;
      if (distance < playerHeight) {
        camera.position.y = intersects[0].point.y + playerHeight;
        velocity.current.y = 0;
        isGrounded.current = true;
      } else {
        isGrounded.current = false;
      }
    } else {
      // If no ground detected below a certain point, reset to ground level
      if (camera.position.y < 0.5) {
        camera.position.y = playerHeight;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }
    
    // Apply horizontal movement
    const direction = new THREE.Vector3();
    
    // Forward/backward movement
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
      direction.z -= moveSpeed;
    }
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
      direction.z += moveSpeed;
    }
    
    // Left/right movement
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
      direction.x -= moveSpeed;
    }
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
      direction.x += moveSpeed;
    }
    
    // Apply movement in the direction the camera is facing (but only horizontally)
    if (direction.length() > 0) {
      // Extract camera's forward direction but keep it horizontal
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      
      // Calculate right vector from forward
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      
      // Move based on input
      const moveVec = new THREE.Vector3();
      if (direction.z !== 0) moveVec.addScaledVector(forward, -direction.z);
      if (direction.x !== 0) moveVec.addScaledVector(right, direction.x);
      
      // Normalize movement vector to maintain consistent speed when moving diagonally
      if (moveVec.length() > 0) {
        moveVec.normalize().multiplyScalar(moveSpeed);
        camera.position.add(moveVec);
      }
    }
    
    // Apply vertical velocity from jumping/gravity
    camera.position.y += velocity.current.y;
    
    // Prevent going below ground level
    if (camera.position.y < playerHeight) {
      camera.position.y = playerHeight;
      velocity.current.y = 0;
      isGrounded.current = true;
    }
    
    // Always maintain player height unless explicitly jumping
    if (Math.abs(camera.position.y - playerHeight) > 0.01 && !keysPressed.current['Space']) {
      camera.position.y = playerHeight;
    }
  });
  
  // Add control hint
  useEffect(() => {
    console.log("Movement Controls: WASD or Arrow Keys to move, Space to jump");
  }, []);
  
  return <PointerLockControls />;
}

// Dimension labels for rooms - adjusted for scene.gltf layout
function DimensionLabels() {
  // Adjust positions to match the scene.gltf layout
  const roomDimensions: RoomDimension[] = [
    { position: [0, 0.1, 0], text: "Main Area: 20' x 18'" },
    { position: [8, 0.1, 2], text: "Kitchen: 12' x 10'" },
    { position: [-6, 0.1, -8], text: "Bedroom: 14' x 12'" },
    { position: [6, 0.1, -8], text: "Bathroom: 8' x 6'" }
  ];
  
  return (
    <>
      {roomDimensions.map((room, index) => (
        <Text
          key={index}
          position={room.position}
          rotation={[-Math.PI / 2, 0, 0]} 
          fontSize={0.3}
          color="#AD49E1"
          anchorX="center"
          anchorY="middle"
        >
          {room.text}
        </Text>
      ))}
    </>
  );
}
