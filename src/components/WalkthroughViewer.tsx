import { useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  PointerLockControls, 
  Environment, 
  useGLTF, 
  Stats,
  Text,
  OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import { Keyboard } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

const DEFAULT_MODEL_PATH = '/assets/models/scene.gltf';

interface RoomDimension {
  position: [number, number, number];
  text: string;
}

interface WalkthroughViewerProps {
  modelPath?: string;
  viewMode?: "firstPerson" | "topDown";
  rotationAngle?: number;
}

export function WalkthroughViewer({ 
  modelPath = DEFAULT_MODEL_PATH,
  viewMode = "firstPerson",
  rotationAngle = 0
}: WalkthroughViewerProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  // Use rotationAngle prop as the initial value for modelRotation
  const [modelRotation, setModelRotation] = useState(rotationAngle);
  const [isRotating, setIsRotating] = useState(false);

  // If the parent changes rotationAngle, update modelRotation
  useEffect(() => {
    setModelRotation(rotationAngle);
  }, [rotationAngle]);

  const isDefaultModel = modelPath === DEFAULT_MODEL_PATH;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const timer = setTimeout(() => setShowControls(false), 5000);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  // Smooth rotation function
  const rotateModel = () => {
    if (isRotating) return; // Prevent multiple rotation calls
    
    setIsRotating(true);
    const targetRotation = (modelRotation + Math.PI/2) % (Math.PI * 2);
    
    // Animate rotation smoothly
    const startTime = Date.now();
    const duration = 800; // Duration in milliseconds
    const startRotation = modelRotation;
    
    const animateRotation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      // Calculate current rotation based on progress
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOutCubic;
      setModelRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        // Snap to exact target rotation when done
        setModelRotation(targetRotation);
        setIsRotating(false);
      }
    };
    
    requestAnimationFrame(animateRotation);
  };

  return (
    <div className="relative w-full h-full">
      <ErrorBoundary>
        <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
          <Scene 
            modelPath={modelPath}
            viewMode={viewMode}
            modelRotation={modelRotation}
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
      {/* Rotation control button - KEEPING THIS ONE */}
      {isLoaded && (
        <button 
          onClick={rotateModel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-[#2E073F] text-[#7A1CAC] flex items-center justify-center shadow-md hover:bg-[#EBD3F8]/30 dark:hover:bg-[#7A1CAC]/20"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 2v6h-6"></path>
            <path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path>
          </svg>
        </button>
      )}
      {/* Controls hint overlay */}
      {isLoaded && showControls && viewMode === "firstPerson" && (
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

interface SceneProps {
  modelPath: string;
  viewMode: "firstPerson" | "topDown";
  modelRotation: number;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
}

function Scene({ modelPath, viewMode, modelRotation, onProgress, onLoaded }: SceneProps) {
  const { camera } = useThree();
  const prevViewMode = useRef(viewMode);
  const prevRotation = useRef(modelRotation);

  // Camera rotation logic
  useEffect(() => {
    if (prevRotation.current !== modelRotation) {
      const rotationInRadians = modelRotation;
      if (viewMode === "firstPerson") {
        const distanceFromOrigin = Math.sqrt(
          camera.position.x * camera.position.x + 
          camera.position.z * camera.position.z
        );
        camera.position.x = Math.sin(rotationInRadians) * distanceFromOrigin;
        camera.position.z = Math.cos(rotationInRadians) * distanceFromOrigin;
        camera.lookAt(0, camera.position.y, 0);
      }
      prevRotation.current = modelRotation;
    }
  }, [camera, modelRotation, viewMode]);

  // Camera view mode logic
  useEffect(() => {
    if (viewMode === "firstPerson") {
      if (prevViewMode.current === "topDown") {
        const startPos = new THREE.Vector3(0, 20, 0);
        const endPos = new THREE.Vector3(0, 1.7, 5);
        const startRot = new THREE.Euler(-Math.PI/2, 0, 0);
        const endRot = new THREE.Euler(0, 0, 0);
        const duration = 1500;
        const startTime = Date.now();
        const animate = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          camera.position.lerpVectors(startPos, endPos, easeProgress);
          const x = startRot.x + (endRot.x - startRot.x) * easeProgress;
          const y = startRot.y + (endRot.y - startRot.y) * easeProgress;
          const z = startRot.z + (endRot.z - startRot.z) * easeProgress;
          camera.rotation.set(x, y, z);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            camera.position.copy(endPos);
            camera.rotation.copy(endRot);
            camera.lookAt(0, 1.7, 0);
          }
        };
        animate();
      } else {
        camera.position.set(0, 1.7, 5);
        camera.lookAt(0, 1.7, 0);
      }
    } else if (viewMode === "topDown") {
      const startPos = camera.position.clone();
      const endPos = new THREE.Vector3(0, 20, 0);
      const startRot = camera.rotation.clone();
      const endRot = new THREE.Euler(-Math.PI/2, 0, 0);
      const duration = 1500;
      const startTime = Date.now();
      const animate = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(startPos, endPos, easeProgress);
        const x = startRot.x + (endRot.x - startRot.x) * easeProgress;
        const y = startRot.y + (endRot.y - startRot.y) * easeProgress;
        const z = startRot.z + (endRot.z - startRot.z) * easeProgress;
        camera.rotation.set(x, y, z);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          camera.position.copy(endPos);
          camera.rotation.copy(endRot);
        }
      };
      animate();
    }
    prevViewMode.current = viewMode;
  }, [camera, viewMode]);

  // Set showDimensions to false (or true if you want to show them)
  const showDimensions = false;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight 
        intensity={1.2} 
        position={[10, 10, 5]} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment preset="apartment" />
      <Model 
        path={modelPath}
        rotation={modelRotation}
        onProgress={onProgress}
        onLoaded={onLoaded}
      />
      <gridHelper args={[100, 100, '#AD49E1', '#7A1CAC']} position={[0, 0, 0]} />
      {showDimensions && <DimensionLabels />}
      {viewMode === "firstPerson" ? (
        <FirstPersonController />
      ) : (
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={false}
          minDistance={5}
          maxDistance={50}
        />
      )}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </>
  );
}

