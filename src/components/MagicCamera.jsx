import { useEffect, useRef, useState } from "react";
import { createHandTracker } from "../vision/handTracker";
import starImageSrc from "../assets/star.png";

/* =========================================================
   ASSETS
========================================================= */

const flowerAssets = Object.values(
  import.meta.glob("../assets/flower/**/*.{png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  })
);

const heartAssets = Object.values(
  import.meta.glob("../assets/heart/**/*.{png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  })
);

/* =========================================================
   SPELLS
========================================================= */

const spells = [
  {
    id: "bloom",
    icon: "🌸",
    name: "Bloom",
  },
  {
    id: "star",
    icon: "⭐",
    name: "Starfall",
  },
  {
    id: "heart",
    icon: "💗",
    name: "Heart",
  },
  {
    id: "thunder",
    icon: "⚡",
    name: "Thunder",
  },
  {
    id: "invisible",
    icon: "🫥",
    name: "Invisible",
  },
];

/* =========================================================
   GESTURE HELPERS
========================================================= */

function isFingerUp(hand, tip, pip) {
  if (!hand?.[tip] || !hand?.[pip]) return false;

  return hand[tip].y < hand[pip].y;
}

function isPointing(hand) {
  return (
    isFingerUp(hand, 8, 6) &&
    !isFingerUp(hand, 12, 10) &&
    !isFingerUp(hand, 16, 14) &&
    !isFingerUp(hand, 20, 18)
  );
}

function isOpenHand(hand) {
  return (
    isFingerUp(hand, 8, 6) &&
    isFingerUp(hand, 12, 10) &&
    isFingerUp(hand, 16, 14) &&
    isFingerUp(hand, 20, 18)
  );
}

function isFist(hand) {
  return (
    !isFingerUp(hand, 8, 6) &&
    !isFingerUp(hand, 12, 10) &&
    !isFingerUp(hand, 16, 14) &&
    !isFingerUp(hand, 20, 18)
  );
}

function distance(a, b) {
  if (!a || !b) return 0;

  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
  );
}

/* =========================================================
   MAGIC CAMERA
========================================================= */

function MagicCamera() {
  /* -------------------------------------------------------
     CAMERA
  ------------------------------------------------------- */

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const streamRef = useRef(null);
  const trackerRef = useRef(null);
  const animationRef = useRef(null);

  const lastTimeRef = useRef(-1);

  /* -------------------------------------------------------
     FLOWER
  ------------------------------------------------------- */

  const flowerImagesRef = useRef([]);
  const flowersRef = useRef([]);

  const previousFlowerFingerRef = useRef(null);
  const lastFlowerTimeRef = useRef(0);

  /* -------------------------------------------------------
     STAR
  ------------------------------------------------------- */

  const starImageRef = useRef(null);
  const starLoadedRef = useRef(false);
  const starsRef = useRef([]);

  const previousStarFingerRef = useRef(null);
  const lastStarActionRef = useRef(0);

  /* -------------------------------------------------------
     HEART
  ------------------------------------------------------- */

  const heartImagesRef = useRef([]);
  const heartsRef = useRef([]);

  const heartTraceRef = useRef([]);
  const previousHeartFingerRef = useRef(null);

  const lastHeartPointRef = useRef(0);
  const lastHeartStampRef = useRef(0);
  const heartBurstRef = useRef(0);
  const heartCreatedRef = useRef(false);

  /* -------------------------------------------------------
     THUNDER
  ------------------------------------------------------- */

  const thunderPulseRef = useRef(0);
  const thunderFlashRef = useRef(0);
  const thunderPointsRef = useRef(null);

  /* -------------------------------------------------------
     INVISIBLE
  ------------------------------------------------------- */

  const invisibleRectRef = useRef(null);
  const invisibleActivatedRef = useRef(false);
  const invisiblePlateRef = useRef(null);
  const invisiblePlateRectRef = useRef(null);

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  const [cameraReady, setCameraReady] =
    useState(false);

  const [trackingReady, setTrackingReady] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [selectedSpell, setSelectedSpell] =
    useState("bloom");

  const [handDetected, setHandDetected] =
    useState(false);

  const [gesture, setGesture] =
    useState("Show your hand");

  /* Prevent React from rerendering
     the UI unnecessarily every frame. */

  const lastGestureRef = useRef("");
  const lastHandStateRef = useRef(false);

  function updateGesture(text) {
    if (lastGestureRef.current !== text) {
      lastGestureRef.current = text;
      setGesture(text);
    }
  }

  /* =======================================================
     LOAD FLOWERS
  ======================================================= */

  useEffect(() => {
    const images = [];

    flowerAssets.forEach((src) => {
      const image = new Image();

      image.onload = () => {
        images.push(image);
      };

      image.src = src;
    });

    flowerImagesRef.current = images;
  }, []);

  /* =======================================================
     LOAD HEARTS
  ======================================================= */

  useEffect(() => {
    const images = [];

    heartAssets.forEach((src) => {
      const image = new Image();

      image.onload = () => {
        images.push(image);
      };

      image.src = src;
    });

    heartImagesRef.current = images;
  }, []);

  /* =======================================================
     LOAD STAR
  ======================================================= */

  useEffect(() => {
    const image = new Image();

    image.onload = () => {
      starImageRef.current = image;
      starLoadedRef.current = true;
    };

    image.onerror = () => {
      starImageRef.current = null;
      starLoadedRef.current = false;
      console.warn("star.png could not be loaded.");
    };

    image.src = starImageSrc;
  }, []);

  /* =======================================================
     CHANGE SPELL
  ======================================================= */

  useEffect(() => {
    /* Clear visual effects from the previous spell. */

    flowersRef.current = [];
    starsRef.current = [];
    heartsRef.current = [];

    heartTraceRef.current = [];

    previousFlowerFingerRef.current = null;
    previousStarFingerRef.current = null;
    previousHeartFingerRef.current = null;

    lastFlowerTimeRef.current = 0;
    lastStarActionRef.current = 0;
    lastHeartPointRef.current = 0;
    lastHeartStampRef.current = 0;
    heartBurstRef.current = 0;
    heartCreatedRef.current = false;

    thunderPulseRef.current = 0;
    thunderFlashRef.current = 0;
    thunderPointsRef.current = null;
    invisibleRectRef.current = null;
    invisibleActivatedRef.current = false;
    invisiblePlateRef.current = null;
    invisiblePlateRectRef.current = null;

    if (selectedSpell === "bloom") {
      updateGesture(
        "☝️ Point to grow flowers"
      );
    }

    if (selectedSpell === "star") {
      updateGesture(
        "☝️ Point to place a star"
      );
    }

    if (selectedSpell === "heart") {
      updateGesture(
        "☝️ Draw a heart with your finger"
      );
    }

    if (selectedSpell === "thunder") {
      updateGesture(
        "☝️ Point with both hands"
      );
    }

    if (selectedSpell === "invisible") {
      updateGesture(
        "🤏 Pinch with both hands to activate"
      );
    }
  }, [selectedSpell]);

  /* =======================================================
     CAMERA SETUP
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        setCameraError("");

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: {
                ideal: 1920,
              },
              height: {
                ideal: 1080,
              },
            },
            audio: false,
          });

        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        setCameraReady(true);

        const tracker =
          await createHandTracker();

        if (!mounted) return;

        trackerRef.current = tracker;
        setTrackingReady(true);
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setCameraError(
          "Unable to start the magical chamber."
        );
      }
    }

    setup();

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  /* =======================================================
     TRACKING LOOP
  ======================================================= */

  useEffect(() => {
    if (
      !cameraReady ||
      !trackingReady
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      !trackerRef.current
    ) {
      return;
    }

    canvas.width =
      video.videoWidth ||
      window.innerWidth;

    canvas.height =
      video.videoHeight ||
      window.innerHeight;

    const ctx =
      canvas.getContext("2d");

    function detect() {
      if (
        video.readyState < 2 ||
        !trackerRef.current
      ) {
        animationRef.current =
          requestAnimationFrame(detect);

        return;
      }

      const now =
        performance.now();

      if (
        now <= lastTimeRef.current
      ) {
        animationRef.current =
          requestAnimationFrame(detect);

        return;
      }

      lastTimeRef.current = now;

      try {
        const result =
          trackerRef.current.detectForVideo(
            video,
            now
          );

        drawMagicScene(
          ctx,
          canvas,
          result
        );
      } catch (error) {
        console.error(
          "Tracking error:",
          error
        );
      }

      animationRef.current =
        requestAnimationFrame(detect);
    }

    detect();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    cameraReady,
    trackingReady,
    selectedSpell,
  ]);

  /* =======================================================
     MAIN SCENE
  ======================================================= */

  function drawMagicScene(
    ctx,
    canvas,
    result
  ) {
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const hands =
      result?.landmarks || [];

    const hasHand =
      hands.length > 0;

    if (
      hasHand !==
      lastHandStateRef.current
    ) {
      lastHandStateRef.current =
        hasHand;

      setHandDetected(
        hasHand
      );
    }

    /* Draw only the selected spell. */

    if (
      selectedSpell === "bloom"
    ) {
      drawFlowers(ctx);
    }

    if (
      selectedSpell === "star"
    ) {
      drawStars(ctx);
    }

    if (
      selectedSpell === "heart"
    ) {
      drawHearts(ctx);
    }

    if (
      selectedSpell === "thunder"
    ) {
      drawThunder(ctx);
    }

    if (
      selectedSpell === "invisible"
    ) {
      drawInvisible(ctx);
    }

    /* No hand */

    if (!hands.length) {
      previousFlowerFingerRef.current =
        null;

      previousStarFingerRef.current =
        null;

      previousHeartFingerRef.current =
        null;

      if (
        selectedSpell ===
        "bloom"
      ) {
        updateGesture(
          "☝️ Point to grow flowers"
        );
      }

      if (
        selectedSpell ===
        "star"
      ) {
        updateGesture(
          "☝️ Point to place a star"
        );
      }

      if (
        selectedSpell ===
        "heart"
      ) {
        updateGesture(
          "☝️ Draw a heart with your finger"
        );
      }

      if (
        selectedSpell ===
        "thunder"
      ) {
        updateGesture(
          "☝️ Point with both hands"
        );
      }

      if (
        selectedSpell ===
        "invisible"
      ) {
        updateGesture(
          "🤏 Pinch both hands → L + inverted L"
        );
      }

      invisibleRectRef.current = null;
      invisiblePlateRef.current = null;
      invisiblePlateRectRef.current = null;
      thunderPointsRef.current = null;
      thunderPulseRef.current = 0;

      return;
    }

    /* Thin skeleton */

    hands.forEach((hand) => {
      drawHandSkeleton(
        ctx,
        canvas,
        hand
      );
    });

    /* Selected spell */

    if (
      selectedSpell === "bloom"
    ) {
      handleFlowerSpell(
        hands[0],
        canvas
      );
    }

    if (
      selectedSpell === "star"
    ) {
      handleStarSpell(
        hands[0],
        canvas
      );
    }

    if (
      selectedSpell === "heart"
    ) {
      handleHeartSpell(
        hands[0],
        canvas
      );
    }

    if (
      selectedSpell === "thunder"
    ) {
      handleThunderSpell(
        hands,
        canvas
      );
    }

    if (
      selectedSpell === "invisible"
    ) {
      handleInvisibleSpell(
        hands,
        canvas
      );

      // Draw the hide-window AFTER gesture detection,
      // so the current frame is covered immediately.
      drawInvisible(ctx);
    }
  }

  /* =======================================================
     ⚡ THUNDER
  ======================================================= */

  function handleThunderSpell(
    hands,
    canvas
  ) {
    /*
      Two hands + both index fingers pointing
      = lightning between the fingertips.
    */

    if (
      hands.length < 2 ||
      !isPointing(hands[0]) ||
      !isPointing(hands[1])
    ) {
      thunderPulseRef.current = 0;
      thunderPointsRef.current = null;

      updateGesture(
        "☝️ Point with both hands"
      );

      return;
    }

    const leftHand =
      hands[0];

    const rightHand =
      hands[1];

    const a = {
      x:
        (1 - leftHand[8].x) *
        canvas.width,
      y:
        leftHand[8].y *
        canvas.height,
    };

    const b = {
      x:
        (1 - rightHand[8].x) *
        canvas.width,
      y:
        rightHand[8].y *
        canvas.height,
    };

    updateGesture(
      "⚡ Thunder between your hands!"
    );

    thunderPointsRef.current = {
      a,
      b,
    };

    thunderPulseRef.current =
      Math.min(
        1,
        thunderPulseRef.current +
          0.08
      );

    thunderFlashRef.current =
      performance.now();
  }

  function drawThunder(ctx) {
    /*
      Lightning is drawn only when two
      pointing hands are active.
      drawMagicScene calls the handler first,
      so the pulse tells us whether to show it.
    */

    if (
      thunderPulseRef.current <= 0
    ) {
      return;
    }

    /*
      The endpoints are stored from the latest
      two-hand detection in these refs.
    */
    const points =
      thunderPointsRef.current;

    if (
      !points?.a ||
      !points?.b
    ) {
      thunderPulseRef.current *=
        0.9;

      return;
    }

    const a =
      points.a;

    const b =
      points.b;

    const dx =
      b.x - a.x;

    const dy =
      b.y - a.y;

    const length =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    if (length < 20) {
      thunderPulseRef.current *=
        0.9;

      return;
    }

    const nx =
      -dy / length;

    const ny =
      dx / length;

    ctx.save();

    /*
      Outer electric glow.
    */
    for (
      let layer = 0;
      layer < 3;
      layer++
    ) {
      ctx.beginPath();

      const segments = 12;

      for (
        let i = 0;
        i <= segments;
        i++
      ) {
        const t =
          i / segments;

        const baseX =
          a.x +
          dx * t;

        const baseY =
          a.y +
          dy * t;

        const wave =
          i === 0 ||
          i === segments
            ? 0
            : Math.sin(
                t * Math.PI * 6 +
                  performance.now() *
                    0.02
              ) *
              (10 +
                Math.random() *
                  18);

        const x =
          baseX +
          nx * wave;

        const y =
          baseY +
          ny * wave;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth =
        layer === 0
          ? 7
          : layer === 1
          ? 4
          : 2;

      ctx.strokeStyle =
        layer === 0
          ? "rgba(120,190,255,0.18)"
          : layer === 1
          ? "rgba(180,220,255,0.5)"
          : "#ffffff";

      ctx.shadowColor =
        "rgba(100,180,255,0.95)";

      ctx.shadowBlur =
        layer === 0
          ? 25
          : 12;

      ctx.stroke();
    }

    ctx.restore();

    thunderPulseRef.current *=
      0.96;
  }

  /* -------------------------------------------------------
     Keep the latest thunder endpoints.
  ------------------------------------------------------- */


  /* =======================================================
     🫥 INVISIBLE
  ======================================================= */

  function isPinching(hand) {
    if (!hand?.[4] || !hand?.[8]) return false;

    // Activation gesture: thumb and index come close together.
    return distance(hand[4], hand[8]) < 0.075;
  }

  function getScreenPoint(hand, index) {
    return {
      x: (1 - hand[index].x),
      y: hand[index].y,
    };
  }

  function isLeftLShape(hand) {
    if (!hand?.[4] || !hand?.[2] || !hand?.[8] || !hand?.[6]) {
      return false;
    }

    const indexUp = isFingerUp(hand, 8, 6);
    const middleDown = !isFingerUp(hand, 12, 10);
    const ringDown = !isFingerUp(hand, 16, 14);
    const pinkyDown = !isFingerUp(hand, 20, 18);

    // On the left side of the mirrored camera, the thumb points inward/right.
    const thumbPointsRight = hand[4].x < hand[2].x;

    return (
      indexUp &&
      middleDown &&
      ringDown &&
      pinkyDown &&
      thumbPointsRight
    );
  }

  function isRightInvertedLShape(hand) {
    if (!hand?.[4] || !hand?.[2] || !hand?.[8] || !hand?.[6]) {
      return false;
    }

    const indexUp = isFingerUp(hand, 8, 6);
    const middleDown = !isFingerUp(hand, 12, 10);
    const ringDown = !isFingerUp(hand, 16, 14);
    const pinkyDown = !isFingerUp(hand, 20, 18);

    // On the right side of the mirrored camera, the thumb points inward/left.
    const thumbPointsLeft = hand[4].x > hand[2].x;

    return (
      indexUp &&
      middleDown &&
      ringDown &&
      pinkyDown &&
      thumbPointsLeft
    );
  }

  function hasThumbAndIndexGesture(hand) {
    return isLeftLShape(hand) || isRightInvertedLShape(hand);
  }

  function handleInvisibleSpell(hands, canvas) {
    /*
      INVISIBLE SPELL — TWO STEP GESTURE

      STEP 1:
        🤏 LEFT + 🤏 RIGHT
        Both hands pinch thumb + index to activate.

      STEP 2:
        LEFT  -> L shape
        RIGHT -> inverted L shape (_|

      Only after the pinch activation do we create the
      invisible window. The L shapes define its corners.
    */

    if (hands.length < 2) {
      invisibleActivatedRef.current = false;
      invisibleRectRef.current = null;
      updateGesture("🫥 Pinch with both hands to activate");
      return;
    }

    const handA = hands[0];
    const handB = hands[1];

    // Sort by screen position so we know which hand is on each side.
    const centerA = 1 - handA[9].x;
    const centerB = 1 - handB[9].x;

    const leftHand = centerA < centerB ? handA : handB;
    const rightHand = centerA < centerB ? handB : handA;

    // STEP 1: both hands pinch to arm the invisible window.
    if (!invisibleActivatedRef.current) {
      const bothPinching =
        isPinching(leftHand) &&
        isPinching(rightHand);

      invisibleRectRef.current = null;

      if (bothPinching) {
        invisibleActivatedRef.current = true;
        updateGesture("🪄 Activated — open both hands into L shapes");
      } else {
        updateGesture("🤏 Pinch with both hands to activate");
      }

      return;
    }

    // STEP 2: after activation, require L on left and inverted L on right.
    const leftIsL = isLeftLShape(leftHand);
    const rightIsInvertedL = isRightInvertedLShape(rightHand);

    if (!leftIsL || !rightIsInvertedL) {
      invisibleRectRef.current = null;
      invisiblePlateRef.current = null;
      invisiblePlateRectRef.current = null;

      updateGesture("🫥 Left = L   •   Right = inverted L");
      return;
    }

    const leftIndex = getScreenPoint(leftHand, 8);
    const leftThumb = getScreenPoint(leftHand, 4);
    const rightIndex = getScreenPoint(rightHand, 8);
    const rightThumb = getScreenPoint(rightHand, 4);

    // The two L shapes provide the four rectangle corners.
    const points = [
      {
        x: leftThumb.x * canvas.width,
        y: leftThumb.y * canvas.height,
      },
      {
        x: leftIndex.x * canvas.width,
        y: leftIndex.y * canvas.height,
      },
      {
        x: rightThumb.x * canvas.width,
        y: rightThumb.y * canvas.height,
      },
      {
        x: rightIndex.x * canvas.width,
        y: rightIndex.y * canvas.height,
      },
    ];

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);

    const width = right - left;
    const height = bottom - top;

    if (width < 100 || height < 100) {
      invisibleRectRef.current = null;
      updateGesture("🫥 Move your L hands farther apart");
      return;
    }

    invisibleRectRef.current = {
      x: left,
      y: top,
      width,
      height,
    };

    updateGesture("🫥 Invisible window active");
  }

  function buildInvisiblePlate(rect, canvas) {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const plate = document.createElement("canvas");
    plate.width = canvas.width;
    plate.height = canvas.height;

    const pctx = plate.getContext("2d");
    if (!pctx) return null;

    // Capture the current room, mirrored exactly like the webcam.
    pctx.save();
    pctx.translate(plate.width, 0);
    pctx.scale(-1, 1);
    pctx.drawImage(
      video,
      0,
      0,
      plate.width,
      plate.height
    );
    pctx.restore();

    const temp = document.createElement("canvas");
    temp.width = Math.max(1, Math.ceil(rect.width));
    temp.height = Math.max(1, Math.ceil(rect.height));

    const tctx = temp.getContext("2d");
    if (!tctx) return null;

    const sideW = Math.max(
      12,
      Math.min(rect.width * 0.24, 110)
    );

    const bandH = Math.max(
      12,
      Math.min(rect.height * 0.24, 90)
    );

    /*
      Build the portal from pixels immediately around it.
      This removes the solid blue/black box and makes the
      inside look like the surrounding room.
    */

    tctx.save();
    tctx.filter = "blur(3px)";
    tctx.globalAlpha = 0.5;

    // Left side -> full window.
    tctx.drawImage(
      plate,
      Math.max(0, rect.x - sideW),
      rect.y,
      sideW,
      rect.height,
      0,
      0,
      temp.width,
      temp.height
    );

    // Right side -> full window.
    tctx.drawImage(
      plate,
      Math.min(
        plate.width - sideW,
        rect.x + rect.width
      ),
      rect.y,
      sideW,
      rect.height,
      0,
      0,
      temp.width,
      temp.height
    );

    tctx.restore();

    tctx.save();
    tctx.filter = "blur(3px)";
    tctx.globalAlpha = 0.5;

    // Top -> full window.
    tctx.drawImage(
      plate,
      rect.x,
      Math.max(0, rect.y - bandH),
      rect.width,
      bandH,
      0,
      0,
      temp.width,
      temp.height
    );

    // Bottom -> full window.
    tctx.drawImage(
      plate,
      rect.x,
      Math.min(
        plate.height - bandH,
        rect.y + rect.height
      ),
      rect.width,
      bandH,
      0,
      0,
      temp.width,
      temp.height
    );

    tctx.restore();

    const finalPlate = document.createElement("canvas");
    finalPlate.width = temp.width;
    finalPlate.height = temp.height;

    const fctx = finalPlate.getContext("2d");
    if (!fctx) return null;

    fctx.filter = "blur(4px)";
    fctx.drawImage(temp, 0, 0);

    return finalPlate;
  }

  function drawInvisible(ctx) {
    const rect = invisibleRectRef.current;
    if (!rect) return;

    const old = invisiblePlateRectRef.current;

    const moved =
      !old ||
      Math.abs(old.x - rect.x) > 20 ||
      Math.abs(old.y - rect.y) > 20 ||
      Math.abs(old.width - rect.width) > 20 ||
      Math.abs(old.height - rect.height) > 20;

    if (!invisiblePlateRef.current || moved) {
      invisiblePlateRef.current =
        buildInvisiblePlate(
          rect,
          ctx.canvas
        );

      invisiblePlateRectRef.current = {
        ...rect,
      };
    }

    ctx.save();

    // Hide the person with the surrounding-room plate.
    if (invisiblePlateRef.current) {
      ctx.beginPath();
      ctx.rect(
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
      ctx.clip();

      ctx.drawImage(
        invisiblePlateRef.current,
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
    }

    ctx.restore();

    // Reference-style yellow portal outline.
    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,226,75,0.95)";
    ctx.shadowColor = "rgba(255,220,80,0.45)";
    ctx.shadowBlur = 8;

    ctx.strokeRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );

    const corner = Math.min(
      30,
      Math.max(16, rect.width * 0.055)
    );

    ctx.lineWidth = 3;
    ctx.beginPath();

    // Top-left
    ctx.moveTo(rect.x, rect.y + corner);
    ctx.lineTo(rect.x, rect.y);
    ctx.lineTo(rect.x + corner, rect.y);

    // Top-right
    ctx.moveTo(
      rect.x + rect.width - corner,
      rect.y
    );
    ctx.lineTo(
      rect.x + rect.width,
      rect.y
    );
    ctx.lineTo(
      rect.x + rect.width,
      rect.y + corner
    );

    // Bottom-right
    ctx.moveTo(
      rect.x + rect.width,
      rect.y + rect.height - corner
    );
    ctx.lineTo(
      rect.x + rect.width,
      rect.y + rect.height
    );
    ctx.lineTo(
      rect.x + rect.width - corner,
      rect.y + rect.height
    );

    // Bottom-left
    ctx.moveTo(
      rect.x + corner,
      rect.y + rect.height
    );
    ctx.lineTo(
      rect.x,
      rect.y + rect.height
    );
    ctx.lineTo(
      rect.x,
      rect.y + rect.height - corner
    );

    ctx.stroke();
    ctx.restore();
  }

  /* =======================================================
     🌸 BLOOM
  ======================================================= */

  function handleFlowerSpell(
    hand,
    canvas
  ) {
    if (isPointing(hand)) {
      updateGesture(
        "☝️ Point to grow flowers"
      );

      const finger =
        hand[8];

      const x =
        (1 - finger.x) *
        canvas.width;

      const y =
        finger.y *
        canvas.height;

      const movedEnough =
        !previousFlowerFingerRef.current ||
        distance(
          finger,
          previousFlowerFingerRef.current
        ) > 0.025;

      if (movedEnough) {
        createFlower(
          x,
          y
        );
      }

      previousFlowerFingerRef.current =
        {
          x: finger.x,
          y: finger.y,
        };

      return;
    }

    if (isFist(hand)) {
      updateGesture(
        "✊ Magic frozen"
      );

      previousFlowerFingerRef.current =
        null;

      return;
    }

    if (isOpenHand(hand)) {
      updateGesture(
        "🖐️ Shatter the flowers!"
      );

      shatterFlowers();

      previousFlowerFingerRef.current =
        null;

      return;
    }

    previousFlowerFingerRef.current =
      null;
  }

  /* =======================================================
     CREATE FLOWER
  ======================================================= */

  function createFlower(
    x,
    y
  ) {
    const images =
      flowerImagesRef.current;

    if (!images.length) return;

    const image =
      images[
        Math.floor(
          Math.random() *
            images.length
        )
      ];

    const spread = 35;

    flowersRef.current.push({
      image,

      x:
        x +
        (Math.random() -
          0.5) *
          spread,

      y:
        y +
        (Math.random() -
          0.5) *
          spread,

      size:
        60 +
        Math.random() *
          45,

      rotation:
        Math.random() *
        Math.PI *
        2,

      rotationSpeed:
        (Math.random() -
          0.5) *
        0.08,

      vx: 0,
      vy: 0,

      life: 1,

      shattering: false,
    });

    if (
      flowersRef.current.length >
      100
    ) {
      flowersRef.current.splice(
        0,
        40
      );
    }
  }

  /* =======================================================
     DRAW FLOWERS
  ======================================================= */

  function drawFlowers(ctx) {
    const flowers =
      flowersRef.current;

    for (
      let i =
        flowers.length - 1;
      i >= 0;
      i--
    ) {
      const flower =
        flowers[i];

      if (
        flower.shattering
      ) {
        flower.x +=
          flower.vx;

        flower.y +=
          flower.vy;

        flower.vx *=
          0.99;

        flower.vy +=
          0.12;

        flower.rotation +=
          flower.rotationSpeed;

        flower.life -=
          0.025;
      }

      if (
        flower.life <= 0
      ) {
        flowers.splice(
          i,
          1
        );

        continue;
      }

      ctx.save();

      ctx.globalAlpha =
        flower.life;

      ctx.translate(
        flower.x,
        flower.y
      );

      ctx.rotate(
        flower.rotation
      );

      /* No glow on shatter. */

      ctx.drawImage(
        flower.image,
        -flower.size / 2,
        -flower.size / 2,
        flower.size,
        flower.size
      );

      ctx.restore();
    }
  }

  /* =======================================================
     SHATTER FLOWERS
  ======================================================= */

  function shatterFlowers() {
    flowersRef.current.forEach(
      (flower) => {
        if (
          flower.shattering
        ) {
          return;
        }

        flower.shattering =
          true;

        const angle =
          Math.random() *
          Math.PI *
          2;

        const speed =
          5 +
          Math.random() *
            10;

        flower.vx =
          Math.cos(angle) *
          speed;

        flower.vy =
          Math.sin(angle) *
            speed -
          4;

        flower.rotationSpeed =
          (Math.random() -
            0.5) *
          0.15;
      }
    );
  }

  /* =======================================================
     ⭐ STARFALL
  ======================================================= */

  function handleStarSpell(
    hand,
    canvas
  ) {
    if (isPointing(hand)) {
      updateGesture(
        "☝️ Point to place a star"
      );

      const finger =
        hand[8];

      const x =
        (1 - finger.x) *
        canvas.width;

      const y =
        finger.y *
        canvas.height;

      const movedEnough =
        !previousStarFingerRef.current ||
        distance(
          finger,
          previousStarFingerRef.current
        ) > 0.025;

      if (movedEnough) {
        createStar(
          x,
          y
        );
      }

      previousStarFingerRef.current =
        {
          x: finger.x,
          y: finger.y,
        };

      return;
    }

    if (isFist(hand)) {
      updateGesture(
        "✊ Close your fist to light them"
      );

      previousStarFingerRef.current =
        null;

      chargeStars();

      return;
    }

    if (isOpenHand(hand)) {
      updateGesture(
        "🖐️ Open your hand and make a wish!"
      );

      const now =
        performance.now();

      if (
        now -
          lastStarActionRef.current >
          450
      ) {
        shootStarsFromHand(
          hand,
          canvas
        );

        lastStarActionRef.current =
          now;
      }

      previousStarFingerRef.current =
        null;

      return;
    }

    // IMPORTANT:
    // Stars are created ONLY in the isPointing() block above.
    // Any other hand pose can control existing stars, but cannot
    // create a new one.
    previousStarFingerRef.current =
      null;
  }

  /* =======================================================
     CREATE STAR
  ======================================================= */

  function createStar(
    x,
    y
  ) {
    starsRef.current.push({
      image:
        starLoadedRef.current
          ? starImageRef.current
          : null,

      x,
      y,

      size:
        60 +
        Math.random() *
          35,

      rotation:
        Math.random() *
        Math.PI *
        2,

      rotationSpeed:
        (Math.random() -
          0.5) *
        0.025,

      vx: 0,
      vy: 0,

      life: 1,

      scale: 1,

      charging: false,

      chargeAmount: 0,

      shooting: false,

      twinkle:
        Math.random() *
        Math.PI *
        2,

      trailLength:
        90 +
        Math.random() *
          120,

      // Curved left-to-right flight
      curveStartX: x,
      curveStartY: y,
      curveT: 0,
      curveAmplitude:
        70 +
        Math.random() * 100,
      curveFrequency:
        0.018 +
        Math.random() * 0.008,
      curvePhase:
        (Math.random() - 0.5) *
        1.5,
    });

    if (
      starsRef.current.length >
      100
    ) {
      starsRef.current.splice(
        0,
        30
      );
    }
  }

  /* =======================================================
     CHARGE STARS
  ======================================================= */

  function chargeStars() {
    starsRef.current.forEach(
      (star) => {
        if (
          star.shooting
        ) {
          return;
        }

        star.charging =
          true;

        star.chargeAmount =
          Math.min(
            1,
            star.chargeAmount +
              0.035
          );
      }
    );
  }

  /* =======================================================
     SHOOT STARS
  ======================================================= */

  function shootStarsFromHand(
    hand,
    canvas
  ) {
    /*
      All stars travel LEFT -> RIGHT,
      but on a smooth curved path.
    */

    starsRef.current.forEach(
      (star) => {
        if (star.shooting) return;

        star.curveStartX =
          star.x;

        star.curveStartY =
          star.y;

        star.curveT = 0;

        star.curveAmplitude =
          55 +
          Math.random() * 95;

        star.curveFrequency =
          0.018 +
          Math.random() * 0.008;

        star.curvePhase =
          (Math.random() - 0.5) *
          1.2;

        star.vx =
          10 +
          Math.random() * 4;

        star.vy = 0;

        star.shooting = true;
        star.charging = false;

        star.scale = 1.08;

        star.rotationSpeed =
          (Math.random() - 0.5) *
          0.18;

        star.trailLength =
          100 +
          Math.random() * 100;
      }
    );
  }

  /* =======================================================
     DRAW STARS
  ======================================================= */

  function drawStars(ctx) {
    const stars =
      starsRef.current;

    for (
      let i =
        stars.length - 1;
      i >= 0;
      i--
    ) {
      const star =
        stars[i];

      if (
        star.shooting
      ) {
        /*
          Move forward horizontally and
          calculate Y from a sine curve.
        */
        star.curveT +=
          star.vx;

        star.x =
          star.curveStartX +
          star.curveT;

        star.y =
          star.curveStartY +
          Math.sin(
            star.curveT *
              star.curveFrequency +
              star.curvePhase
          ) *
            star.curveAmplitude;

        star.rotation +=
          star.rotationSpeed;

        star.life -=
          0.014;
      }

      star.twinkle += 0.08;

      if (
        star.charging
      ) {
        star.rotation +=
          star.rotationSpeed;

        const pulse =
          Math.sin(
            performance.now() *
              0.012
          ) *
          0.06;

        star.scale =
          1.08 +
          star.chargeAmount *
            0.16 +
          pulse;
      }

      if (
        star.life <= 0 ||
        star.x < -400 ||
        star.x >
          ctx.canvas.width +
            400 ||
        star.y < -400 ||
        star.y >
          ctx.canvas.height +
            400
      ) {
        stars.splice(
          i,
          1
        );

        continue;
      }

      if (
        star.shooting
      ) {
        drawStarTrail(
          ctx,
          star
        );
      }

      ctx.save();

      ctx.globalAlpha =
        star.life;

      ctx.translate(
        star.x,
        star.y
      );

      ctx.rotate(
        star.rotation
      );

      const twinklePulse =
        1 +
        Math.sin(star.twinkle) *
          0.08;

      const size =
        star.size *
        star.scale *
        twinklePulse;

      if (star.shooting) {
        ctx.shadowColor =
          "rgba(255,245,165,0.95)";
        ctx.shadowBlur = 18;
      }

      if (
        star.charging
      ) {
        ctx.shadowColor =
          "rgba(255,245,160,0.95)";

        ctx.shadowBlur =
          18 +
          star.chargeAmount *
            28;
      }

      if (star.image) {
        ctx.drawImage(
          star.image,
          -size / 2,
          -size / 2,
          size,
          size
        );
      } else {
        drawFallbackStar(
          ctx,
          size
        );
      }

      ctx.restore();
    }
  }

  /* =======================================================
     FALLBACK STAR
  ======================================================= */

  function drawFallbackStar(
    ctx,
    size
  ) {
    const outer =
      size / 2;

    const inner =
      outer * 0.42;

    ctx.beginPath();

    for (
      let i = 0;
      i < 10;
      i++
    ) {
      const angle =
        -Math.PI / 2 +
        (i * Math.PI) / 5;

      const radius =
        i % 2 === 0
          ? outer
          : inner;

      const x =
        Math.cos(angle) *
        radius;

      const y =
        Math.sin(angle) *
        radius;

      if (i === 0) {
        ctx.moveTo(
          x,
          y
        );
      } else {
        ctx.lineTo(
          x,
          y
        );
      }
    }

    ctx.closePath();

    ctx.fillStyle =
      "#fff4a8";

    ctx.shadowColor =
      "rgba(255,240,150,0.9)";

    ctx.shadowBlur = 12;

    ctx.fill();
  }

  /* =======================================================
     STAR TRAIL
  ======================================================= */

  function drawStarTrail(
    ctx,
    star
  ) {
    const curveT =
      star.curveT || 0;

    const curveSlope =
      Math.cos(
        curveT *
          (star.curveFrequency || 0.02) +
          (star.curvePhase || 0)
      ) *
      (star.curveAmplitude || 0) *
      (star.curveFrequency || 0.02);

    const angle =
      Math.atan2(
        curveSlope,
        1
      );

    const length =
      star.trailLength ||
      100;

    const startX =
      star.x -
      Math.cos(angle) *
        10;

    const startY =
      star.y -
      Math.sin(angle) *
        10;

    const endX =
      star.x -
      Math.cos(angle) *
        length;

    const endY =
      star.y -
      Math.sin(angle) *
        length;

    const gradient =
      ctx.createLinearGradient(
        startX,
        startY,
        endX,
        endY
      );

    gradient.addColorStop(
      0,
      "rgba(255,255,255,0.95)"
    );

    gradient.addColorStop(
      0.25,
      "rgba(255,245,170,0.65)"
    );

    gradient.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
      startX,
      startY
    );

    ctx.lineTo(
      endX,
      endY
    );

    ctx.lineWidth = 2;

    ctx.strokeStyle =
      gradient;

    ctx.shadowColor =
      "rgba(255,245,180,0.7)";

    ctx.shadowBlur = 6;

    ctx.stroke();

    ctx.restore();
  }

  /* =======================================================
     💗 HEART MAGIC
  ======================================================= */

  function handleHeartSpell(
    hand,
    canvas
  ) {
    /*
      💗 HEART FLOW

      1. ☝️ Point and trace ONE heart.
         We only draw the finger path.
      2. ✊ Close the hand.
         The line disappears and becomes
         ONE real heart.
      3. 🖐️ Open hand.
         The finished heart beats.
    */

    if (isPointing(hand)) {
      /*
        Starting a new drawing after a previous
        heart automatically clears the old heart.
      */
      if (heartCreatedRef.current) {
        heartsRef.current = [];
        heartTraceRef.current = [];
        heartCreatedRef.current = false;
      }

      updateGesture(
        "☝️ Trace a heart"
      );

      const finger = hand[8];

      const x =
        (1 - finger.x) *
        canvas.width;

      const y =
        finger.y *
        canvas.height;

      const movedEnough =
        !previousHeartFingerRef.current ||
        distance(
          finger,
          previousHeartFingerRef.current
        ) > 0.008;

      if (movedEnough) {
        heartTraceRef.current.push({
          x,
          y,
        });

        /*
          Keep enough points for a smooth line,
          but prevent unlimited memory growth.
        */
        if (
          heartTraceRef.current.length >
          300
        ) {
          heartTraceRef.current.shift();
        }
      }

      previousHeartFingerRef.current = {
        x: finger.x,
        y: finger.y,
      };

      return;
    }

    /*
      ✊ CLOSE HAND
      Turn the complete traced line into
      ONE heart.
    */

    if (isFist(hand)) {
      updateGesture(
        "✊ Heart created!"
      );

      previousHeartFingerRef.current =
        null;

      if (
        !heartCreatedRef.current &&
        heartTraceRef.current.length >= 15
      ) {
        createHeartFromTrace(
          canvas
        );

        heartCreatedRef.current = true;

        /*
          Remove the drawing line after
          the heart is created.
        */
        heartTraceRef.current = [];
      }

      return;
    }

    /*
      🖐️ OPEN HAND
      Only animate the already-created heart.
    */

    if (isOpenHand(hand)) {
      updateGesture(
        "🖐️ Make your heart beat!"
      );

      previousHeartFingerRef.current =
        null;

      if (
        heartsRef.current.length > 0
      ) {
        const now =
          performance.now();

        if (
          now -
            heartBurstRef.current >
            350
        ) {
          pumpHearts();

          heartBurstRef.current =
            now;
        }
      }

      return;
    }

    previousHeartFingerRef.current =
      null;
  }

  function nowSinceLastHeart() {
    return (
      performance.now() -
      lastHeartPointRef.current
    );
  }

  /* =======================================================
     CREATE HEART
  ======================================================= */

  function createHeartAt(x, y) {
    const images =
      heartImagesRef.current;

    const image =
      images.length
        ? images[
            Math.floor(
              Math.random() *
                images.length
            )
          ]
        : null;

    heartsRef.current.push({
      image,

      x:
        x +
        (Math.random() - 0.5) * 18,

      y:
        y +
        (Math.random() - 0.5) * 18,

      size:
        45 +
        Math.random() * 30,

      scale: 0.25,

      targetScale:
        0.9 +
        Math.random() * 0.25,

      rotation:
        (Math.random() - 0.5) * 0.35,

      life: 1,

      pulse: true,

      bursting: false,
    });

    /*
      Keep the magic trail manageable.
    */
    if (
      heartsRef.current.length > 80
    ) {
      heartsRef.current.splice(
        0,
        20
      );
    }
  }

  /* =======================================================
     DRAW HEARTS
  ======================================================= */

  function drawHearts(ctx) {
    /*
      Draw the finger trace while the user is
      making the heart.

      This is ONLY a line. No hearts are created
      until the user closes the hand.
    */

    const trace =
      heartTraceRef.current;

    if (trace.length > 1) {
      ctx.save();

      ctx.beginPath();

      ctx.moveTo(
        trace[0].x,
        trace[0].y
      );

      for (
        let i = 1;
        i < trace.length;
        i++
      ) {
        /*
          Use lineTo for the raw points.
          The high point density makes it look
          smooth in the camera.
        */
        ctx.lineTo(
          trace[i].x,
          trace[i].y
        );
      }

      ctx.lineWidth = 2;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle =
        "rgba(255,150,215,0.9)";

      ctx.shadowColor =
        "rgba(255,70,180,0.75)";

      ctx.shadowBlur = 8;

      ctx.stroke();

      ctx.restore();
    }

    /*
      Draw the completed heart.
    */

    const hearts =
      heartsRef.current;

    for (
      let i =
        hearts.length - 1;
      i >= 0;
      i--
    ) {
      const heart =
        hearts[i];

      if (
        heart.bursting
      ) {
        heart.scale += 0.04;
        heart.life -= 0.025;
      } else if (
        heart.pulse
      ) {
        const pulse =
          1 +
          Math.sin(
            performance.now() *
              0.008
          ) *
            0.08;

        heart.targetScale =
          pulse;

        heart.scale +=
          (heart.targetScale -
            heart.scale) *
          0.15;
      } else {
        heart.scale +=
          (heart.targetScale -
            heart.scale) *
          0.12;
      }

      if (
        heart.life <= 0
      ) {
        hearts.splice(i, 1);
        continue;
      }

      ctx.save();

      ctx.globalAlpha =
        heart.life;

      ctx.translate(
        heart.x,
        heart.y
      );

      ctx.rotate(
        heart.rotation
      );

      ctx.scale(
        heart.scale,
        heart.scale
      );

      if (heart.image) {
        ctx.drawImage(
          heart.image,
          -heart.size / 2,
          -heart.size / 2,
          heart.size,
          heart.size
        );
      } else {
        drawFallbackHeart(
          ctx,
          heart.size
        );
      }

      ctx.restore();
    }
  }

  /*
    Convert the user's traced line into ONE
    finished heart.
  */
  function createHeartFromTrace(
    canvas
  ) {
    const trace =
      heartTraceRef.current;

    if (
      trace.length < 15
    ) {
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    trace.forEach(
      (point) => {
        minX =
          Math.min(
            minX,
            point.x
          );

        maxX =
          Math.max(
            maxX,
            point.x
          );

        minY =
          Math.min(
            minY,
            point.y
          );

        maxY =
          Math.max(
            maxY,
            point.y
          );
      }
    );

    const centerX =
      (minX + maxX) / 2;

    const centerY =
      (minY + maxY) / 2;

    const tracedSize =
      Math.max(
        maxX - minX,
        maxY - minY
      );

    const size =
      Math.max(
        90,
        Math.min(
          220,
          tracedSize * 1.05
        )
      );

    const images =
      heartImagesRef.current;

    const image =
      images.length
        ? images[
            Math.floor(
              Math.random() *
                images.length
            )
          ]
        : null;

    /*
      Exactly ONE heart.
    */
    heartsRef.current = [
      {
        image,

        x: centerX,
        y: centerY,

        size,

        scale: 0.2,

        targetScale: 1,

        rotation: 0,

        life: 1,

        pulse: true,

        bursting: false,
      },
    ];
  }


  /* =======================================================
     FALLBACK HEART
  ======================================================= */

  function drawFallbackHeart(
    ctx,
    size
  ) {
    const s =
      size / 2;

    ctx.beginPath();

    ctx.moveTo(
      0,
      s * 0.8
    );

    ctx.bezierCurveTo(
      -s * 1.1,
      s * 0.05,
      -s * 0.75,
      -s * 0.75,
      0,
      -s * 0.2
    );

    ctx.bezierCurveTo(
      s * 0.75,
      -s * 0.75,
      s * 1.1,
      s * 0.05,
      0,
      s * 0.8
    );

    ctx.closePath();

    ctx.fillStyle =
      "#ff6fae";

    ctx.shadowColor =
      "rgba(255,80,170,0.9)";

    ctx.shadowBlur = 20;

    ctx.fill();
  }

  /* =======================================================
     PUMP HEART
  ======================================================= */

  function pumpHearts() {
    heartsRef.current.forEach(
      (heart) => {
        heart.targetScale =
          1.35;

        heart.pulse = true;
      }
    );
  }

  /* =======================================================
     THIN HAND SKELETON
  ======================================================= */

  function drawHandSkeleton(
    ctx,
    canvas,
    landmarks
  ) {
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],

      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],

      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],

      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],

      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20],

      [0, 17],
    ];

    ctx.save();

    ctx.lineWidth = 1.2;

    ctx.strokeStyle =
      "rgba(255,255,255,0.55)";

    ctx.shadowColor =
      "rgba(255,120,230,0.35)";

    ctx.shadowBlur = 3;

    connections.forEach(
      ([start, end]) => {
        const a =
          landmarks[start];

        const b =
          landmarks[end];

        if (!a || !b) return;

        const ax =
          (1 - a.x) *
          canvas.width;

        const ay =
          a.y *
          canvas.height;

        const bx =
          (1 - b.x) *
          canvas.width;

        const by =
          b.y *
          canvas.height;

        ctx.beginPath();

        ctx.moveTo(
          ax,
          ay
        );

        ctx.lineTo(
          bx,
          by
        );

        ctx.stroke();
      }
    );

    landmarks.forEach(
      (point) => {
        const x =
          (1 - point.x) *
          canvas.width;

        const y =
          point.y *
          canvas.height;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          2.2,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#ffffff";

        ctx.shadowColor =
          "rgba(255,120,230,0.45)";

        ctx.shadowBlur = 4;

        ctx.fill();
      }
    );

    ctx.restore();
  }

  /* =======================================================
     UI
  ======================================================= */

  const instruction =
    selectedSpell === "bloom"
      ? "Point to grow · Fist to freeze · Open hand to shatter"
      : selectedSpell === "star"
      ? "Point to place a star · Fist to light them · Open hand to make a wish"
      : selectedSpell === "heart"
      ? "Draw a heart · Fist to create it · Open hand to make it beat"
      : selectedSpell === "thunder"
      ? "Point with both hands · Create lightning between them"
      : "🤏 Pinch both hands → L + inverted L · Become invisible";

  const instructionIcon =
    selectedSpell === "bloom"
      ? "🌸"
      : selectedSpell === "star"
      ? "⭐"
      : selectedSpell === "heart"
      ? "💗"
      : selectedSpell === "thunder"
      ? "⚡"
      : "🫥";

  return (
    <main className="magic-chamber">

      {/* CAMERA */}

      <video
        ref={videoRef}
        className="magic-video"
        autoPlay
        playsInline
        muted
      />

      {/* EFFECT CANVAS */}

      <canvas
        ref={canvasRef}
        className="magic-canvas"
      />

      <div className="magic-vignette" />

      {/* TOP BRAND */}

      <header className="magic-camera-header">

        <div className="magic-brand">
          <span>✦</span>
          SPELL MAGIC
        </div>

        <div className="tracking-status">

          <span
            className={
              handDetected
                ? "status-dot active"
                : "status-dot"
            }
          />

          {gesture}

        </div>

      </header>

      {/* SPELL SELECTOR */}

      <div className="floating-spell-selector">

        {spells.map(
          (spell) => (
            <button
              key={spell.id}
              className={
                selectedSpell ===
                spell.id
                  ? "spell-button selected"
                  : "spell-button"
              }
              onClick={() =>
                setSelectedSpell(
                  spell.id
                )
              }
              title={spell.name}
            >
              {spell.icon}
            </button>
          )
        )}

      </div>

      {/* LOADING */}

      {!cameraReady &&
        !cameraError && (
          <div className="camera-message">

            <div className="magic-loader">
              ✦
            </div>

            <p>
              Opening magical
              chamber...
            </p>

          </div>
        )}

      {/* ERROR */}

      {cameraError && (
        <div className="camera-message error">

          <div>⚠</div>

          <p>
            {cameraError}
          </p>

        </div>
      )}

      {/* INSTRUCTION */}

      {cameraReady && (
        <div className="hand-instruction">

          <span>
            {instructionIcon}
          </span>

          <p>
            {instruction}
          </p>

        </div>
      )}

    </main>
  );
}

export default MagicCamera;
