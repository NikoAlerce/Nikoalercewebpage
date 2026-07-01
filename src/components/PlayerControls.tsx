"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

// Accelerate Mesh.raycast with a BVH — the gallery is a single ~721k-triangle mesh,
// so the per-frame collision raycast is O(triangles) without this (the main hitch).
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

type Vec2 = { x: number; y: number };

type Props = {
  startPosition: THREE.Vector3;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  onLockChange: (locked: boolean) => void;
  paused: boolean;
  // Optional terrain follow: returns the ground height under (x,z), or null if none.
  // When omitted, the player walks on a flat floor at FLOOR_Y (legacy behaviour).
  getGroundY?: (x: number, z: number) => number | null;
  // Touch mode (mobile): driven by on-screen MobileControls via these refs instead of
  // PointerLockControls + keyboard. `touchMode` decides which control scheme to use (passed
  // from the gallery so it matches its own mobile detection); `touchEnabled` gates movement
  // until the user taps Enter.
  touchMode?: boolean;
  touchEnabled?: boolean;
  moveRef?: React.MutableRefObject<Vec2>;       // analog joystick: x=strafe, y=forward (-1..1)
  lookRef?: React.MutableRefObject<{ dx: number; dy: number }>; // accumulated look delta (px)
  jumpRef?: React.MutableRefObject<boolean>;
};

export interface PlayerControlsRef {
  lock: () => void;
  unlock: () => void;
}

const GRAVITY = 16.0;
const JUMP_FORCE = 6.0;
const WALK_SPEED = 5.0;
const RUN_SPEED = 9.0;
const PLAYER_HEIGHT = 1.7;
const EYE_LEVEL = PLAYER_HEIGHT;
const FLOOR_Y = 0.0; // Gallery floor is at Y=0
const ACCELERATION = 15.0; // Smooth acceleration
const FRICTION = 8.0; // Smooth deceleration

// Detect if device is mobile/tablet
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

const LOOK_SENS = 0.004; // rad per px of touch drag
const PITCH_LIMIT = 1.45; // ~83° up/down

