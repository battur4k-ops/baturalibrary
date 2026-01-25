/* ============================================================
   BACKGROUND.JS — HIGH-FIDELITY ENGINE (Persistence Optimized)
   Batura Library | Shader Sync v11.2 [Overscan & Virtual Viewport]
   ============================================================ */

(function() {
    const STORAGE_KEY = 'batura_theme_index';
    const canvas = document.getElementById('liquid-bg-canvas');
    if (!canvas) return;
    const isIOS = CSS.supports('-webkit-touch-callout', 'none');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    // 1. ЧИТАЕМ СОХРАНЕННУЮ ТЕМУ
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const parsedTheme = savedTheme !== null ? parseInt(savedTheme, 10) : 0;
    const initialIndex = Number.isNaN(parsedTheme) ? 0 : parsedTheme;

    const getToken = (name) => {
        const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return val || "#000000";
    };

    const getOverscan = () => {
        const raw = getToken('--viewport-overscan');
        const value = parseFloat(raw);
        return Number.isFinite(value) ? value : 100;
    };

    const themeColors = [
        [new THREE.Color(getToken('--p-blue-deep')),   new THREE.Color(getToken('--p-blue-solid'))],   // 0
        [new THREE.Color(getToken('--p-purple-deep')), new THREE.Color(getToken('--p-purple-solid'))], // 1
        [new THREE.Color(getToken('--p-green-deep')),  new THREE.Color(getToken('--p-green-solid'))],  // 2
        [new THREE.Color(getToken('--p-red-deep')),    new THREE.Color(getToken('--p-red-solid'))],    // 3
        [new THREE.Color(getToken('--p-yellow-deep')), new THREE.Color(getToken('--p-yellow-solid'))], // 4
        [new THREE.Color(getToken('--p-cyan-deep')),   new THREE.Color(getToken('--p-cyan-solid'))],   // 5
        [new THREE.Color(getToken('--p-pink-deep')),   new THREE.Color(getToken('--p-pink-solid'))],   // 6
        [new THREE.Color(getToken('--p-orange-deep')), new THREE.Color(getToken('--p-orange-solid'))], // 7
        [new THREE.Color(getToken('--p-silver-deep')), new THREE.Color(getToken('--p-silver-solid'))]  // 8
    ];

    const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: false,
        preserveDrawingBuffer: true
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1); 
    
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    let targetC1 = themeColors[initialIndex][0].clone();
    let targetC2 = themeColors[initialIndex][1].clone();

    const fragmentShader = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_res;
        uniform vec3 u_color1;
        uniform vec3 u_color2;

        float random(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324, 0.366025, -0.577350, 0.024390);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            vec3 p = mod( (( (vec3(i.y + vec3(0.0, i1.y, 1.0))*34.0)+1.0)*vec3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0) )*34.0+1.0, 289.0);
            vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.792842 - 0.853734 * (a0*a0 + h*h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_res.xy;
            float ratio = u_res.x / u_res.y;
            vec2 centeredUV = (uv - 0.5) * vec2(ratio, 1.0);
            vec2 mouseUV = (u_mouse - 0.5) * vec2(ratio, 1.0);
            
            float dist = distance(centeredUV, mouseUV);
            float mask = smoothstep(1.2, 0.0, dist); 
            
            float n = snoise(centeredUV * 0.7 - u_time * 0.015);
            n += snoise(centeredUV * 1.3 + u_time * 0.025) * 0.2;
            n = n * 0.5 + 0.5; 
            
            float colorFlow = clamp(0.2 + n * 0.6, 0.0, 1.0);
            vec3 color = mix(u_color1, u_color2, colorFlow);
            
            float ambientLight = 0.9; 
            float mouseInfluence = mask * 0.15;
            
            float luma = dot(color, vec3(0.299, 0.587, 0.114));
            float safetyFactor = smoothstep(0.9, 0.4, luma * (ambientLight + mouseInfluence));
            float intensity = (ambientLight + mouseInfluence) * (n * 0.3 + 0.7) * (0.8 + 0.2 * safetyFactor);
            
            vec3 finalColor = color * intensity;
            finalColor = clamp(finalColor, 0.0, 0.78); 

            finalColor += random(uv) / 150.0;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    const uniforms = {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_color1: { value: themeColors[initialIndex][0].clone() },
        u_color2: { value: themeColors[initialIndex][1].clone() }
    };

    const material = new THREE.ShaderMaterial({ uniforms, fragmentShader });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let tMouse = new THREE.Vector2(0.5, 0.5), cMouse = new THREE.Vector2(0.5, 0.5);

    // КОРРЕКТИРОВКА МЫШИ ПОД OVERSCAN
    // Поскольку канвас сдвинут на -100px, нам нужно добавить 100px к координатам мыши,
    // чтобы "пятно" шейдера находилось точно под курсором в окне браузера.
    window.addEventListener('mousemove', e => {
        const offset = getOverscan();
        const canvasW = window.innerWidth + (offset * 2);
        const canvasH = window.innerHeight + (offset * 2);
        
        tMouse.set(
            (e.clientX + offset) / canvasW, 
            1 - (e.clientY + offset) / canvasH
        );
    });

    window.updateBgTheme = (index) => {
        if (themeColors[index]) {
            targetC1.copy(themeColors[index][0]);
            targetC2.copy(themeColors[index][1]);
            localStorage.setItem(STORAGE_KEY, index);
        }
    };

    function resize() {
        const overscan = getOverscan();
        const w = window.innerWidth + (overscan * 2);
        const h = window.innerHeight + (overscan * 2);

        if ((isIOS || isTouch) && resize.lastW) {
            const heightDelta = Math.abs(h - resize.lastH);
            const widthDelta = Math.abs(w - resize.lastW);
            if (widthDelta === 0 && heightDelta < 120) {
                return;
            }
        }

        resize.lastW = w;
        resize.lastH = h;

        // renderer.setSize установит размеры холста
        renderer.setSize(w, h);
        
        // Передаем полное разрешение холста в шейдер для корректного UV-маппинга
        if (uniforms.u_res) {
            uniforms.u_res.value.set(w, h);
        }
    }
    
    window.addEventListener('resize', resize);
    resize();

    function animate(t) {
        if (document.hidden) {
            requestAnimationFrame(animate);
            return;
        }

        const dx = tMouse.x - cMouse.x, dy = tMouse.y - cMouse.y;
        cMouse.x += dx * 0.04; 
        cMouse.y += dy * 0.04;
        
        uniforms.u_mouse.value.copy(cMouse);
        uniforms.u_time.value = t * 0.001;
        
        uniforms.u_color1.value.lerp(targetC1, 0.04);
        uniforms.u_color2.value.lerp(targetC2, 0.04);
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
})();