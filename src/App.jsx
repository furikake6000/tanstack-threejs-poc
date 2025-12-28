import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const DEFAULT_COLOR = '#4f46e5';

const createTexturePainter = (canvas) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available.');
  }

  return (color) => {
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
};

export default function App() {
  const mountRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const textureRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);

  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    const mount = mountRef.current;
    const textureCanvas = textureCanvasRef.current;

    if (!mount || !textureCanvas) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111827');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.2, 2, 2.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio ?? 1);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.55,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    const directionalLight = new THREE.DirectionalLight('#ffffff', 0.9);
    directionalLight.position.set(3, 4, 2);
    scene.add(ambientLight, directionalLight);

    const resize = () => {
      if (!mount) return;
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!textureCanvasRef.current) return;

    const paint = createTexturePainter(textureCanvasRef.current);
    paint(color);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [color]);

  const handleDownload = () => {
    const canvas = textureCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'texture.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">TanStack Start + Three.js PoC</p>
          <h1>3Dモデル用テクスチャエディタ</h1>
          <p className="subtitle">
            立方体に適用されるテクスチャをリアルタイムに編集し、PNGとして出力できます。
          </p>
        </div>
      </header>
      <main className="content">
        <section className="panel">
          <h2>プレビュー</h2>
          <div className="preview" ref={mountRef} />
          <p className="hint">ドラッグで回転、スクロールでズームできます。</p>
        </section>
        <section className="panel">
          <h2>テクスチャ編集</h2>
          <div className="controls">
            <label className="control">
              <span>ベースカラー</span>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
            <button className="button" type="button" onClick={handleDownload}>
              PNGをダウンロード
            </button>
          </div>
          <div className="texture-preview">
            <canvas
              ref={textureCanvasRef}
              width={256}
              height={256}
              aria-label="texture preview"
            />
          </div>
          <ul className="todo">
            <li>ブラシ/スタンプ等の描画機能の追加</li>
            <li>FBX + UnityPackageへの書き出し</li>
            <li>テクスチャレイヤー管理</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