const PlayerControlsInner = function PlayerControls({ startPosition, positionRef, onLockChange, paused, getGroundY, touchMode, touchEnabled = false, moveRef, lookRef, jumpRef }: Props, ref: React.Ref<PlayerControlsRef>) {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  // Use the parent's mobile decision when provided, else fall back to local detection.
  const [detectedTouch, setDetectedTouch] = useState(false);
  const isTouchDevice = touchMode ?? detectedTouch;

  // Raycasting for collision detection
  const raycaster = useRef(new THREE.Raycaster());
  const playerBox = useRef(new THREE.Box3());

  // Local touch detection (only used when the parent doesn't pass touchMode).
  useEffect(() => {
    setDetectedTouch(isMobile());
  }, []);

  // Expose lock/unlock methods via ref
  useImperativeHandle(ref, () => ({
    lock: () => {
      // Don't allow lock if paused (modal is open) or on mobile
      if (!paused && !isTouchDevice) {
        controlsRef.current?.lock();
      }
    },
    unlock: () => {
      controlsRef.current?.unlock();
    },
  }));

  const keys = useRef({
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    Space: false, ShiftLeft: false, ShiftRight: false,
  });
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  // Cache of collidable meshes — rebuilt occasionally instead of every frame
  // (traversing the whole gallery scene each frame was a major hitch source).
  const collidablesRef = useRef<THREE.Object3D[]>([]);
  const frameCount = useRef(0);
  const lastFloorY = useRef(FLOOR_Y); // remembered terrain height to avoid falling through holes
  const headBobT = useRef(0);
  const initialized = useRef(false);
  const currentVelocity = useRef(new THREE.Vector3()); // For smooth acceleration
  const yaw = useRef(0);   // touch-mode camera yaw  (around Y)
  const pitch = useRef(0); // touch-mode camera pitch (around X)

  // Set camera to start position once
  useEffect(() => {
    if (!initialized.current) {
      camera.position.set(startPosition.x, startPosition.y + EYE_LEVEL, startPosition.z);
      positionRef.current.set(startPosition.x, startPosition.y, startPosition.z);
      initialized.current = true;
    }
  }, [camera, startPosition, positionRef]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.code;
      if (k === "KeyW") keys.current.w = true;
      if (k === "KeyA") keys.current.a = true;
      if (k === "KeyS") keys.current.s = true;
      if (k === "KeyD") keys.current.d = true;
      if (k === "ArrowUp") keys.current.ArrowUp = true;
      if (k === "ArrowDown") keys.current.ArrowDown = true;
      if (k === "ArrowLeft") keys.current.ArrowLeft = true;
      if (k === "ArrowRight") keys.current.ArrowRight = true;
      if (k === "Space") { e.preventDefault(); keys.current.Space = true; }
      if (k === "ShiftLeft") keys.current.ShiftLeft = true;
      if (k === "ShiftRight") keys.current.ShiftRight = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = e.code;
      if (k === "KeyW") keys.current.w = false;
      if (k === "KeyA") keys.current.a = false;
      if (k === "KeyS") keys.current.s = false;
      if (k === "KeyD") keys.current.d = false;
      if (k === "ArrowUp") keys.current.ArrowUp = false;
      if (k === "ArrowDown") keys.current.ArrowDown = false;
      if (k === "ArrowLeft") keys.current.ArrowLeft = false;
      if (k === "ArrowRight") keys.current.ArrowRight = false;
      if (k === "Space") keys.current.Space = false;
      if (k === "ShiftLeft") keys.current.ShiftLeft = false;
      if (k === "ShiftRight") keys.current.ShiftRight = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Seed touch yaw/pitch from the initial camera orientation so look starts where the
  // camera is pointing (the gallery faces -Z → yaw 0).
  useEffect(() => {
    if (!isTouchDevice) return;
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
  }, [isTouchDevice, camera]);

  useFrame((_, dt) => {
    if (!isTouchDevice) {
      const locked: boolean = controlsRef.current?.isLocked ?? false;
      onLockChange(locked);
      // If paused (modal open), ensure pointer lock is released
      if (paused && locked) {
        controlsRef.current?.unlock();
        return;
      }
      if (!locked) return;
    } else {
      // Touch mode: no movement until the user has tapped "enter" and no modal is open.
      if (paused || !touchEnabled) return;
      // Apply accumulated look drag → yaw/pitch, then drive the camera directly (YXZ order
      // = yaw around Y then pitch around X, so there's never any roll).
      const lr = lookRef?.current;
      if (lr) {
        yaw.current -= lr.dx * LOOK_SENS;
        pitch.current -= lr.dy * LOOK_SENS;
        pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
        lr.dx = 0; lr.dy = 0;
      }
      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch.current, yaw.current, 0);
    }

    // Clamp the delta time. On a frame hitch (the gallery streams + decodes videos, which
    // routinely stalls a frame), an unclamped dt makes a single step move several metres —
    // far enough to jump straight THROUGH a wall and eject the player outside the building.
    // Capping dt bounds the per-frame step so collision can always catch the wall.
    const clampedDt = Math.min(dt, 0.1);

    // Movement input: analog joystick on touch, keyboard on desktop.
    let mvFwd: number; // forward(+)/back(-)
    let mvStrafe: number; // right(+)/left(-)
    let run = false;
    if (isTouchDevice) {
      const m = moveRef?.current ?? { x: 0, y: 0 };
      mvFwd = m.y;
      mvStrafe = m.x;
    } else {
      const fwd = keys.current.w || keys.current.ArrowUp;
      const bck = keys.current.s || keys.current.ArrowDown;
      const lft = keys.current.a || keys.current.ArrowLeft;
      const rgt = keys.current.d || keys.current.ArrowRight;
      run = keys.current.ShiftLeft || keys.current.ShiftRight;
      mvFwd = (fwd ? 1 : 0) - (bck ? 1 : 0);
      mvStrafe = (rgt ? 1 : 0) - (lft ? 1 : 0);
    }
    const jump = isTouchDevice ? (jumpRef?.current ?? false) : keys.current.Space;
    const isMoving = Math.abs(mvFwd) > 0.05 || Math.abs(mvStrafe) > 0.05;
    const speed = run ? RUN_SPEED : WALK_SPEED;

    // Direction from camera yaw
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

    // Calculate target velocity (analog magnitude clamped to 1 so diagonal isn't faster)
    const targetVel = new THREE.Vector3();
    targetVel.addScaledVector(dir, mvFwd);
    targetVel.addScaledVector(right, mvStrafe);
    if (targetVel.lengthSq() > 1) targetVel.normalize();
    targetVel.multiplyScalar(speed);

    // Very smooth acceleration/deceleration with much lower lerp factor
    const vel = currentVelocity.current;
    const lerpFactor = isMoving ? 5.0 : 4.0;
    vel.lerp(targetVel, lerpFactor * clampedDt);

    // Snap to zero if very slow
    if (!isMoving && vel.length() < 0.01) vel.set(0, 0, 0);

    // Apply horizontal movement with SWEPT collision detection.
    const pos = positionRef.current;
    const playerRadius = 0.5;
    const stepX = vel.x * clampedDt;
    const stepZ = vel.z * clampedDt;
    const moveDist = Math.hypot(stepX, stepZ);

    // Get collidable objects from scene — cached and refreshed every 60 frames
    // (and while still empty, until the GLB has loaded) rather than every frame.
    frameCount.current++;
    if (collidablesRef.current.length === 0 || frameCount.current % 60 === 0) {
      const list: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && (child.userData.isCollidable || child.name?.includes('wall') || child.name?.includes('floor'))) {
          list.push(child);
        }
      });
      collidablesRef.current = list;
    }

    if (moveDist > 1e-5) {
      const dirX = stepX / moveDist;
      const dirZ = stepZ / moveDist;
      // Cast the ray the FULL intended step (plus the body radius), not a fixed 1m. This way a
      // fast move can never skip past a wall — it's always detected within the swept distance,
      // which is what stops the "walked through the wall and got launched outside" ejection.
      raycaster.current.set(
        new THREE.Vector3(pos.x, pos.y + EYE_LEVEL, pos.z),
        new THREE.Vector3(dirX, 0, dirZ),
      );
      raycaster.current.far = moveDist + playerRadius;
      const hits = raycaster.current.intersectObjects(collidablesRef.current, false);
      const wallDist = hits.length > 0 ? hits[0].distance : Infinity;
      if (wallDist < moveDist + playerRadius) {
        // Slide right up to the wall but never past it.
        const allowed = Math.max(0, wallDist - playerRadius);
        pos.x += dirX * allowed;
        pos.z += dirZ * allowed;
        vel.set(0, 0, 0);
      } else {
        pos.x += stepX;
        pos.z += stepZ;
      }
    }

    // Gravity
    if (!isGrounded.current) {
      velocityY.current -= GRAVITY * clampedDt;
    }

    // Jump
    if (jump && isGrounded.current) {
      velocityY.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Apply vertical
    pos.y += velocityY.current * clampedDt;

    // Resolve the floor height under the player: terrain (if provided) or flat FLOOR_Y.
    let floorY = FLOOR_Y;
    if (getGroundY) {
      const g = getGroundY(pos.x, pos.z);
      // Keep last good height when over a gap (e.g. the lake) so we don't fall forever.
      floorY = g !== null && g !== undefined ? g : lastFloorY.current;
      lastFloorY.current = floorY;
    }

    // Floor clamp
    if (pos.y <= floorY) {
      pos.y = floorY;
      velocityY.current = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // Safety leash — only relevant when walking the flat gallery (no custom terrain). If the
    // player has somehow ended up far OUTSIDE the building footprint (a tunnel-through from
    // before this fix, or an extreme hitch), snap them back to the start so they're never
    // stranded "outside, far away, unable to get back in". Bounds are generous — the gallery
    // art spans roughly x[-32..10], z[-12..9], so this only fires on a true ejection.
    if (!getGroundY && (pos.x < -50 || pos.x > 26 || pos.z < -34 || pos.z > 32)) {
      pos.set(startPosition.x, startPosition.y, startPosition.z);
      currentVelocity.current.set(0, 0, 0);
      velocityY.current = 0;
    }

    // No head bob for smoother movement
    camera.position.set(pos.x, pos.y + EYE_LEVEL, pos.z);
  });

  // On touch devices we drive the camera ourselves (PointerLockControls can't lock on touch).
  return isTouchDevice ? null : <PointerLockControls ref={controlsRef} pointerSpeed={0.9} />;
};

export default forwardRef(PlayerControlsInner);
