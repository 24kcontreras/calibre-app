'use client'
import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei'
import { Car, Truck, Zap, Bus } from 'lucide-react'

// 🔥 EL PANEL DE CONTROL MAESTRO
// Aquí puedes corregir CUALQUIER auto sin tocar Blender.
// rotation: [x, y, z]. Para girarlo a los lados cambia el número de al medio (la Y). 
// Math.PI / 2 = 90 grados | Math.PI = 180 grados | -Math.PI / 2 = -90 grados
const MODELOS_DISPONIBLES = [
  { id: 'sedan', label: 'Sedán', file: 'sedan', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'hatchback', label: 'Hatch', file: 'hatchback', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'suv', label: 'SUV', file: 'SUV', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'pickup', label: 'Pick-Up', file: 'pickup', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'jeep', label: 'Jeep', file: 'jeep', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'cargo', label: 'Furgón', file: 'cargo', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'stationwagon', label: 'Station', file: 'stationwagon', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'coupe', label: 'Coupé', file: 'coupe', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'citycar', label: 'Citycar', file: 'citycar', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] }
]

// 🚗 COMPONENTE QUE CARGA EL ARCHIVO .GLB REAL CON SUS AJUSTES
function ModeloReal({ config, onPointerDown }: { config: any, onPointerDown: (e: any) => void }) {
  const { scene } = useGLTF(`/models/${config.file}.glb`)
  
  return (
    // Aplicamos la rotación, escala y posición específica del auto seleccionado
    <group 
      onPointerDown={onPointerDown} 
      position={config.position as [number, number, number]} 
      rotation={config.rotation as [number, number, number]} 
      scale={config.scale}
    >
      <primitive object={scene} />
    </group>
  )
}

function Cargando3D() {
  return (
    <Html center>
      <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse whitespace-nowrap bg-slate-900/90 px-4 py-2 rounded-full border border-emerald-500/50 shadow-xl">
        Cargando Vehículo...
      </div>
    </Html>
  )
}

export default function Car3DViewer({ marcadores, setMarcadores, soloLectura = false }: { marcadores: any[], setMarcadores?: (m: any) => void, soloLectura?: boolean }) {
  
  const autoGuardado = marcadores.length > 0 ? marcadores[0].tipo : 'sedan';
  const [tipoVehiculo, setTipoVehiculo] = useState(autoGuardado)

  const cambiarModelo = (nuevoTipo: string) => {
      setTipoVehiculo(nuevoTipo);
      if (setMarcadores) setMarcadores([]);
  }

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (soloLectura || !setMarcadores) return;
    
    const { x, y, z } = e.point;
    setMarcadores([...marcadores, { x, y, z, tipo: tipoVehiculo }]);
  }

  const configActual = MODELOS_DISPONIBLES.find(m => m.id === tipoVehiculo) || MODELOS_DISPONIBLES[0];

  return (
    <div className="w-full h-[350px] bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner border border-slate-800 flex flex-col">
      
      <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-slate-950/90 to-transparent p-3 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-start w-full">
            <div className="bg-slate-950/90 px-3 py-1.5 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-slate-800 shadow-xl backdrop-blur-md pointer-events-auto shrink-0">
                {soloLectura ? `Inspección 360° • ${configActual.label}` : 'Arrastra para girar • Toca para marcar'}
            </div>
            
            {marcadores.length > 0 && !soloLectura && (
                <div className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-500/50 pointer-events-auto backdrop-blur-md">
                    {marcadores.length} Daños
                </div>
            )}
        </div>

        {!soloLectura && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar-dark pb-2 pointer-events-auto w-full snap-x mt-1">
            {MODELOS_DISPONIBLES.map(mod => (
                <button 
                    key={mod.id}
                    onClick={() => cambiarModelo(mod.id)} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 snap-start transition-colors font-black text-[9px] uppercase tracking-widest ${tipoVehiculo === mod.id ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900/80 text-slate-400 border border-slate-700/50 hover:bg-slate-800 backdrop-blur-md'}`}
                >
                    <Car size={12} /> {mod.label}
                </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-0">
        {/* 🔥 LA CÁMARA SIEMPRE INICIA EN ESTA POSICIÓN FIJA (X=5, Y=3, Z=6) */}
        <Canvas camera={{ position: [5, 3, 6], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
          <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={1} />
          <Environment preset="city" />

          <Suspense fallback={<Cargando3D />}>
            <ModeloReal config={configActual} onPointerDown={handlePointerDown} />
            <ContactShadows position={[0, -0.05, 0]} opacity={0.6} scale={15} blur={2.5} far={4} />
          </Suspense>

          {marcadores.map((m, i) => (
            <mesh key={i} position={[m.x, m.y, m.z]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
            </mesh>
          ))}
          
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} enableZoom={true} minDistance={3} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  )
}