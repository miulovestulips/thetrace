import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { isGamePaused, setGamePaused } from "./gameState.js";
import { initMultiplayer, actualizarMultijugador, jugadorCaido } from "./multiplayer.js";

// CANVAS
const canvas = document.getElementById("game-canvas");

// EScena
const scene = new THREE.Scene();

// NEBLA 
scene.fog = new THREE.Fog(0x000000, 40, 180);

// Cuadrcula 
const grid = new THREE.GridHelper(100, 100);
scene.add(grid);

//techo de la cueva (solo nivel 3)
const geoTejado = new THREE.PlaneGeometry(200, 200);
const matTejado = new THREE.MeshStandardMaterial({
    color: 0x6b4a3a,
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0
});
const tejado = new THREE.Mesh(geoTejado, matTejado);
tejado.rotation.x = Math.PI / 2;
tejado.position.y = 3.9;
tejado.visible = false;
scene.add(tejado);


//camara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 2;
camera.position.z = 5;
camera.lookAt(0, 0, 0);

//render
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a0f1a, 1);

//controles de mouse (PointerLock)
const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', () => {
    if (!isGamePaused()) {
        controls.lock();
    }
});

window.addEventListener("game-pause-change", (event) => {
    if (event.detail.paused) {
        controls.unlock();
    }
});

//luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffddaa, 0.2);
backLight.position.set(-10, 10, -20);
scene.add(backLight);

const playerLight = new THREE.PointLight(0xffaa66, 5, 60);
scene.add(playerLight);

//teclas
const keys = { w: false, a: false, s: false, d: false };
const VELOCIDAD = 9; // unidades/seg (equivale a 0.15 por frame a 60 FPS)

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

//movimiento
function updateMovement(delta) {
    if (isGamePaused() || jugadorCaido()) return;

    const direccion = new THREE.Vector3();
    camera.getWorldDirection(direccion);
    direccion.y = 0;
    direccion.normalize();

    const lateral = new THREE.Vector3();
    lateral.crossVectors(camera.up, direccion).normalize();

    const mov = new THREE.Vector3();
    if (keys.w) mov.add(direccion);
    if (keys.s) mov.sub(direccion);
    if (keys.a) mov.add(lateral);
    if (keys.d) mov.sub(lateral);

    if (mov.lengthSq() > 0) {
        mov.normalize(); // en diagonal no va más rápido
        camera.position.addScaledVector(mov, VELOCIDAD * Math.min(delta, 0.1));
    }

    playerLight.position.copy(camera.position);
}

function clearMovementKeys() {
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
}

window.addEventListener("game-pause-change", (event) => {
    if (event.detail.paused) {
        clearMovementKeys();
    }
});



// CARGA DE MODELOS                          

const mixers = [];
let modelosCargados = [];
let lucesDeNivel = [];

const textureLoader = new THREE.TextureLoader();
const texturaCueva = textureLoader.load('./assets/models/nivel3/colormap.png');

//textura antorcha
const texturaAntorchaColor = textureLoader.load('./assets/models/nivel3/torch-stick/textures/torchstickColor.png');
const texturaAntorchaEmision = textureLoader.load('./assets/models/nivel3/torch-stick/textures/torchstickemmision.png');
const texturaAntorchaNormal = textureLoader.load('./assets/models/nivel3/torch-stick/textures/torchstickNormal.png');
const texturaAntorchaRoughness = textureLoader.load('./assets/models/nivel3/torch-stick/textures/torchstickRoughness.png');

//textura de la casa NIVEL 1
const texturaCasaAlbedo1 = textureLoader.load('./assets/models/nivel1/sana/textures/viribbp_2K_Albedo.jpg');
const texturaCasaNormal1 = textureLoader.load('./assets/models/nivel1/sana/textures/viribbp_2K_Normal.jpg');

const texturaCasaAlbedo2 = textureLoader.load('./assets/models/nivel1/sana/textures/visscjf_2K_Albedo copy.jpg');
const texturaCasaNormal2 = textureLoader.load('./assets/models/nivel1/sana/textures/visscjf_2K_Normal.jpg');

const texturaCasaAlbedo3 = textureLoader.load('./assets/models/nivel1/sana/textures/vkmeddz_2K_Albedo copy.jpg');
const texturaCasaNormal3 = textureLoader.load('./assets/models/nivel1/sana/textures/vkmeddz_2K_Normal.jpg');

