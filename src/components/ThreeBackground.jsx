import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground({ current }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationRef = useRef(null);
  const isDayRef = useRef(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 15;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true,
      antialias: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    rendererRef.current = renderer;

    // Create initial scene
    const weatherElements = createWeatherElements(scene, current, true);
    
    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (time) => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      
      updateWeatherElements(weatherElements, time, current, isDayRef.current);
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      
      // Clean up geometries and materials
      weatherElements.forEach(element => {
        if (element.mesh) {
          element.mesh.geometry?.dispose();
          element.mesh.material?.dispose();
        }
        if (element.points) {
          element.points.geometry?.dispose();
          element.points.material?.dispose();
        }
        if (element.group) {
          element.group.children.forEach(child => {
            child.geometry?.dispose();
            child.material?.dispose();
          });
        }
      });
    };
  }, []);

  // Update effects when weather changes
  useEffect(() => {
    if (!sceneRef.current || !current) return;
    
    // Determine if it's day or night
    const now = Math.floor(Date.now() / 1000);
    const isDay = now > current.sunrise && now < current.sunset;
    isDayRef.current = isDay;
    
    updateWeatherEffects(sceneRef.current, current, isDay);
  }, [current]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// Create different weather elements
function createWeatherElements(scene, current, isDay = true) {
  const elements = [];

  // Clear existing elements
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // Lighting based on day/night
  if (isDay) {
    // Day lighting - bright and warm
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffeb3b,
      transparent: true,
      opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(8, 6, -5);
    scene.add(sun);
    elements.push({ type: 'sun', mesh: sun });

  } else {
    // Night lighting - dark and cool
    const ambientLight = new THREE.AmbientLight(0x1a237e, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x3949ab, 0.5);
    directionalLight.position.set(-5, 5, 5);
    scene.add(directionalLight);

    // Moon
    const moonGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8eaf6,
      transparent: true,
      opacity: 0.8
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-8, 6, -5);
    scene.add(moon);
    elements.push({ type: 'moon', mesh: moon });

    // Stars
    const stars = createStars();
    scene.add(stars);
    elements.push({ type: 'stars', points: stars });
  }

  // Main temperature sphere (represents Earth)
  const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({ 
    color: getTemperatureColor(current?.temp || 20, isDay),
    transparent: true,
    opacity: 0.9,
    shininess: 30
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.y = 1;
  scene.add(sphere);
  elements.push({ type: 'sphere', mesh: sphere });

  // Atmosphere particles
  const atmosphere = createAtmosphere(isDay);
  scene.add(atmosphere);
  elements.push({ type: 'atmosphere', points: atmosphere });

  // Cloud layers if applicable
  if (current?.clouds > 20) {
    const cloudGroup = createClouds(current.clouds, isDay);
    scene.add(cloudGroup);
    elements.push({ type: 'clouds', group: cloudGroup });
  }

  // Rain particles if raining
  if (current?.weather?.some(w => w.main.toLowerCase().includes('rain'))) {
    const rainGroup = createRain(isDay);
    scene.add(rainGroup);
    elements.push({ type: 'rain', group: rainGroup });
  }

  // Add some terrain features
  const terrain = createTerrain(isDay);
  scene.add(terrain);
  elements.push({ type: 'terrain', group: terrain });

  return elements;
}

// Create stars for night scene
function createStars() {
  const starCount = 200;
  const starsGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount * 3; i += 3) {
    const radius = 8 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);
    
    sizes[i / 3] = Math.random() * 0.1 + 0.05;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  return new THREE.Points(starsGeometry, starsMaterial);
}

// Create atmosphere particles
function createAtmosphere(isDay) {
  const particleCount = 300;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 2.5 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);
    
    const color = new THREE.Color();
    if (isDay) {
      color.setHSL(0.6, 0.8, 0.7 + Math.random() * 0.2);
    } else {
      color.setHSL(0.7, 0.6, 0.4 + Math.random() * 0.2);
    }
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: isDay ? 0.4 : 0.3,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(particlesGeometry, particlesMaterial);
}

// Create cloud effects
function createClouds(cloudCover, isDay) {
  const group = new THREE.Group();
  const cloudCount = Math.floor(cloudCover / 15);

  for (let i = 0; i < cloudCount; i++) {
    const cloudGeometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.6, 6, 6);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: isDay ? 0xffffff : 0xaaaaaa,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.3
    });

    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(
      (Math.random() - 0.5) * 6,
      2.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 6
    );
    group.add(cloud);
  }

  return group;
}

// Create rain effects
function createRain(isDay) {
  const group = new THREE.Group();
  const rainCount = 150;

  const rainGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 8;
    positions[i + 1] = 4 + Math.random() * 4;
    positions[i + 2] = (Math.random() - 0.5) * 8;
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: isDay ? 0x6666ff : 0xaaaaff,
    size: 0.015,
    transparent: true,
    opacity: 0.7
  });

  const rain = new THREE.Points(rainGeometry, rainMaterial);
  group.add(rain);

  return group;
}

