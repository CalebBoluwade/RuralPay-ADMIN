// components/preview/PhoneMockup.tsx
"use client";
import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  config: {
    primaryColor: string;
    merchantName: string;
  };
}


const PhoneFrame = ({ config }: Props) => {
  const phoneRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/iPhone17pro.glb');



  return (
    <group ref={phoneRef}>
      <primitive object={scene} />
    </group>
  );
};

useGLTF.preload('/iPhone17pro.glb');

export default function PhoneMockup({ config }: Props) {
  return (
    <div className="w-full h-[700px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 0.5], fov: 45 }}>
        <ambientLight intensity={1} />
        <Environment preset="studio" />
        <OrbitControls />
        <PhoneFrame config={config} />
      </Canvas>
    </div>
  );
}