interface ModelProps {
  path: string;
  rotation: number;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
}

function Model({ path, rotation, onProgress, onLoaded }: ModelProps) {
  const [error, setError] = useState<string | null>(null);
  const model = useRef<THREE.Group | null>(null);
  const initialSetupDone = useRef(false);
  const modelCenter = useRef(new THREE.Vector3(0, 0, 0));
  const modelDimensions = useRef({ width: 0, height: 0, depth: 0 });
  
  // Important: Properly handle model path changes by adding path to the gltf dependency array
  const { scene: gltfScene } = useGLTF(path, true);
  
  // Reset initialization flag when path changes
  useEffect(() => {
    // Reset when model path changes
    initialSetupDone.current = false;
    console.log("Model path changed:", path);
    
    // Clean up previous model
    if (model.current) {
      // Remove children to avoid memory leaks
      while (model.current.children.length > 0) {
        model.current.remove(model.current.children[0]);
      }
    }
    
    // Reset error state
    setError(null);
  }, [path]);
  
  // Set up progress monitoring
  useEffect(() => {
    onProgress(0);
    const timer = setTimeout(() => {
      onProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, [onProgress]);

  // Initial model setup - run only once per model path
  useEffect(() => {
    try {
      if (gltfScene && !initialSetupDone.current) {
        console.log("Setting up new model:", path);
        
        // Clone the scene to avoid modifying the cached original
        const newModelScene = gltfScene.clone();
        
        if (newModelScene) {
          // Enable shadows
          newModelScene.traverse((node: THREE.Object3D) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          // Calculate bounding box to position model correctly
          const boundingBox = new THREE.Box3().setFromObject(newModelScene);
          
          // Store dimensions for future reference
          modelDimensions.current = {
            width: boundingBox.max.x - boundingBox.min.x,
            height: boundingBox.max.y - boundingBox.min.y,
            depth: boundingBox.max.z - boundingBox.min.z
          };
          
          // Calculate the center of the model
          boundingBox.getCenter(modelCenter.current);
          
          // Center the model on the grid (0,0,0)
          newModelScene.position.x = -modelCenter.current.x;
          newModelScene.position.y = -boundingBox.min.y; // Place on floor
          newModelScene.position.z = -modelCenter.current.z;
          
          // Create a parent group that will handle the rotation
          const group = new THREE.Group();
          group.add(newModelScene);
          model.current = group;
          
          // Log dimensions for debugging
          console.log(`Model centered at (${modelCenter.current.x.toFixed(2)}, ${modelCenter.current.y.toFixed(2)}, ${modelCenter.current.z.toFixed(2)})`);
          console.log(`Model dimensions: ${modelDimensions.current.width.toFixed(2)} x ${modelDimensions.current.height.toFixed(2)} x ${modelDimensions.current.depth.toFixed(2)}`);
          
          initialSetupDone.current = true;
        }
      }
    } catch (err) {
      console.error("Error processing model:", err);
      setError(err instanceof Error ? err.message : "Failed to process 3D model");
    }
    
    // Mark as loaded regardless of success/failure to avoid infinite loading state
    onLoaded();
  }, [gltfScene, path, onLoaded]);

  // Apply rotation in place - this runs whenever rotation changes
  useEffect(() => {
    if (model.current) {
      // Simply apply the rotation around Y axis (vertical)
      model.current.rotation.y = rotation;
    }
  }, [rotation]);

  // Fallback if error or model not loaded
  if (error || !model.current) {
    console.warn("Using fallback cube due to error or missing model:", error);
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7A1CAC" />
      </mesh>
    );
  }
  
  return <primitive object={model.current} />;
}

// Preload the default model to avoid initial loading issues
useGLTF.preload(DEFAULT_MODEL_PATH);

function FirstPersonController() {
  const { camera, scene } = useThree();
  const moveSpeed = 0.15;
  const keysPressed = useRef<Record<string, boolean>>({});
  const playerHeight = 1.7;
  const gravity = 0.01;
  const isGrounded = useRef(true);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const raycaster = useRef(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10));
  const [lockFailed, setLockFailed] = useState(false);
  
  // Setup key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
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

  useFrame(() => {
    if (!isGrounded.current) {
      velocity.current.y -= gravity;
    }
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
      if (camera.position.y < 0.5) {
        camera.position.y = playerHeight;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }
    const direction = new THREE.Vector3();
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
      direction.z -= moveSpeed;
    }
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
      direction.z += moveSpeed;
    }
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
      direction.x -= moveSpeed;
    }
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
      direction.x += moveSpeed;
    }
    if (direction.length() > 0) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      const moveVec = new THREE.Vector3();
      if (direction.z !== 0) moveVec.addScaledVector(forward, -direction.z);
      if (direction.x !== 0) moveVec.addScaledVector(right, direction.x);
      if (moveVec.length() > 0) {
        moveVec.normalize().multiplyScalar(moveSpeed);
        camera.position.add(moveVec);
      }
    }
    camera.position.y += velocity.current.y;
    if (camera.position.y < playerHeight) {
      camera.position.y = playerHeight;
      velocity.current.y = 0;
      isGrounded.current = true;
    }
    if (Math.abs(camera.position.y - playerHeight) > 0.01 && !keysPressed.current['Space']) {
      camera.position.y = playerHeight;
    }
  });

  // Handle pointer lock errors
  useEffect(() => {
    const handlePointerLockError = () => {
      console.log("Pointer lock failed - using alternative controls");
      setLockFailed(true);
    };
    
    document.addEventListener('pointerlockerror', handlePointerLockError);
    return () => document.removeEventListener('pointerlockerror', handlePointerLockError);
  }, []);

  // Return appropriate controls based on lock status
  return lockFailed ? (
    // Fallback to orbit controls if pointer lock fails
    <OrbitControls 
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={20}
    />
  ) : (
    <PointerLockControls />
  );
}

function DimensionLabels() {
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
