"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current!.appendChild(renderer.domElement);

    // Bubble-like spheres floating upward
    const bubbleCount = 100;
    const bubbles: THREE.Mesh[] = [];

    const bubbleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const bubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.4,
    });

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.x = (Math.random() - 0.5) * 20;
      bubble.position.y = (Math.random() - 0.5) * 10;
      bubble.position.z = (Math.random() - 0.5) * 30;
      bubble.userData.velocity = Math.random() * 0.01 + 0.005;
      bubbles.push(bubble);
      scene.add(bubble);
    }

    // Subtle mouse-controlled bubble
    const controlBubbleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const controlBubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.4,
    });
    const controlBubble = new THREE.Mesh(controlBubbleGeometry, controlBubbleMaterial);
    controlBubble.position.z = 0;
    scene.add(controlBubble);

    const pointer = new THREE.Vector2();
    const updateControlBubblePosition = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      controlBubble.position.x = pointer.x * 5;
      controlBubble.position.y = pointer.y * 3;
    };
    window.addEventListener("mousemove", updateControlBubblePosition);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 1, 1);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      bubbles.forEach((bubble) => {
        bubble.position.y += bubble.userData.velocity;
        if (bubble.position.y > 10) {
          bubble.position.y = -10;
          bubble.position.x = (Math.random() - 0.5) * 20;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      mountRef.current!.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", updateControlBubblePosition);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10" />;
}