const texturaCasaAlbedo4 = textureLoader.load('./assets/models/nivel1/sana/textures/wckqdbvs_2K_Albedo.jpg');
const texturaCasaNormal4 = textureLoader.load('./assets/models/nivel1/sana/textures/wckqdbvs_2K_Normal.jpg');

//textura puerta NIVEL 1
const texturaPuertaMaderaBase = textureLoader.load('./assets/models/nivel1/door/textures/Door_wood_BaseColor.png');
const texturaPuertaMaderaNormal = textureLoader.load('./assets/models/nivel1/door/textures/Door_wood_Normal.png');
const texturaPuertaMaderaRoughness = textureLoader.load('./assets/models/nivel1/door/textures/Door_wood_Roughness.png');
const texturaPuertaMaderaMetal = textureLoader.load('./assets/models/nivel1/door/textures/Door_wood_Metallic.png');

const texturaPuertaMetalBase = textureLoader.load('./assets/models/nivel1/door/textures/Door_Metal_BaseColor.png');
const texturaPuertaMetalNormal = textureLoader.load('./assets/models/nivel1/door/textures/Door_Metal_Normal.png');
const texturaPuertaMetalRoughness = textureLoader.load('./assets/models/nivel1/door/textures/Door_Metal_Roughness.png');

const texturaPuertaTornillosBase = textureLoader.load('./assets/models/nivel1/door/textures/Door_Bolts_BaseColor.png');
const texturaPuertaTornillosNormal = textureLoader.load('./assets/models/nivel1/door/textures/Door_Bolts_Normal.png');
const texturaPuertaTornillosRoughness = textureLoader.load('./assets/models/nivel1/door/textures/Door_Bolts_Roughness.png');
const texturaPuertaTornillosMetal = textureLoader.load('./assets/models/nivel1/door/textures/Door_Bolts_Metallic.png');

//textura del barril NIVEL 1
const texturaBarrilBase = textureLoader.load('./assets/models/nivel1/barrels/textures/barrel_low_DefaultMaterial_BaseColor.png');
const texturaBarrilNormal = textureLoader.load('./assets/models/nivel1/barrels/textures/barrel_low_DefaultMaterial_Normal.png');
const texturaBarrilRoughness = textureLoader.load('./assets/models/nivel1/barrels/textures/barrel_low_DefaultMaterial_Roughness.png');
const texturaBarrilMetal = textureLoader.load('./assets/models/nivel1/barrels/textures/barrel_low_DefaultMaterial_Metallic.png');

//textura de la alacena NIVEL 1
const texturaAlacenaBase = textureLoader.load('./assets/models/nivel1/cupboard/textures/cupboard_albedo.jpeg');
const texturaAlacenaAO = textureLoader.load('./assets/models/nivel1/cupboard/textures/cupboard_AO.png');
const texturaAlacenaMetal = textureLoader.load('./assets/models/nivel1/cupboard/textures/cupboard_metal.jpeg');
const texturaAlacenaRoughness = textureLoader.load('./assets/models/nivel1/cupboard/textures/cupboard_roughness.jpeg');

//textura cajas NIVEL 1
const texturaCajaBase = textureLoader.load('./assets/models/nivel1/wood_box/textures/box.png');
const texturaCajaNormal = textureLoader.load('./assets/models/nivel1/wood_box/textures/NormalMap_(1).png');
const texturaCajaGlossy = textureLoader.load('./assets/models/nivel1/wood_box/textures/glossy_shit.png');

//textura mesa NIVEL 1
const texturaMesaBase = textureLoader.load('./assets/models/nivel1/wood-table/textures/mesa_base.jpg');
const texturaMesaAO = textureLoader.load('./assets/models/nivel1/wood-table/textures/mesa_ao.jpeg');

//textura pasto NIVEL 2
const texturaPastoBase = textureLoader.load('./assets/models/nivel2/textures/pasto_base.jpg');
const texturaPastoRoughness = textureLoader.load('./assets/models/nivel2/textures/pasto_roughness.jpg');

texturaPastoBase.wrapS = THREE.RepeatWrapping;
texturaPastoBase.wrapT = THREE.RepeatWrapping;
texturaPastoBase.repeat.set(60, 60);

texturaPastoRoughness.wrapS = THREE.RepeatWrapping;
texturaPastoRoughness.wrapT = THREE.RepeatWrapping;
texturaPastoRoughness.repeat.set(60, 60);

//textura de cueva NIVEL 2 */
const texturaCuevaEntrada = textureLoader.load('./assets/models/nivel2/cave-entrance/textures/gltf_embedded_0.jpeg');

