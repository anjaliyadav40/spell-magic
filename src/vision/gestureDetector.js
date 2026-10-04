// =====================================================
// BASIC HAND HELPERS
// =====================================================

export function isFingerUp(
  hand,
  tip,
  pip
) {
  if (
    !hand?.[tip] ||
    !hand?.[pip]
  ) {
    return false;
  }

  return (
    hand[tip].y <
    hand[pip].y
  );
}


// =====================================================
// POINTING
// ☝️ Index UP
// Other fingers DOWN
// =====================================================

export function isPointing(hand) {
  if (!hand) {
    return false;
  }

  return (
    isFingerUp(hand, 8, 6) &&
    !isFingerUp(hand, 12, 10) &&
    !isFingerUp(hand, 16, 14) &&
    !isFingerUp(hand, 20, 18)
  );
}


// =====================================================
// OPEN HAND
// 🖐️ All four fingers UP
// =====================================================

export function isOpenHand(hand) {
  if (!hand) {
    return false;
  }

  return (
    isFingerUp(hand, 8, 6) &&
    isFingerUp(hand, 12, 10) &&
    isFingerUp(hand, 16, 14) &&
    isFingerUp(hand, 20, 18)
  );
}


// =====================================================
// FIST
// ✊ All four fingers DOWN
// =====================================================

export function isFist(hand) {
  if (!hand) {
    return false;
  }

  return (
    !isFingerUp(hand, 8, 6) &&
    !isFingerUp(hand, 12, 10) &&
    !isFingerUp(hand, 16, 14) &&
    !isFingerUp(hand, 20, 18)
  );
}


// =====================================================
// DISTANCE
// =====================================================

export function distance(a, b) {
  if (!a || !b) {
    return Infinity;
  }

  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}


// =====================================================
// PINCH
// 🤏 Thumb + index close together
// =====================================================

export function isPinching(hand) {
  if (
    !hand?.[4] ||
    !hand?.[8]
  ) {
    return false;
  }

  return (
    distance(
      hand[4],
      hand[8]
    ) < 0.075
  );
}


// =====================================================
// L-SHAPE BASE
// ☝️ Index UP
// Middle/Ring/Pinky DOWN
// Thumb direction checked separately
// =====================================================

function isLBase(hand) {
  if (!hand) {
    return false;
  }

  return (
    isFingerUp(hand, 8, 6) &&
    !isFingerUp(hand, 12, 10) &&
    !isFingerUp(hand, 16, 14) &&
    !isFingerUp(hand, 20, 18)
  );
}


// =====================================================
// LEFT L
// =====================================================

export function isLeftLShape(hand) {
  if (!isLBase(hand)) {
    return false;
  }

  if (
    !hand?.[2] ||
    !hand?.[4]
  ) {
    return false;
  }

  // Mirrored camera:
  // left-side hand should have thumb pointing inward/right.
  return (
    hand[4].x <
    hand[2].x
  );
}


// =====================================================
// RIGHT INVERTED L
// =====================================================

export function isRightInvertedLShape(
  hand
) {
  if (!isLBase(hand)) {
    return false;
  }

  if (
    !hand?.[2] ||
    !hand?.[4]
  ) {
    return false;
  }

  // Mirrored camera:
  // right-side hand should have thumb pointing inward/left.
  return (
    hand[4].x >
    hand[2].x
  );
}


// =====================================================
// SCREEN POINT
// Converts MediaPipe coordinates to mirrored screen
// coordinates.
// =====================================================

export function screenPoint(
  landmark
) {
  if (!landmark) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x: 1 - landmark.x,
    y: landmark.y,
  };
}