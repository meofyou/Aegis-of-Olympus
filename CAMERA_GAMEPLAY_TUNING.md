# Camera and Gameplay Tuning Notes

Date: 2026-02-16

This document records the current 1v1 camera/gameplay tuning that feels stable.

## Current Camera Goals

- Keep a third-person behind-the-hero view from battle start.
- Avoid delayed camera follow (camera should move with hero immediately).
- Maintain stable framing during combat without large side swings.
- Show full-body hero while keeping enemy readability.

## Main Camera Constants (`main.js`)

- `CAMERA_THIRD_PERSON_DISTANCE = 8.8`
- `CAMERA_THIRD_PERSON_HEIGHT = 3.8`
- `CAMERA_THIRD_PERSON_SIDE = 0`
- `CAMERA_THIRD_PERSON_LOOK_HEIGHT = 0.72`

## Camera Logic Decisions

- Camera anchor direction is always based on hero facing (`hero.mesh.rotation.y`).
- Position update uses direct copy (no lerp):
  - `camera.position.copy(cameraDesiredPosition)`
  - This removes lagging follow feel.
- Lock-on influence remains only on look target and is intentionally light:
  - `cameraLookTarget.lerp(..., 0.06)`
- Hit shake reduced to keep control readability:
  - `cameraShakeTime = 0.06 + strength * 0.04`
  - `cameraShakeStrength = 0.05 + strength * 0.1`

## Spawn / Opening Framing

- Hero spawn: `(0, 0, 5.8)`
- Minotaur spawn: `(0, 0, -5.8)`
- Hero yaw is initialized to face minotaur at reset.
- `updateCamera()` is called in `resetBattle()` so opening frame starts with correct camera.

## Movement Behavior (for 1v1 feel)

- Movement is camera-relative (`computeCameraRelativeMoveVector`).
- In lock-on state, hero keeps facing enemy while moving.
- Out of lock-on, hero rotates toward move direction.

## Collision / Hit Distance Tuning (current)

- Base colliders:
  - `HERO_COLLIDER_RADIUS = 0.12`
  - `MINOTAUR_COLLIDER_RADIUS = 0.26`
- Runtime collider scaling after model load:
  - `hero.colliderRadius = max(0.08, heroHeight * 0.10)`
  - `minotaur.colliderRadius = max(0.22, minotaurHeight * 0.09)`
- Edge attack ranges:
  - Hero light: `0.16`
  - Hero heavy: `0.36`
  - Minotaur attack: `0.14`
  - Minotaur charge: `0.26`
  - Minotaur slam: `0.62`
- Separation resolver is softened:
  - Ignore near-threshold noise (`minDistance - 0.04`)
  - Per-frame overlap correction capped (`0.05`)

## If Camera Regresses Later

1. Re-check camera direction source: should remain hero-facing based.
2. Ensure no lerp reintroduced on camera position.
3. Keep lock-on target blend low (around `0.05~0.08`).
4. Avoid scaling camera distance/height by hero model height.