//terreno del bosque solo nivel 2
const geoTerreno = new THREE.PlaneGeometry(150, 150, 30, 30);   
const matTerreno = new THREE.MeshStandardMaterial({
    map: texturaPastoBase,
    roughnessMap: texturaPastoRoughness,
    roughness: 1,
    metalness: 0
});
const terreno = new THREE.Mesh(geoTerreno, matTerreno);
terreno.rotation.x = -Math.PI / 2;
terreno.position.y = 0;
terreno.visible = false;
terreno.receiveShadow = true;



//modificar los vertices para crear relieve
const posiciones = geoTerreno.attributes.position;
for (let i = 0; i < posiciones.count; i++) {
    const x = posiciones.getX(i);
    const y = posiciones.getY(i);
    //formula de ruido simple para dar relieve suave
    const altura = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;   //cambia el 2 para más/menos relieve
    posiciones.setZ(i, altura);
}
posiciones.needsUpdate = true;
geoTerreno.computeVertexNormals();   //recalcular normales para qe la luz se vea bien

scene.add(terreno);


//CARGAR MODELO con el nivel                 

// funcion d la clase
function cargarModelo3D(
    ruta,
    nombre,
    posicion,
    escala = new THREE.Vector3(1, 1, 1),
    rotacion = {x:0, y:0, z:0},
    nivel = 3
) {

    const manager = new THREE.LoadingManager();

    const loaderFBX = new FBXLoader(manager);

    const loaderGLB = new GLTFLoader(manager);

    const loaderActual =
        ruta.toLowerCase().endsWith('.glb')
            ? loaderGLB
            : loaderFBX;

    return new Promise((resolve) => {

        loaderActual.load(
            ruta,
            (gltfOrModel) => {

                // el GLTFLoader devuelve gltf.scene, FBXLoader devuelve el modelo directo
                const modelo = gltfOrModel.scene || gltfOrModel;

                modelo.name = nombre;

                modelo.position.set(
                    posicion.x,
                    posicion.y,
                    posicion.z
                );

                modelo.scale.copy(escala);

                modelo.rotation.set(
                    rotacion.x,
                    rotacion.y,
                    rotacion.z
                );

                modelo.traverse((child) => {

                    if (child.isMesh) {
                        console.log(`Mesh: "${child.name}" | Material: "${child.material.name || 'sin nombre'}"`);

                        if (nivel === 3) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        } else {
                            child.castShadow = false;
                            child.receiveShadow = false;
                        }

                        const materiales = Array.isArray(child.material)
                            ? child.material
                            : [child.material];

                        //antorcha
                        if (ruta.includes('torchstick')) {

                            child.material = new THREE.MeshStandardMaterial({
                                map: texturaAntorchaColor,
                                emissiveMap: texturaAntorchaEmision,
                                emissive: new THREE.Color(0xffaa66),
                                emissiveIntensity: 4,
                                normalMap: texturaAntorchaNormal,
                                roughnessMap: texturaAntorchaRoughness,
                                roughness: 0.8,
                                metalness: 0.1
                            });

                        //puerta
                        } else if (ruta.includes('Medieval_Door')) {

                            materiales.forEach((mat) => {
                                const nombre = (mat.name || '').toLowerCase();

                                if (nombre.includes('wood') || nombre.includes('madera')) {
                                    mat.map = texturaPuertaMaderaBase;
                                    mat.normalMap = texturaPuertaMaderaNormal;
                                    mat.roughnessMap = texturaPuertaMaderaRoughness;
                                    mat.metalnessMap = texturaPuertaMaderaMetal;
                                } else if (nombre.includes('metal')) {
                                    mat.map = texturaPuertaMetalBase;
                                    mat.normalMap = texturaPuertaMetalNormal;
                                    mat.roughnessMap = texturaPuertaMetalRoughness;
                                } else if (nombre.includes('bolt') || nombre.includes('tornillo')) {
                                    mat.map = texturaPuertaTornillosBase;
                                    mat.normalMap = texturaPuertaTornillosNormal;
                                    mat.roughnessMap = texturaPuertaTornillosRoughness;
                                    mat.metalnessMap = texturaPuertaTornillosMetal;
                                }

                                mat.roughness = 0.8;
                                mat.metalness = 0.2;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            });

                        //barril
                        } else if (ruta.includes('barrel')) {

                            materiales.forEach((mat) => {
                                mat.map = texturaBarrilBase;
                                mat.normalMap = texturaBarrilNormal;
                                mat.roughnessMap = texturaBarrilRoughness;
                                mat.metalnessMap = texturaBarrilMetal;
                                mat.roughness = 0.9;
                                mat.metalness = 0.2;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            });

                        //alacena
                        } else if (ruta.includes('cupboard')) {

                            materiales.forEach((mat) => {
                                mat.map = texturaAlacenaBase;
                                mat.aoMap = texturaAlacenaAO;
                                mat.roughnessMap = texturaAlacenaRoughness;
                                mat.metalnessMap = texturaAlacenaMetal;
                                mat.roughness = 0.8;
                                mat.metalness = 0.1;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            });

                        //caja
                        } else if (ruta.includes('doos') || ruta.includes('wood_box')) {

                            materiales.forEach((mat) => {
                                mat.map = texturaCajaBase;
                                mat.normalMap = texturaCajaNormal;
                                mat.roughnessMap = texturaCajaGlossy;
                                mat.roughness = 0.8;
                                mat.metalness = 0;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            });
                            
                            //llama invisible
                        } else if (ruta.includes('flamess')) {
                
                            const luzLlama = new THREE.PointLight(0xffaa55, 5, 25);
                            luzLlama.position.set(posicion.x, posicion.y, posicion.z);
                            scene.add(luzLlama);
                            lucesDeNivel.push(luzLlama);

                        //mesa
                        } else if (ruta.includes('mesa') || ruta.includes('wood-table')) {

                            materiales.forEach((mat) => {
                                mat.map = texturaMesaBase;
                                mat.aoMap = texturaMesaAO;
                                mat.roughness = 0.8;
                                mat.metalness = 0;
                                mat.color = new THREE.Color(0xffffff);
                                mat.needsUpdate = true;
                            });
                        //Cueva
                        } else if (ruta.includes('cave-entrance')) {

                            //material de la cueva con su textura
                            child.material = new THREE.MeshStandardMaterial({
                                map: texturaCuevaEntrada,
                                roughness: 0.9,
                                metalness: 0
                            });

                        }
                        else if (ruta.includes('cliff_waterfall_stone') || ruta.includes('cliff')) {

                            //material tipo madera
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x8b6f47,        
                                roughness: 0.9,
                                metalness: 0
                            });

                        } else if (ruta.includes('tree') || ruta.includes('rock') || ruta.includes('fence')) {

                            if (ruta.includes('pine')) {

                                //pino
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0x4a7c3a,
                                    roughness: 0.9,
                                    metalness: 0
                                });

                            } else if (ruta.includes('thin')) {

                                //arbol alto
                                const material = new THREE.MeshStandardMaterial({
                                    color: 0xffffff,
                                    roughness: 0.9,
                                    metalness: 0
                                });

                                material.onBeforeCompile = (shader) => {
                                    shader.uniforms.colorTronco = { value: new THREE.Color(0x6b4a2a) };
                                    shader.uniforms.colorHojas = { value: new THREE.Color(0x4a7c3a) };
                                    shader.uniforms.alturaCorte = { value: 0.5 };   // ← VOLVER A 0.5

                                    shader.vertexShader = `
                                        varying vec3 vPosicionLocal;
                                        ${shader.vertexShader}
                                    `.replace(
                                        `#include <begin_vertex>`,
                                        `#include <begin_vertex>
                                        vPosicionLocal = position;`
                                    );

                                    shader.fragmentShader = `
                                        uniform vec3 colorTronco;
                                        uniform vec3 colorHojas;
                                        uniform float alturaCorte;
                                        varying vec3 vPosicionLocal;
                                        ${shader.fragmentShader}
                                    `.replace(
                                        `#include <color_fragment>`,
                                        `#include <color_fragment>
                                        float t = smoothstep(alturaCorte - 0.1, alturaCorte + 0.1, vPosicionLocal.y);
                                        diffuseColor.rgb = mix(colorTronco, colorHojas, t);`
                                    );
                                };

                                child.material = material;

                            } else if (ruta.includes('rock')) {

                                //roca
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0x8a8a8a,
                                    roughness: 0.9,
                                    metalness: 0
                                });

                            } else if (ruta.includes('fence')) {

                                //cerca
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0x8b6f47,
                                    roughness: 0.9,
                                    metalness: 0
                                });

                            }

                        }
                        //NIVEL 3(cueva)
                         else if (nivel === 3) {

                            materiales.forEach((mat) => {
                                mat.map = texturaCueva;
                                mat.roughness = 1;
                                mat.metalness = 0;
                                mat.color = new THREE.Color(0x8a7a6a);
                                mat.needsUpdate = true;
                            });

                        //NIVEL 1 y 2(casa)
                        } else {

                            materiales.forEach((mat) => {
                                mat.map = texturaCasaAlbedo1;
                                mat.normalMap = texturaCasaNormal1;
                                mat.roughness = 0.9;
                                mat.metalness = 0;
                                mat.color = new THREE.Color(0xffddbb);   // tinte cálido
                                mat.needsUpdate = true;
                            });

                        }

                    }

                });

                // si es la antorcha, agregar su luz a la escena
                if (ruta.includes('torchstick')) {

                    const luzAntorcha = new THREE.PointLight(0xffaa66, 5, 25);
                    luzAntorcha.position.set(
                        posicion.x,
                        posicion.y + 2.5,
                        posicion.z
                    );
                    scene.add(luzAntorcha);
                    lucesDeNivel.push(luzAntorcha);

                }

                scene.add(modelo);
                modelosCargados.push(modelo);

                console.log(
                    `✅ Modelo ${nombre} cargado correctamente`
                );

                resolve(modelo);

            },
            (xhr) => {

                if (xhr.total > 0) {

                    const porcentaje =
                        (xhr.loaded / xhr.total) * 100;

                    console.log(
                        `${nombre}: ${porcentaje.toFixed(2)}% cargado`
                    );

                }

            },

            (error) => {

                console.error(
                    `❌ Error cargando ${ruta}:`,
                    error
                );
                const geo = new THREE.BoxGeometry(2, 2, 2);
                const mat = new THREE.MeshStandardMaterial({ color: 0xff00cc });
                const cubo = new THREE.Mesh(geo, mat);
                cubo.position.set(posicion.x, posicion.y, posicion.z);
                scene.add(cubo);
                modelosCargados.push(cubo);
                resolve(cubo);
            }
        );

    });

}



