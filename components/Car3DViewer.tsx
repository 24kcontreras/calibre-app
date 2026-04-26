'use client'
import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei'
import { Car, ChevronDown } from 'lucide-react'

const MODELOS_DISPONIBLES = [
  { id: 'sedan', label: 'Sedán', file: 'sedan', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'hatchback', label: 'Hatchback', file: 'hatchback', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'suv', label: 'SUV', file: 'SUV', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'pickup', label: 'Pick-Up', file: 'pickup', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'jeep', label: 'Jeep', file: 'jeep', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'cargo', label: 'Furgón', file: 'cargo', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'stationwagon', label: 'Station', file: 'stationwagon', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'coupe', label: 'Coupé', file: 'coupe', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: 'citycar', label: 'Citycar', file: 'citycar', scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] }
]

function ModeloReal({ config, onPointerDown }: { config: any, onPointerDown: (e: any) => void }) {
  const { scene } = useGLTF(`/models/${config.file}.glb`)
  
  return (
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
  const [dropdownAbierto, setDropdownAbierto] = useState(false)

  const cambiarModelo = (nuevoTipo: string) => {
      setTipoVehiculo(nuevoTipo);
      if (setMarcadores) setMarcadores([]);
      setDropdownAbierto(false); 
  }

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (soloLectura || !setMarcadores) return;
    
    const { x, y, z } = e.point;
    setMarcadores([...marcadores, { x, y, z, tipo: tipoVehiculo }]);
  }

  const configActual = MODELOS_DISPONIBLES.find(m => m.id === tipoVehiculo) || MODELOS_DISPONIBLES[0];

  return (
    <div className="w-full h-[350px] bg-slate-900/50 rounded-2xl overflow-hidden relative shadow-inner flex flex-col">
      
      <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-slate-950/90 to-transparent p-4 flex flex-col gap-3 pointer-events-none">
        <div className="flex justify-between items-start w-full">
            <div className="bg-slate-950/90 px-3 py-1.5 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-slate-800 shadow-xl backdrop-blur-md pointer-events-auto shrink-0">
                {soloLectura ? `Inspección 360°` : 'Arrastra para girar • Toca para marcar'}
            </div>
        </div>

        {!soloLectura && (
          <div className="relative pointer-events-auto w-fit">
            <button 
              type="button"
              onClick={() => setDropdownAbierto(!dropdownAbierto)}
              className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md hover:bg-slate-800 transition-colors"
            >
              <Car size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{configActual.label}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
            </button>

            {dropdownAbierto && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {MODELOS_DISPONIBLES.map(mod => (
                    <button 
                        key={mod.id}
                        type="button"
                        onClick={() => cambiarModelo(mod.id)} 
                        className={`text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${tipoVehiculo === mod.id ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'}`}
                    >
                        {mod.label}
                    </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-0">
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