// Create simple terrain features
function createTerrain(isDay) {
  const group = new THREE.Group();
  
  // Add some floating islands/terrain pieces
  const terrainCount = 4;
  
  for (let i = 0; i < terrainCount; i++) {
    const terrainGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 6);
    const terrainMaterial = new THREE.MeshPhongMaterial({
      color: isDay ? 0x4caf50 : 0x2e7d32,
      transparent: true,
      opacity: 0.8
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.set(
      (Math.random() - 0.5) * 10,
      -2 + Math.random() * 1,
      (Math.random() - 0.5) * 10
    );
    group.add(terrain);
  }

  return group;
}

// Update all weather elements in animation loop
function updateWeatherElements(elements, time, current, isDay) {
  const t = time * 0.001;

  elements.forEach(element => {
    switch (element.type) {
      case 'sphere':
        // Gentle floating animation with rotation
        element.mesh.position.y = 1 + Math.sin(t * 0.5) * 0.2;
        element.mesh.rotation.y = t * 0.3;
        element.mesh.rotation.x = Math.sin(t * 0.2) * 0.1;
        break;

      case 'atmosphere':
        // Slow rotation of atmosphere
        element.points.rotation.y = t * 0.1;
        element.points.rotation.x = Math.sin(t * 0.08) * 0.05;
        break;

      case 'sun':
        // Sun movement across the sky
        element.mesh.position.x = 8 * Math.cos(t * 0.05);
        element.mesh.position.y = 6 * Math.sin(t * 0.05);
        break;

      case 'moon':
        // Moon movement across the sky (opposite to sun)
        element.mesh.position.x = -8 * Math.cos(t * 0.05);
        element.mesh.position.y = 6 * Math.sin(t * 0.05);
        break;

      case 'stars':
        // Twinkling stars
        const sizes = element.points.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i++) {
          sizes[i] = 0.05 + Math.sin(t * 2 + i) * 0.03;
        }
        element.points.geometry.attributes.size.needsUpdate = true;
        element.points.rotation.y = t * 0.02;
        break;

      case 'clouds':
        // Cloud movement
        element.group.children.forEach((cloud, index) => {
          cloud.position.x += Math.sin(t * 0.1 + index) * 0.008;
          cloud.position.z += Math.cos(t * 0.08 + index) * 0.006;
          cloud.rotation.y += 0.001;
        });
        break;

      case 'rain':
        // Falling rain
        const positions = element.group.children[0].geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.08;
          if (positions[i] < -3) {
            positions[i] = 4 + Math.random() * 4;
          }
        }
        element.group.children[0].geometry.attributes.position.needsUpdate = true;
        break;

      case 'terrain':
        // Floating terrain animation
        element.group.children.forEach((terrain, index) => {
          terrain.position.y = -2 + Math.sin(t * 0.3 + index) * 0.5;
          terrain.rotation.y += 0.005;
        });
        break;
    }
  });
}

// Update visual effects based on current weather and time
function updateWeatherEffects(scene, current, isDay) {
  if (!current) return;

  const temp = current.temp;
  
  // Update sphere color based on temperature and time
  const sphere = scene.children.find(child => child.type === 'Mesh' && child.geometry.type === 'SphereGeometry');
  if (sphere) {
    sphere.material.color.set(getTemperatureColor(temp, isDay));
  }

  // Update atmosphere colors
  const atmosphere = scene.children.find(child => child.type === 'Points' && child !== scene.children.find(c => c.userData?.isStars));
  if (atmosphere && atmosphere.geometry.attributes.color) {
    const colors = atmosphere.geometry.attributes.color.array;
    for (let i = 0; i < colors.length; i += 3) {
      const color = new THREE.Color();
      if (isDay) {
        const hue = 0.6 - (temp / 50) * 0.3;
        color.setHSL(hue, 0.8, 0.7 + Math.random() * 0.2);
      } else {
        const hue = 0.7 - (temp / 50) * 0.2;
        color.setHSL(hue, 0.6, 0.4 + Math.random() * 0.2);
      }
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    atmosphere.geometry.attributes.color.needsUpdate = true;
  }

  // Show/hide rain based on weather
  const rain = scene.children.find(child => child.userData?.isRain);
  const isRaining = current.weather?.some(w => w.main.toLowerCase().includes('rain'));
  
  if (rain) {
    rain.visible = isRaining;
  }

  // Adjust cloud density and color
  const clouds = scene.children.find(child => child.userData?.isClouds);
  if (clouds) {
    clouds.children.forEach(cloud => {
      cloud.material.opacity = Math.min(0.6, current.clouds / 100);
      cloud.material.color.set(isDay ? 0xffffff : 0xcccccc);
    });
  }
}

// Get color based on temperature and time of day
function getTemperatureColor(temp, isDay) {
  const dayColors = {
    veryCold: 0x4a6fa5,  // Blue
    cold: 0x5fa5b5,      // Light blue
    cool: 0x7bb3b5,      // Blue-green
    mild: 0x94c2b5,      // Green
    warm: 0xffb347,      // Orange
    hot: 0xff6b6b,       // Red-orange
    veryHot: 0xff4757    // Red
  };

  const nightColors = {
    veryCold: 0x2c3e50,  // Dark blue
    cold: 0x34495e,      // Dark slate
    cool: 0x4169a3,      // Royal blue
    mild: 0x487eb0,      // Steel blue
    warm: 0xe67e22,      // Dark orange
    hot: 0xd35400,       // Dark red-orange
    veryHot: 0xc23616    // Dark red
  };

  const colors = isDay ? dayColors : nightColors;

  if (temp < -10) return colors.veryCold;
  if (temp < 0) return colors.cold;
  if (temp < 10) return colors.cool;
  if (temp < 20) return colors.mild;
  if (temp < 30) return colors.warm;
  if (temp < 35) return colors.hot;
  return colors.veryHot;
}