//configuraciones e los 3 niveles

const niveles = {

    1: {
        nombre: "Casa",
        colorFog: 0x001122,
        modelos: [
            { ruta: './assets/models/nivel1/sana/sana.fbx', pos: {x: 0, y: 2.3, z: 0}, escala: 0.02 },
            { ruta: './assets/models/nivel1/door/source/Medieval_Door.fbx', pos: {x: -8.7, y: -13.4, z: 6.3}, escala: 0.03, rotacion: {x: 0, y: 0, z: 0} },
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: 14, y: 0, z: 11}, escala: 0.004 },
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: -20, y: 0, z: 5}, escala: 0.004 ,rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: -18, y: 0, z: -10}, escala: 0.004 ,rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: -15.3, y: 0, z: -11.8}, escala: 0.004 ,rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel1/cupboard/source/cupboard_model_low_poly.fbx', pos: {x: -20, y: 1, z: -10}, escala: 0.04, rotacion: {x: 0, y: 0, z: 0} },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 14, y: 0, z: -10}, escala: 1.4 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 13.5, y: 0, z: -11.5}, escala: 1.4 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 13.8, y: 1.4, z: -11}, escala: 1.4 },
            
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: -14, y: 0, z: 13}, escala: 0.004 ,rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 0, y: 0, z: 11}, escala: 2.8, rotacion: {x: 0, y: 4, z: 0} },
            { ruta: './assets/models/nivel1/wood-table/source/mesa.fbx', pos: {x: 0, y: 0.7, z: -6}, escala: 0.05 },
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: -18, y: -2.91, z: 12}, escala: 0.01 ,rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: -18, y: 0, z: -6.5}, escala: 3, rotacion: {x: 0, y: 0, z: 0} },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: -2.5, y: 0, z: -6}, escala: 1.2 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 2.5, y: 0, z: -6}, escala: 1.2 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: -1.3, y: 1.4, z: -7}, escala: 0.4 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: -6, y: -0.75, z: -2.4}, escala: 1 },
            { ruta: './assets/models/nivel1/wood-table/source/mesa.fbx', pos: {x: 6, y: 0.7, z: 11}, escala: 0.05 },
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: 7, y: 1.5, z: 12}, escala: 0.004 ,rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: 5, y: 1.5, z: 10}, escala: 1 },
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: 10, y: -2.91, z: -10}, escala: 0.01 , rotacion: {x: 0, y: 4, z: 0}},
            { ruta: './assets/models/nivel1/barrels/source/barrels.fbx', pos: {x: 4, y: -2.91, z: -10}, escala: 0.01 , rotacion: {x: 0, y: 4, z: 0}},
            { ruta: './assets/models/nivel1/wood-table/source/mesa.fbx', pos: {x: -6, y: 0.7, z: 11}, escala: 0.05 },
            { ruta: './assets/models/nivel1/wood_box/source/doos.fbx', pos: {x: -6, y: 0, z: 8}, escala: 1.4 },
            //fuego iluminacion 
            { ruta: './assets/models/nivel1/flamess.fbx', pos: {x: 9.2, y: 6.5, z: 5.4}, escala: 0.003 },
            { ruta: './assets/models/nivel1/flamess.fbx', pos: {x: -14.8, y: 6.5, z: 5.4}, escala: 0.003 },

            { ruta: './assets/models/nivel1/flamess.fbx', pos: {x: 9.2, y: 6.5, z: -5.4}, escala: 0.003 },
            { ruta: './assets/models/nivel1/flamess.fbx', pos: {x: -14.8, y: 6.5, z: -5.4}, escala: 0.003 },
        
        ]
    },

    2: {
        nombre: "Bosque",
        colorFog: 0xaaccee,
        modelos: [
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 65, y: 0, z: 15}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 65, y: 0, z: -15}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 65, y: 0, z: -60}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 40, y: 0, z: -40}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 30, y: 0, z: 20}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_thin_dark.glb', pos: {x: 40, y: 0, z: 0}, escala: 9 },

             { ruta: './assets/models/nivel2/vegetacion_glb/cliff_waterfall_stone.glb', pos: {x: 65, y: 0, z: 0}, escala: 20, rotacion: {x: 0, y: 1.57, z: 0} },
             { ruta: './assets/models/nivel2/vegetacion_glb/cliff_waterfall_stone.glb', pos: {x: 81.8, y: 0, z: 20}, escala: 20, rotacion: {x: 0, y: 4.71, z: 0} },
             { ruta: './assets/models/nivel2/vegetacion_glb/cliff_waterfall_stone.glb', pos: {x: 81.8, y: 0, z: -20}, escala: 20, rotacion: {x: 0, y: 4.71, z: 0} },
             { ruta: './assets/models/nivel1/door/source/Medieval_Door.fbx', pos: {x: 60, y: -12, z: -6.5}, escala: 0.03, rotacion: {x: 0, y: 3.14, z: 0} },
             { ruta: './assets/models/nivel2/cave-entrance/source/model.glb', pos: {x: -67, y: 4, z: -45}, escala: 7, rotacion: {x: 0, y: 1.57, z: 0} },

             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 30, y: 0, z: 25}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -61, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -53, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -45, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -36, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -27, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -17, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -7, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 3, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 61, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 51, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 41, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 31, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 21, y: 0, z: 70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 11, y: 0, z: 70}, escala: 20 },

             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -61, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -53, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -45, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -36, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -27, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -17, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -7, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 3, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 61, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 51, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 41, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 31, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 21, y: 0, z: -70}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 11, y: 0, z: -70}, escala: 20 },

             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 70, y: 0, z: 30}, escala: 20 },

             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: -20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -70, y: 0, z: -30}, escala: 20 },

             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: -20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -30, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -30, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -30, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -30, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: 10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 40, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 60, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 60, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 40.5, y: 0, z: -20.5}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 10, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: -30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: -20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 30, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: 20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 0, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 60, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 60, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 40, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 40, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 60, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 0, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 10, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 10, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 0, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x:-10, y: 0, z: 30}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: -50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: -60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -60, y: 0, z: 50}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -50, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 0, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 10, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 20, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 30, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 40, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: 50, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -20, y: 0, z: 40}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: 60}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: 10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -50, y: 0, z: 10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -50, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -50, y: 0, z: 20}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -40, y: 0, z: 0}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -50, y: 0, z: -10}, escala: 20 },
             { ruta: './assets/models/nivel2/vegetacion_glb/tree_pineGroundA.glb', pos: {x: -10, y: 0, z: 30}, escala: 20 },

             { ruta: './assets/models/nivel2/vegetacion_glb/rock_smallA.glb', pos: {x: -65, y: 0.8, z: -35}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/rock_smallA.glb', pos: {x: -65, y: 0.4, z: -54}, escala: 9 },
             { ruta: './assets/models/nivel2/vegetacion_glb/fence_simple.glb', pos: {x: -60, y: 0, z: -34}, escala: 8 },
             { ruta: './assets/models/nivel2/vegetacion_glb/fence_simple.glb', pos: {x: -60, y: 1, z: -54}, escala: 8, rotacion: {x: 0, y: 6.28, z: 0.15} },  
               
            ]
        },

    3: {
        nombre: "Cueva del Jefe",
        colorFog: 0x110022,
        modelos: [
            //inicio
            { ruta: './assets/models/nivel3/room-wide.fbx', pos: {x: 0, y: 0, z: 0}, escala: 0.01 },
            { ruta: './assets/models/nivel3/gate.fbx', pos: {x: 0, y: 0, z: -5}, escala: 0.01 },
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: 0, y: 0, z: 7}, escala: 0.01 },
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -11, y: 0, z: 0}, escala: 0.01, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: 11, y: 0, z: 0}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -3, y: 0, z: -4}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: 3, y: 0, z: -4}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},

            //Pasillo 1
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -8}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -12}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -16}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -20}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},

            //cuarto grande
            { ruta: './assets/models/nivel3/room-large-variation.fbx', pos: {x: 0, y: 0, z: -32}, escala: 0.01 },
            { ruta: './assets/models/nivel3/stairs.fbx', pos: {x: 16, y: 0, z: -32}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/gate-metal-bars.fbx', pos: {x: 10, y: 0, z: -32}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -3, y: 0, z: -24}, escala: 0.015},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -8, y: 0, z: -29}, escala: 0.015, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: 3, y: 0, z: -40}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},

            // Cuarto espada
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -12, y: 0, z: -32}, escala: 0.01 },
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -16, y: 0, z: -32}, escala: 0.01 },
            { ruta: './assets/models/nivel3/room-small.fbx', pos: {x: -24, y: 0, z: -32}, escala: 0.01 },
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -24, y: 0, z: -38}, escala: 0.01, rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -24, y: 0, z: -25}, escala: 0.01 },
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -20, y: 0, z: -29}, escala: 0.015, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -20, y: 0, z: -34}, escala: 0.015, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -8, y: 0, z: -58}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -8, y: 0, z: -53}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},

            // pasillo 2
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -44}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: 0, y: 0, z: -48}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/stairs.fbx', pos: {x: -36, y: 0, z: -32}, escala: 0.01, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/gate-metal-bars.fbx', pos: {x: -29, y: 0, z: -32}, escala: 0.01, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/room-wide.fbx', pos: {x: 0, y: 0, z: -56}, escala: 0.01 },
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: 11, y: 0, z: -56}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: 0, y: 0, z: -62}, escala: 0.01, rotacion: {x: 0, y: 3.14, z: 0}},

            //cuarto del jefe
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -12, y: 0, z: -56}, escala: 0.01 },
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -16, y: 0, z: -56}, escala: 0.01 },
            { ruta: './assets/models/nivel3/room-large.fbx', pos: {x: -28, y: 0, z: -56}, escala: 0.01 },
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -39, y: 0, z: -56}, escala: 0.01, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -28, y: 0, z: -45}, escala: 0.01 },
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -27, y: 0, z: -57}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},

            // cuarto tesoro
            { ruta: './assets/models/nivel3/room-wide.fbx', pos: {x: -28, y: 0, z: -79}, escala: 0.01 },
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -28, y: 0, z: -68}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/corridor.fbx', pos: {x: -28, y: 0, z: -72}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -39, y: 0, z: -79}, escala: 0.01, rotacion: {x: 0, y: 4.71, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -17, y: 0, z: -79}, escala: 0.01, rotacion: {x: 0, y: 1.57, z: 0}},
            { ruta: './assets/models/nivel3/template-wall-detail-a.fbx', pos: {x: -28, y: 0, z: -84}, escala: 0.01, rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -30, y: 0, z: -75}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},
            { ruta: './assets/models/nivel3/torch-stick/source/torchstick.fbx', pos: {x: -26, y: 0, z: -75}, escala: 0.015, rotacion: {x: 0, y: 3.14, z: 0}},

        ]
    }

};



