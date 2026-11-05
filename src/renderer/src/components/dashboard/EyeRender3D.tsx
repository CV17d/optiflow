import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'

interface EyeballProps {
  ear?: number
}

const Eyeball: React.FC<EyeballProps> = ({ ear = 0.28 }) => {
  const groupRef = useRef<THREE.Group>(null)

  // Animación de flotación sutil y movimiento ocular biométrico
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime()
      // Rotación y flotación suave
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.25
      groupRef.current.rotation.x = Math.cos(t * 0.8) * 0.12

      // Escalar sutilmente en Y según el EAR (simulación de apertura/parpadeo de párpado)
      const clampedEar = Math.max(0.15, Math.min(0.35, ear))
      const scaleY = 0.85 + (clampedEar - 0.15) * 1.2
      groupRef.current.scale.set(1, scaleY, 1)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Esclerótica (Globo ocular blanco con sutil tono azulado y brillo realista) */}
      <Sphere args={[1.2, 64, 64]}>
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.2}
          metalness={0.05}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </Sphere>

      {/* Iris Biométrico (Tono azul cian profundo y futurista) */}
      <Sphere args={[0.55, 32, 32]} position={[0, 0, 0.95]}>
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.2}
        />
      </Sphere>

      {/* Pupila Central (Negro profundo) */}
      <Sphere args={[0.26, 32, 32]} position={[0, 0, 1.15]}>
        <meshBasicMaterial color="#020617" />
      </Sphere>

      {/* Brillo especular corneal (Reflejo de luz frontal) */}
      <Sphere args={[0.08, 16, 16]} position={[0.16, 0.16, 1.22]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.04, 16, 16]} position={[-0.12, -0.1, 1.21]}>
        <meshBasicMaterial color="#bae6fd" />
      </Sphere>
    </group>
  )
}

export interface EyeRender3DProps {
  ear?: number
}

export const EyeRender3D: React.FC<EyeRender3DProps> = ({ ear = 0.28 }) => {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 3]} intensity={1.6} />
        <directionalLight position={[-3, -2, -2]} color="#06b6d4" intensity={0.7} />
        <pointLight position={[0, 0, 2]} color="#38bdf8" intensity={0.5} />

        <Eyeball ear={ear} />

        {/* Controles orbitales con zoom desactivado */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  )
}

export default EyeRender3D
