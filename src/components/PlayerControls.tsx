"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  startPosition: THREE.Vector3;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  onLockChange: (locked: boolean) => void;
  paused: boolean;
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

const PlayerControlsInner = function PlayerControls({ startPosition, positionRef, onLockChange, paused }: Props, ref: React.Ref<PlayerControlsRef>) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Touch controls state
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchLookRef = useRef({ x: 0, y: 0 });
  const touchJumpRef = useRef(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(isMobile());
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
  const headBobT = useRef(0);
  const initialized = useRef(false);
  const currentVelocity = useRef(new THREE.Vector3()); // For smooth acceleration

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

  // Touch controls for mobile
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const halfWidth = window.innerWidth / 2;
        const halfHeight = window.innerHeight / 2;

        // Left side of screen - movement joystick
        if (touch.clientX < halfWidth) {
          touchMoveRef.current.x = touch.clientX;
          touchMoveRef.current.y = touch.clientY;
        }
        // Right side of screen - camera look
        else {
          touchLookRef.current.x = touch.clientX;
          touchLookRef.current.y = touch.clientY;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const halfWidth = window.innerWidth / 2;

        // Left side - movement
        if (touch.clientX < halfWidth) {
          const dx = touch.clientX - touchMoveRef.current.x;
          const dy = touch.clientY - touchMoveRef.current.y;
          // Update movement based on touch position
          keys.current.w = dy < -20;
          keys.current.s = dy > 20;
          keys.current.a = dx < -20;
          keys.current.d = dx > 20;
        }
        // Right side - camera look
        else {
          const dx = touch.clientX - touchLookRef.current.x;
          const dy = touch.clientY - touchLookRef.current.y;
          // Rotate camera based on touch movement
          camera.rotation.y -= dx * 0.005;
          camera.rotation.x -= dy * 0.005;
          // Clamp vertical rotation
          camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
          touchLookRef.current.x = touch.clientX;
          touchLookRef.current.y = touch.clientY;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      // Reset movement when touch ends
      if (e.touches.length === 0) {
        keys.current.w = false;
        keys.current.s = false;
        keys.current.a = false;
        keys.current.d = false;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isTouchDevice, camera]);

  useFrame((_, dt) => {
    const locked: boolean = controlsRef.current?.isLocked ?? false;
    onLockChange(locked);

    // If paused (modal open), ensure pointer lock is released
    if (paused && locked) {
      controlsRef.current?.unlock();
      return;
    }

    // On mobile, always allow movement (no pointer lock)
    if (!locked && !isTouchDevice) return;

    // Use actual delta time - no clamping for smoothest movement
    const clampedDt = dt;

    const fwd = keys.current.w || keys.current.ArrowUp;
    const bck = keys.current.s || keys.current.ArrowDown;
    const lft = keys.current.a || keys.current.ArrowLeft;
    const rgt = keys.current.d || keys.current.ArrowRight;
    const run = keys.current.ShiftLeft || keys.current.ShiftRight;
    const jump = keys.current.Space;
    const isMoving = fwd || bck || lft || rgt;
    const speed = run ? RUN_SPEED : WALK_SPEED;

    // Direction from camera yaw
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

    // Calculate target velocity
    const targetVel = new THREE.Vector3();
    if (fwd) targetVel.add(dir);
    if (bck) targetVel.sub(dir);
    if (lft) targetVel.sub(right);
    if (rgt) targetVel.add(right);
    if (targetVel.lengthSq() > 0) targetVel.normalize().multiplyScalar(speed);

    // Very smooth acceleration/deceleration with much lower lerp factor
    const vel = currentVelocity.current;
    const lerpFactor = isMoving ? 5.0 : 4.0;
    vel.lerp(targetVel, lerpFactor * clampedDt);

    // Snap to zero if very slow
    if (!isMoving && vel.length() < 0.01) vel.set(0, 0, 0);

    // Apply horizontal movement
    const pos = positionRef.current;
    pos.x += vel.x * clampedDt;
    pos.z += vel.z * clampedDt;

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

    // Floor clamp
    if (pos.y <= FLOOR_Y) {
      pos.y = FLOOR_Y;
      velocityY.current = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // No head bob for smoother movement
    camera.position.set(pos.x, pos.y + EYE_LEVEL, pos.z);
  });

  return <PointerLockControls ref={controlsRef} pointerSpeed={0.9} />;
};

export default forwardRef(PlayerControlsInner);