//cargar un nivel                         
let nivelCargado = 0;

async function cargarNivel(numeroNivel) {

    // Si el servidor reinicia el mismo nivel, los modelos ya están en escena
    if (numeroNivel === nivelCargado) return;
    nivelCargado = 0;

    console.log(`⏳ Cargando nivel ${numeroNivel}...`);

    modelosCargados.forEach((modelo) => scene.remove(modelo));
    modelosCargados = [];

    lucesDeNivel.forEach((luz) => scene.remove(luz));
    lucesDeNivel = [];

    mixers.length = 0;

    const nivel = niveles[numeroNivel];

    if (nivel) {

        scene.fog.color.setHex(nivel.colorFog);
        tejado.visible = (numeroNivel === 3);

        if (numeroNivel === 1) {
            terreno.visible = false;// para que no apareca rl terreno del 2
            //sombras
            renderer.shadowMap.enabled = false;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;   
            dirLight.castShadow = false;
            dirLight.shadow.mapSize.width = 1024;
            dirLight.shadow.mapSize.height = 1024;
            dirLight.shadow.camera.near = 1;
            dirLight.shadow.camera.far = 100;
            dirLight.shadow.bias = -0.0005;                     

            //luz ambiental
            ambientLight.intensity = 1;
            ambientLight.color.setHex(0xffbb66);   

            //luz cielo
            const hemiLight = new THREE.HemisphereLight(0xffaa66, 0x4a2a1a, 1.0);
            scene.add(hemiLight);
            lucesDeNivel.push(hemiLight);

            //sol bajo
            dirLight.intensity = 1.5;
            dirLight.castShadow = false;
            dirLight.color.setHex(0xffaa66);       // naranja atardecer
            dirLight.position.set(20, 10, 20);      // sol bajo en el horizonte

            backLight.intensity = 0.4;
            backLight.color.setHex(0xff8844);

            //Luz central tipo velas
            const luzInterior = new THREE.PointLight(0xffaa55, 4, 80);
            luzInterior.position.set(0, 8, 0);
            scene.add(luzInterior);
            lucesDeNivel.push(luzInterior);

            //Fondo aterceder
            scene.fog.color.setHex(0x3a1a0a);
            renderer.setClearColor(0x3a1a0a, 1);

            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));

        } else if (numeroNivel === 2) {

            terreno.visible = true;

            // Luz ambiental más baja (menos luz general)
            ambientLight.intensity = 0.8;
            ambientLight.color.setHex(0xffffff);

            //Sol fuerte desde arriba
            dirLight.intensity = 2.0;
            dirLight.castShadow = true;
            dirLight.color.setHex(0xffeecc); //luz caluda
            dirLight.position.set(50, 80, 30); // sol mas alto
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 1;
            dirLight.shadow.camera.far = 200;
            dirLight.shadow.camera.left = -100;
            dirLight.shadow.camera.right = 100;
            dirLight.shadow.camera.top = 100;
            dirLight.shadow.camera.bottom = -100;
            dirLight.shadow.bias = -0.0005;

            //Luz de relleno 
            backLight.intensity = 0.5;
            backLight.color.setHex(0xaaccee);

            //Fondo azul cielo
            scene.fog.color.setHex(0xaaccee);
            renderer.setClearColor(0xaaccee, 1);

            //Activar sombras
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        } else if (numeroNivel === 3) {

            terreno.visible = false;//terreno del 2
            renderer.shadowMap.enabled = true;
            dirLight.castShadow = true;
            dirLight.intensity = 0.3;

            ambientLight.intensity = 0.3;
            dirLight.intensity = 0.3;
            backLight.intensity = 0.2;
            scene.fog.color.setHex(0x110022);
            renderer.setClearColor(0x1a0f1a, 1);
        }

        // Todos los modelos se piden a la vez (mucho más rápido por internet)
        await Promise.all(nivel.modelos.map((modelo) => {

            //nombre del modelo a partir del nombre del archivo
            const nombreModelo = modelo.nombre ||
                modelo.ruta
                    .split('/')
                    .pop()
                    .replace(/\.(fbx|glb)$/i, '');

            const valorEscala = modelo.escala || 1;

            const escalaModelo =
                valorEscala instanceof THREE.Vector3
                    ? valorEscala
                    : new THREE.Vector3(valorEscala, valorEscala, valorEscala);

            return cargarModelo3D(
                modelo.ruta,
                nombreModelo,
                modelo.pos,
                escalaModelo,
                modelo.rotacion || {x:0, y:0, z:0},
                numeroNivel
            );

        }));

    }

    nivelCargado = numeroNivel;
    console.log(`✅ Nivel ${numeroNivel} cargado.`);

}



//INICIO                              

// El servidor decide el nivel; el cliente lo carga cuando se lo pide
initMultiplayer({ scene, camera, cargarNivel });

const clock = new THREE.Clock();

//loop princiapl
function animate() {
    const delta = clock.getDelta();
    updateMovement(delta);
    actualizarMultijugador();
    mixers.forEach((mixer) => mixer.update(delta));
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);


//Ajustar el tamaño
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});