// Global click sound — pool of preloaded video elements for low-latency playback
const CLICK_POOL_SIZE = 6;
const clickPool = Array.from({ length: CLICK_POOL_SIZE }, () => {
  const v = document.createElement("video");
  v.src = "assets/images/Clicking effect.mov";
  v.preload = "auto";
  v.volume = 0.7;
  v.load();
  return v;
});
let clickPoolIndex = 0;

document.addEventListener("click", () => {
  const v = clickPool[clickPoolIndex];
  clickPoolIndex = (clickPoolIndex + 1) % CLICK_POOL_SIZE;
  v.currentTime = 0;
  v.play().catch(() => {});
});

// Intro sequence
const introOverlay = document.querySelector("#intro-overlay");
const introStartScreen = document.querySelector("#intro-start-screen");
const introStartBtn = document.querySelector("#intro-start-btn");
const introMonogramScreen = document.querySelector("#intro-monogram-screen");
const introVideo = document.querySelector("#intro-video");
const introTypewriterScreen = document.querySelector("#intro-typewriter-screen");
const introTypewriterText = document.querySelector("#intro-typewriter-text");
const introWakeupScreen = document.querySelector("#intro-wakeup-screen");
const eyePupil = document.querySelector("#eye-pupil");

// Dev shortcut: add ?skip to the URL — Start button jumps straight into the game
const _skipIntro = new URLSearchParams(window.location.search).has("skip");

function startGameTimer() {
  const gameTimer = document.querySelector("#game-timer");
  let totalSeconds = 3600;
  const timerInterval = setInterval(() => {
    totalSeconds--;
    if (totalSeconds <= 0) { totalSeconds = 0; clearInterval(timerInterval); }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    gameTimer.textContent = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 1000);
}

introStartBtn.addEventListener("click", () => {
  if (_skipIntro) {
    introOverlay.remove();
    startGameTimer();
    return;
  }
  // Initialize typewriter AudioContext on user gesture
  window._twCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Hide only the button — start screen's black background stays as backdrop
  introStartScreen.style.pointerEvents = "none";
  introStartBtn.style.display = "none";
  const introTitle = document.querySelector("#intro-title");
  if (introTitle) introTitle.style.display = "none";
  const gameTitle = document.querySelector("#game-title");
  if (gameTitle) gameTitle.style.opacity = "1";

  // Monogram fades in over the black start screen — no flash
  introMonogramScreen.style.opacity = "1";
  introMonogramScreen.style.pointerEvents = "auto";

  // Hide start screen only after monogram is fully visible
  setTimeout(() => {
    introStartScreen.style.display = "none";
  }, 800);

  // After 2.8s (0.8 fade-in + 2s visible), fade monogram image out (black bg stays)
  setTimeout(() => {
    const introMonogramImg = document.querySelector("#intro-monogram");
    introMonogramImg.style.opacity = "0";

    // After fade-out, switch to typewriter (also black bg — seamless)
    setTimeout(() => {
      introMonogramScreen.style.display = "none";
      introTypewriterScreen.classList.add("visible");

      function playTypewriterTick() {
        const ctx = window._twCtx;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const bufSize = Math.floor(ctx.sampleRate * 0.04);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 3000;
        bp.Q.value = 1.2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        src.connect(bp);
        bp.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      }

      let _twTimer = null;

      function runTypewriter(text, onDone) {
        introTypewriterText.textContent = "";
        let i = 0;
        _twTimer = setInterval(() => {
          introTypewriterText.textContent += text[i];
          playTypewriterTick();
          i++;
          if (i >= text.length) {
            clearInterval(_twTimer);
            _twTimer = null;
            setTimeout(onDone, 1500);
          }
        }, 80);
      }

      function startWakeupScene() {
        if (_twTimer) { clearInterval(_twTimer); _twTimer = null; }
        introTypewriterScreen.style.display = "none";
        introOverlay.style.background = "white";
        introWakeupScreen.classList.add("visible");

        const introSkipBtn = document.querySelector("#intro-skip-btn");
        if (introSkipBtn) introSkipBtn.style.display = "none";

        const introWakeupImg = document.querySelector("#intro-wakeup-img");
        setTimeout(() => {
          introWakeupImg.style.opacity = "0";
          introVideo.style.opacity = "1";
          introVideo.play().catch(() => {});
        }, 3000);

        function setEyeHeight(height, duration, callback) {
          eyePupil.style.transition = `height ${duration}ms ease`;
          eyePupil.style.height = height;
          setTimeout(callback, duration + 100);
        }

        const wakeupSubtitle = document.querySelector("#wakeup-subtitle");
        function showSubtitle(text, showDelay, holdDuration) {
          setTimeout(() => {
            wakeupSubtitle.textContent = text;
            wakeupSubtitle.style.opacity = "1";
            setTimeout(() => { wakeupSubtitle.style.opacity = "0"; }, holdDuration);
          }, showDelay);
        }

        const bgMusic = new Audio("assets/images/joyinsound-gentle-spa-escape-386055.mp3");
        bgMusic.loop = true;
        bgMusic.volume = 0;
        bgMusic.play().catch(() => {});
        let fadeVol = 0;
        const fadeIn = setInterval(() => {
          fadeVol = Math.min(fadeVol + 0.02, 0.6);
          bgMusic.volume = fadeVol;
          if (fadeVol >= 0.6) clearInterval(fadeIn);
        }, 100);
        window._bgMusic = bgMusic;

        setTimeout(() => {
          showSubtitle("Where am I?....", 0, 1400);
          showSubtitle("Oh no.....f*ck, I'm late.", 2700, 1400);
          setEyeHeight("14%", 900, () => {
            setEyeHeight("2%", 700, () => {
              setEyeHeight("36%", 1100, () => {
                setEyeHeight("5%", 700, () => {
                  setEyeHeight("110%", 1600, () => {
                    const eyeOverlay = document.querySelector("#eye-overlay");
                    eyeOverlay.style.transition = "transform 0.7s ease, opacity 0.7s ease";
                    eyeOverlay.style.transform = "scale(3)";
                    eyeOverlay.style.opacity = "0";
                    setTimeout(() => { eyeOverlay.style.display = "none"; }, 700);
                  });
                });
              });
            });
          });
        }, 300);
      }

      document.querySelector("#intro-skip-btn").addEventListener("click", startWakeupScene);

      // Typewriter scene 1
      runTypewriter(
        "You wake up in your studio after an all nighter for your final project, only to realize you are locked inside.",
        () => {
          // Typewriter scene 2
          runTypewriter(
            "It is due in 1 hour, and the only way out is to find the code to the exit door before time runs out.",
            () => {
              startWakeupScene();
            }
          );
        }
      );
    }, 800);
  }, 2800);
});

introVideo.addEventListener("ended", () => {
  introWakeupScreen.style.display = "none";
  introOverlay.classList.add("fade-out");
  setTimeout(() => introOverlay.remove(), 1000);
  startGameTimer();
});

const navLeft = document.querySelector("#nav-left");
const navRight = document.querySelector("#nav-right");
const bsZone1 = document.querySelector("#bs-zone1");
const bsZone2 = document.querySelector("#bs-zone2");
const bsZone3 = document.querySelector("#bs-zone3");
const bsZone4 = document.querySelector("#bs-zone4");
const exitDoorZone = document.querySelector("#exit-door-zone");
const exitClosupZone = document.querySelector("#exit-closeup-zone");
const lockersHint2Zone = document.querySelector("#lockers-hint2-zone");
const lockerZone = document.querySelector("#locker-zone");
const lockerZone2 = document.querySelector("#locker-zone2");
const lockerZone3 = document.querySelector("#locker-zone3");
const lockerOpenZone = document.querySelector("#locker-open-zone");
const lockerHintPostersZone = document.querySelector("#locker-hint-posters-zone");
const mermaidCircle1 = document.querySelector("#mermaid-circle-1");
const mermaidCircle2 = document.querySelector("#mermaid-circle-2");
const mermaidCircle3 = document.querySelector("#mermaid-circle-3");
const shapes = [
  "Cross shape",
  "Oval shape",
  "Square shape",
  "Star shape",
  "Triangle shape",
];

let circle1Index = 0;
let circle2Index = 0;
let circle3Index = 0;

function updateCircleShape(circleEl, index) {
  circleEl.querySelectorAll(".circle-shape").forEach(img => {
    const active = parseInt(img.dataset.shape) === index;
    img.classList.toggle("active", active);
    if (active) {
      const isStar = img.src.includes("Star");
      img.style.transform = isStar ? "scale(1.05)" : "scale(1)";
    } else {
      img.style.transform = "";
    }
  });
}


function checkMermaidSolution() {
  if (circle1Index === 2 && circle2Index === 2 && circle3Index === 3) {
    mermaidSolved = true;
    saveState();
    setImage("assets/images/Mermaid Poster Letters.jpg");
  } else {
    mermaidFailPopup.style.display = "block";
  }
}

const locker7326Zone = document.querySelector("#locker-7326-zone");
const locker7324Zone = document.querySelector("#locker-7324-zone");
const woodPiecesBackZone = document.querySelector("#wood-pieces-back-zone");
const posterHintBox1 = document.querySelector("#poster-hint-box-1");
const posterHintBox2 = document.querySelector("#poster-hint-box-2");
const posterHintBox3 = document.querySelector("#poster-hint-box-3");
const posterHintBox4 = document.querySelector("#poster-hint-box-4");
const posterHintSubtitle = document.querySelector("#poster-hint-subtitle");
const hoveredBoxes = new Set();
const lockDialOverlay = document.querySelector("#lock-dial-overlay");
const lockDialIndicator = document.querySelector("#lock-dial-indicator");
const lockBtnLeft = document.querySelector("#lock-btn-left");
const lockBtnRight = document.querySelector("#lock-btn-right");
const lockSetBtn = document.querySelector("#lock-set-btn");
const mermaidSetBtn = document.querySelector("#mermaid-set-btn");
const lockFailPopup = document.querySelector("#lock-fail-popup");
const lockFailOk = document.querySelector("#lock-fail-ok");
const mermaidFailPopup = document.querySelector("#mermaid-fail-popup");
const mermaidFailOk = document.querySelector("#mermaid-fail-ok");
const lockDebug = document.querySelector("#lock-debug");
let lastLockDirection = null;
let lockDialAngle = 0;
let lockDialSteps = 0;
let lockTotalClicks = 0;
let lockCurrentNum = 0;
let lockSequenceIndex = 0;
let lockSolved = false;
let mermaidSolved = false;
const LOCK_SEQUENCE = [3, 2, 1, 9];
const LOCK_DIRECTIONS = ["left", "right", "left", "right"];
const keypadGrid = document.querySelector("#keypad-grid");
const keypadSuccess = document.querySelector("#keypad-success");
const keypadFail = document.querySelector("#keypad-fail");
const tvZone = document.querySelector("#tv-zone");
const tvTrash = document.querySelector("#tv-trash");
const tvLaptop = document.querySelector("#tv-laptop");
const tvRemote = document.querySelector("#tv-remote");
const remotePersonZone = document.querySelector("#remote-person-zone");
const remoteBackZone = document.querySelector("#remote-back-zone");
const trashClueZone = document.querySelector("#trash-clue-zone");
const trashTakeZone = document.querySelector("#trash-take-zone");
const trashNumbersZone = document.querySelector("#trash-numbers-zone");
const laptopZone = document.querySelector("#laptop-zone");
const openLaptopZone = document.querySelector("#open-laptop-zone");
const laptopOverlay = document.querySelector("#laptop-overlay");
const passwordInputEl = document.querySelector("#password-input");
const passwordBox = document.querySelector("#password-box");
const passwordDisplay = document.querySelector("#password-display");
const zone1 = document.querySelector("#zone1");
const zone2 = document.querySelector("#zone2");
const zone3 = document.querySelector("#zone3");
const images = document.querySelector("#images");
const backButton = document.querySelector("#back-button");
const inventoryList = document.querySelector("#inventory-list");
const inventoryEmpty = document.querySelector("#inventory-empty");

const EXIT_DOOR = "assets/images/Exit Door.jpg";
const LOCKERS_HINT_2 = "assets/images/Lockers Hint 2.jpg";
const DOOR_CODE = "313268";
let doorInput = "";
const EXIT_CLOSEUP = "assets/images/Exit Door Closeup.jpg";
const EXIT_KEYPAD = "assets/images/Exist Door Keypad.jpg";
const TV_MAIN = "assets/images/TV Section_.png";
const TV_CLOSEUP = "assets/images/TV Section 2.png";
const REMOTE_CLOSEUP = "assets/images/IMG_7366.jpg";
const REMOTE_PERSON = "assets/images/Remote Control.jpg";
const TRASH_CLOSEUP = "assets/images/Trash Closeup.jpg";
const TRASH_CLUE = "assets/images/Trash Clue out.jpg";
const TRASH_CLUE_OUT = "assets/images/Trash Clue.jpg";
const TRASH_CLUE_NUMBERS = "assets/images/Trash Clue Numbers.jpg";
let trashClueTaken = false;
const LAPTOP_SCREEN = "assets/images/Laptop Password.jpg";
const LAPTOP_FLAG = "assets/images/Laptop Clue.jpg";
const CORRECT_PASSWORD = "4195";
let passwordInput = "";
let passwordSolved = false;

const bsGallery = [
  "assets/images/IMG_7343.jpg", // bs step 1
  "assets/images/IMG_7342.jpg", // bs step 2
  "assets/images/IMG_7353.jpg", // bs step 3 — paper with polaroid
  "assets/images/IMG_7352.jpg", // bs step 4 — paper taken
];
let bsCompleted = false;

const imgGallery = [
  "assets/images/IMG_7269.jpg", // 0
  "assets/images/IMG_7274.jpg", // 1
  "assets/images/Iguana without paper.jpg", // 2
];
const strangeSymbol = "3*";
const history = [];
const inventory = [];

// ── Preload all game images on startup ──────────────────────────────────────
// fetchAndDecode: fetch → blob → force-decode so image is GPU-ready instantly
let mermaidPosterBlobUrl = null;
let mermaidLettersBlobUrl = null;

function fetchAndDecode(path, onReady) {
  fetch(path)
    .then(r => r.blob())
    .then(b => {
      const url = URL.createObjectURL(b);
      const img = new Image();
      img.src = url;
      img.decode().then(() => onReady(url)).catch(() => onReady(url));
    }).catch(() => {});
}

// Critical: Mermaid Poster uses blob-swap for instant display
fetchAndDecode("assets/images/Mermaid Poster.jpg", url => { mermaidPosterBlobUrl = url; });
fetchAndDecode("assets/images/Mermaid Poster Letters.jpg", url => { mermaidLettersBlobUrl = url; });

// All other game images — preload + decode in the background during intro
const _preloadCache = [
  "assets/images/Locker hint.jpg",
  "assets/images/Posters Hint.jpg",
  "assets/images/Lockers Hint 2.jpg",
  "assets/images/IMG_7260.jpg",
  "assets/images/IMG_7269.jpg",
  "assets/images/IMG_7274.jpg",
  "assets/images/Iguana without paper.jpg",
  "assets/images/IMG_7280.jpg",
  "assets/images/IMG_7287.jpg",
  "assets/images/IMG_7293.jpg",
  "assets/images/IMG_7303.jpg",
  "assets/images/IMG_7324.jpg",
  "assets/images/IMG_7331.jpg",
  "assets/images/IMG_7342.jpg",
  "assets/images/IMG_7343.jpg",
  "assets/images/IMG_7352.jpg",
  "assets/images/IMG_7353.jpg",
  "assets/images/IMG_7366.jpg",
  "assets/images/IMG_7385.jpg",
  "assets/images/IMG_7408.jpg",
  "assets/images/IMG_7202.jpg",
  "assets/images/Locker code.png",
  "assets/images/Locker Code Rotation.png",
  "assets/images/Wood Pieces.jpg",
  "assets/images/Book shelf.jpg",
  "assets/images/Exit Door.jpg",
  "assets/images/Exit Door Closeup.jpg",
  "assets/images/Exist Door Keypad.jpg",
  "assets/images/TV Section_.png",
  "assets/images/TV Section 2.png",
  "assets/images/Remote Control.jpg",
  "assets/images/Trash Closeup.jpg",
  "assets/images/Trash Clue.jpg",
  "assets/images/Trash Clue out.jpg",
  "assets/images/Trash Clue Numbers.jpg",
  "assets/images/Laptop Password.jpg",
  "assets/images/Laptop Clue.jpg",
  "assets/images/Red Star Shape.png",
  "assets/images/Dark Blue Cross Shape.png",
  "assets/images/Blue Oval Shape.png",
  "assets/images/Green Star Shape.png",
  "assets/images/Yellow Cross Shape.png",
  "assets/images/Blue Star Shape.png",
  "assets/images/Green Oval Shape.png",
  "assets/images/Star shape.png",
  "assets/images/Dark Blue Oval Shape.png",
  "assets/images/Red Cross Shape.png",
  "assets/images/Yellow Oval Shape.png",
  "assets/images/Dark Blue Star Shape.png",
  "assets/images/Green Cross Shape.png",
  "assets/images/Oval shape.png",
  "assets/images/Blue Cross Shape.png",
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

let currentImage = images.getAttribute("src");

function resetPasswordOverlay() {
  passwordInput = "";
  passwordInputEl.value = "";
  passwordDisplay.textContent = "";
}

function updateExitDoorZones() {
  exitDoorZone.style.display = currentImage === EXIT_DOOR ? "block" : "none";
  exitClosupZone.style.display = currentImage === EXIT_CLOSEUP ? "block" : "none";
  lockersHint2Zone.style.display = currentImage === LOCKERS_HINT_2 ? "block" : "none";
  lockerZone.style.display = currentImage === "assets/images/Locker hint.jpg" ? "block" : "none";
  lockerHintPostersZone.style.display = currentImage === "assets/images/Locker hint.jpg" ? "block" : "none";
  mermaidCircle1.style.opacity = "0";
  mermaidCircle1.style.pointerEvents = "none";
  mermaidCircle2.style.opacity = "0";
  mermaidCircle2.style.pointerEvents = "none";
  mermaidCircle3.style.opacity = "0";
  mermaidCircle3.style.pointerEvents = "none";
  mermaidSetBtn.style.display = "none";
  mermaidFailPopup.style.display = "none";
  lockerZone2.style.display = currentImage === "assets/images/IMG_7280.jpg" ? "block" : "none";
  lockerZone3.style.display = currentImage === "assets/images/IMG_7287.jpg" ? "block" : "none";
  lockerOpenZone.style.display = currentImage === "assets/images/IMG_7331.jpg" ? "block" : "none";
  locker7326Zone.style.display = currentImage === "assets/images/Locker code.png" ? "block" : "none";
  locker7324Zone.style.display = currentImage === "assets/images/IMG_7324.jpg" ? "block" : "none";
  woodPiecesBackZone.style.display = currentImage === "assets/images/Wood Pieces.jpg" ? "block" : "none";
  const onPostersHint = currentImage === "assets/images/Posters Hint.jpg";
  posterHintBox1.style.display = onPostersHint ? "block" : "none";
  posterHintBox2.style.display = onPostersHint ? "block" : "none";
  posterHintBox3.style.display = onPostersHint ? "block" : "none";
  posterHintBox4.style.display = onPostersHint ? "block" : "none";
  if (!onPostersHint) {
    posterHintSubtitle.style.display = "none";
    hoveredBoxes.clear();
  }
  const onLockScene = currentImage === "assets/images/IMG_7293.jpg";
  lockDialOverlay.style.display = onLockScene ? "block" : "none";
  lockDialIndicator.style.display = onLockScene ? "block" : "none";
  lockBtnLeft.style.display = onLockScene ? "block" : "none";
  lockBtnRight.style.display = onLockScene ? "block" : "none";
  lockSetBtn.style.display = onLockScene ? "block" : "none";
  lockDebug.style.display = onLockScene ? "block" : "none";
  if (onLockScene) lockDebug.textContent = `num: ${lockCurrentNum} | step: ${lockSequenceIndex}`;
  if (!onLockScene) {
    resetLock();
    lockFailPopup.style.display = "none";
  }
  keypadGrid.style.display = currentImage === EXIT_KEYPAD ? "grid" : "none";
  if (currentImage !== EXIT_KEYPAD) doorInput = "";
}

function updateTvZones() {
  tvZone.style.display = currentImage === TV_MAIN ? "block" : "none";
  tvTrash.style.display = currentImage === TV_CLOSEUP ? "block" : "none";
  tvLaptop.style.display = currentImage === TV_CLOSEUP ? "block" : "none";
  tvRemote.style.display = currentImage === TV_CLOSEUP ? "block" : "none";
  trashClueZone.style.display = (!trashClueTaken && currentImage === TRASH_CLOSEUP) ? "block" : "none";
  trashTakeZone.style.display = currentImage === TRASH_CLUE_OUT ? "block" : "none";
  trashNumbersZone.style.display = currentImage === TRASH_CLUE_NUMBERS ? "block" : "none";
  remotePersonZone.style.display = currentImage === REMOTE_CLOSEUP ? "block" : "none";
  remoteBackZone.style.display = currentImage === REMOTE_PERSON ? "block" : "none";
  laptopZone.style.display = currentImage === "assets/images/IMG_7408.jpg" ? "block" : "none";
  openLaptopZone.style.display = currentImage === "assets/images/IMG_7385.jpg" ? "block" : "none";
  const showOverlay = currentImage === LAPTOP_SCREEN;
  laptopOverlay.hidden = !showOverlay;
  if (showOverlay) {
    passwordInputEl.focus();
  } else {
    resetPasswordOverlay();
  }

}

const NO_BACK_SCENES = [LOCKERS_HINT_2, EXIT_DOOR, TV_MAIN, "assets/images/Book shelf.jpg", REMOTE_PERSON, "assets/images/Wood Pieces.jpg"];

function updateBackButton() {
  if (NO_BACK_SCENES.includes(currentImage)) {
    backButton.hidden = true;
  } else if (lockSolved && currentImage === "assets/images/Locker code.png") {
    backButton.hidden = false;
  } else {
    backButton.hidden = history.length === 0;
  }
}

function hideMermaidLayer() {
  const ml = document.querySelector("#mermaid-layer");
  ml.style.opacity = "0.0001";
  ml.style.pointerEvents = "none";
  document.querySelector("#images").style.opacity = "1";
}

const NO_MAP_SCENES = [
  // Iguana close-ups
  "assets/images/IMG_7274.jpg",
  "assets/images/IMG_7275.jpg",
  // Bookshelf close-ups
  "assets/images/IMG_7343.jpg",
  "assets/images/IMG_7342.jpg",
  "assets/images/IMG_7353.jpg",
  "assets/images/IMG_7352.jpg",
  // Laptop
  "assets/images/IMG_7408.jpg",
  "assets/images/IMG_7385.jpg",
  "assets/images/Laptop Password.jpg",
  "assets/images/Laptop Clue.jpg",
  // Trash
  "assets/images/Trash Closeup.jpg",
  "assets/images/Trash Clue out.jpg",
  "assets/images/Trash Clue.jpg",
  "assets/images/Trash Clue Numbers.jpg",
  // Remote control
  "assets/images/IMG_7366.jpg",
  "assets/images/Remote Control.jpg",
  // Keypad
  "assets/images/Exist Door Keypad.jpg",
  // Locker close-ups
  "assets/images/IMG_7287.jpg",
  "assets/images/IMG_7293.jpg",
  "assets/images/IMG_7303.jpg",
  "assets/images/IMG_7331.jpg",
  "assets/images/Locker code.png",
  "assets/images/IMG_7324.jpg",
  "assets/images/Wood Pieces.jpg",
];

function updateMapBtn() {
  mapBtn.style.display = NO_MAP_SCENES.includes(currentImage) ? "none" : "flex";
}

function setImage(src) {
  hideMermaidLayer();
  currentImage = src;
  images.src = src;
  updateNavZones();
  updateBsZones();
  updateTvZones();
  updateExitDoorZones();
  updateBackButton();
  updateMapBtn();
}

function showMermaidCircles() {
  updateCircleShape(mermaidCircle1, circle1Index);
  updateCircleShape(mermaidCircle2, circle2Index);
  updateCircleShape(mermaidCircle3, circle3Index);
  mermaidCircle1.style.opacity = "1";
  mermaidCircle1.style.pointerEvents = "auto";
  mermaidCircle2.style.opacity = "1";
  mermaidCircle2.style.pointerEvents = "auto";
  mermaidCircle3.style.opacity = "1";
  mermaidCircle3.style.pointerEvents = "auto";
  mermaidSetBtn.style.display = "block";
}

function updateBsZones() {
  bsZone1.style.display = (!bsCompleted && currentImage === "assets/images/Book shelf.jpg") ? "block" : "none";
  bsZone2.style.display = (!bsCompleted && currentImage === bsGallery[0]) ? "block" : "none";
  bsZone3.style.display = (!bsCompleted && currentImage === bsGallery[1]) ? "block" : "none";
  bsZone4.style.display = (!bsCompleted && currentImage === bsGallery[2]) ? "block" : "none";
}

function saveState(
  state = {
    image: images.getAttribute("src"),
    zone1: zone1.style.display,
    zone2: zone2.style.display,
    zone3: zone3.style.display,
  },
) {
  history.push(state);

  backButton.hidden = false;
}

function addClue(zone) {
  const clueName = zone.dataset.clue;

  if (!clueName || inventory.includes(clueName)) {
    return;
  }

  inventory.push(clueName);

  const listItem = document.createElement("li");
  listItem.textContent = clueName;
  inventoryList.appendChild(listItem);
  inventoryEmpty.hidden = true;
}

function hasInventoryItem(itemName) {
  return inventory.includes(itemName);
}

function showLockedStartScene() {
  setImage(initialState.image);
  zone1.style.display = "none";
  zone2.style.display = "none";
  zone3.style.display = "none";
}

zone1.style.display = "block";
zone2.style.display = "none";
zone3.style.display = "none";

const initialState = {
  image: images.getAttribute("src"),
  zone1: zone1.style.display,
  zone2: zone2.style.display,
  zone3: zone3.style.display,
};

zone1.addEventListener("click", () => {
  saveState();
  addClue(zone1);
  setImage(imgGallery[0]);
  zone1.style.display = "none";
  zone2.style.display = "block";
});

zone2.addEventListener("click", () => {
  saveState();
  addClue(zone2);
  setImage(imgGallery[1]);
  zone2.style.display = "none";
  zone3.style.display = "block";
});

zone3.addEventListener("click", () => {
  history.length = 0;
  saveState({ ...initialState });
  addClue(zone3);
  setImage(imgGallery[2]);
  zone3.style.display = "none";
});

bsZone1.addEventListener("click", () => {
  saveState();
  setImage(bsGallery[0]);
});

bsZone2.addEventListener("click", () => {
  saveState();
  setImage(bsGallery[1]);
});

bsZone3.addEventListener("click", () => {
  saveState();
  setImage(bsGallery[2]);
});

bsZone4.addEventListener("click", () => {
  addClue(bsZone4);
  bsCompleted = true;
  saveState({
    image: "assets/images/Book shelf.jpg",
    zone1: zone1.style.display,
    zone2: zone2.style.display,
    zone3: zone3.style.display,
  });
  setImage(bsGallery[3]); // show paper-taken image
});

// Scene map — defines left/right neighbours for each scene
const sceneMap = {
  [LOCKERS_HINT_2]: {
    left: "assets/images/Posters Hint.jpg",
    right: EXIT_DOOR,
  },
  [EXIT_DOOR]: {
    left: LOCKERS_HINT_2,
    right: TV_MAIN,
  },
  [TV_MAIN]: {
    left: EXIT_DOOR,
    right: "assets/images/Book shelf.jpg",
  },
  "assets/images/Book shelf.jpg": {
    left: TV_MAIN,
    right: "assets/images/IMG_7260.jpg",
  },
  "assets/images/IMG_7260.jpg": {
    left: "assets/images/Book shelf.jpg",
    right: "assets/images/Locker hint.jpg",
  },
  "assets/images/Locker hint.jpg": {
    left: "assets/images/IMG_7260.jpg",
    right: "assets/images/Posters Hint.jpg",
  },
  "assets/images/Posters Hint.jpg": {
    left: "assets/images/Locker hint.jpg",
    right: "assets/images/Lockers Hint 2.jpg",
  },
};

function updateNavZones() {
  const scene = sceneMap[currentImage];
  navLeft.style.display = scene?.left ? "flex" : "none";
  navRight.style.display = scene?.right ? "flex" : "none";
}

function restoreMainZones() {
  if (hasInventoryItem(strangeSymbol)) return;
  const lastMainState = [...history].reverse().find(s => s.image === initialState.image);
  if (lastMainState) {
    zone1.style.display = lastMainState.zone1;
    zone2.style.display = lastMainState.zone2;
    zone3.style.display = lastMainState.zone3;
  }
}

navLeft.addEventListener("click", () => {
  const scene = sceneMap[currentImage];
  if (!scene?.left) return;
  saveState();
  if (currentImage === initialState.image) {
    zone1.style.display = "none";
    zone2.style.display = "none";
    zone3.style.display = "none";
  }
  setImage(scene.left);
  if (scene.left === initialState.image) restoreMainZones();
});

navRight.addEventListener("click", () => {
  const scene = sceneMap[currentImage];
  if (!scene?.right) return;
  saveState();
  if (currentImage === initialState.image) {
    zone1.style.display = "none";
    zone2.style.display = "none";
    zone3.style.display = "none";
  }
  setImage(scene.right);
  if (scene.right === initialState.image) restoreMainZones();
});

backButton.addEventListener("click", () => {
  if (mermaidSolved && currentImage === "assets/images/Mermaid Poster Letters.jpg") {
    while (history.length > 0 && history[history.length - 1].image === "assets/images/Mermaid Poster.jpg") {
      history.pop();
    }
    const previousState = history.pop();
    if (previousState) {
      setImage(previousState.image);
    }
    updateBackButton();
    updateNavZones();
    return;
  }

  if (lockSolved && currentImage === "assets/images/Locker code.png") {
    const lockerChain = [
      "assets/images/IMG_7331.jpg",
      "assets/images/IMG_7303.jpg",
      "assets/images/IMG_7293.jpg",
      "assets/images/IMG_7287.jpg",
      "assets/images/IMG_7280.jpg",
    ];
    while (history.length > 0 && lockerChain.includes(history[history.length - 1].image)) {
      history.pop();
    }
    setImage("assets/images/IMG_7280.jpg");
    updateBackButton();
    updateNavZones();
    return;
  }

  const previousState = history.pop();

  if (!previousState) {
    return;
  }

  if (
    previousState.image === initialState.image &&
    hasInventoryItem(strangeSymbol)
  ) {
    showLockedStartScene();
  } else {
    setImage(previousState.image);
    zone1.style.display = previousState.zone1;
    zone2.style.display = previousState.zone2;
    zone3.style.display = previousState.zone3;
  }

  updateBackButton();
  updateNavZones();
});

openLaptopZone.addEventListener("click", () => {
  saveState();
  setImage(passwordSolved ? LAPTOP_FLAG : LAPTOP_SCREEN);
});

passwordInputEl.addEventListener("input", () => {
  const val = passwordInputEl.value.slice(0, 4);
  passwordInput = val;
  passwordDisplay.textContent = "*".repeat(val.length);

  if (val.length === 4) {
    if (val === CORRECT_PASSWORD) {
      passwordSolved = true;
      setImage(LAPTOP_FLAG);
    } else {
      passwordBox.classList.add("shake");
      passwordBox.addEventListener("animationend", () => {
        passwordBox.classList.remove("shake");
        resetPasswordOverlay();
      }, { once: true });
    }
  }
});

lockerZone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7280.jpg");
});

lockerHintPostersZone.addEventListener("click", () => {
  saveState();
  const mermaidLayer = document.querySelector("#mermaid-layer");
  if (mermaidSolved) {
    mermaidLayer.src = "assets/images/Mermaid Poster Letters.jpg";
  } else {
    mermaidLayer.src = "assets/images/Mermaid Poster.jpg";
  }
  // Swap layers — instant since mermaid-layer is already loaded
  mermaidLayer.style.opacity = "1";
  mermaidLayer.style.pointerEvents = "auto";
  document.querySelector("#images").style.opacity = "0";
  currentImage = mermaidSolved
    ? "assets/images/Mermaid Poster Letters.jpg"
    : "assets/images/Mermaid Poster.jpg";
  updateNavZones();
  updateBackButton();
  showMermaidCircles();
});

lockerZone2.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7287.jpg");
});

lockerZone3.addEventListener("click", () => {
  saveState();
  if (lockSolved) {
    setImage("assets/images/Locker code.png");
  } else {
    setImage("assets/images/IMG_7293.jpg");
  }
});

lockerOpenZone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/Locker code.png");
});

locker7326Zone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7324.jpg");
});

locker7324Zone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/Wood Pieces.jpg");
});

mermaidCircle1.addEventListener("click", () => {
  circle1Index = (circle1Index + 1) % mermaidCircle1.querySelectorAll(".circle-shape").length;
  updateCircleShape(mermaidCircle1, circle1Index);
});

mermaidCircle2.addEventListener("click", () => {
  circle2Index = (circle2Index + 1) % mermaidCircle2.querySelectorAll(".circle-shape").length;
  updateCircleShape(mermaidCircle2, circle2Index);
});

mermaidCircle3.addEventListener("click", () => {
  circle3Index = (circle3Index + 1) % mermaidCircle3.querySelectorAll(".circle-shape").length;
  updateCircleShape(mermaidCircle3, circle3Index);
});

mermaidSetBtn.addEventListener("click", () => {
  checkMermaidSolution();
});

mermaidFailOk.addEventListener("click", () => {
  mermaidFailPopup.style.display = "none";
});

[posterHintBox1, posterHintBox2, posterHintBox3, posterHintBox4].forEach(box => {
  box.addEventListener("mouseenter", () => {
    hoveredBoxes.add(box);
    if (hoveredBoxes.size === 4) {
      posterHintSubtitle.style.display = "block";
      posterHintSubtitle.style.animation = "none";
      posterHintSubtitle.offsetHeight; // force reflow
      posterHintSubtitle.style.animation = "fadeInSub 0.5s ease forwards, fadeOutSub 0.5s ease 3s forwards";
      setTimeout(() => {
        posterHintSubtitle.style.display = "none";
        hoveredBoxes.clear();
      }, 3500);
    }
  });
});

woodPiecesBackZone.addEventListener("click", () => {
  const previousState = history.pop();
  if (previousState) {
    setImage(previousState.image);
  }
});


function rotateDial(direction) {
  if (currentImage !== "assets/images/IMG_7293.jpg") return;
  lockTotalClicks++;
  const idx = lockTotalClicks - 1;
  const peakAt = 4;
  const n = Math.max(0, peakAt - Math.abs(idx - peakAt));
  const step = 38 + n * 0.75;
  if (direction === "right") {
    lockDialSteps++;
    lockDialAngle += step;
    lockCurrentNum = ((lockCurrentNum - 1) + 10) % 10;
  } else {
    lockDialSteps--;
    lockDialAngle -= step;
    lockCurrentNum = (lockCurrentNum + 1) % 10;
  }
  lockDialOverlay.style.transition = "transform 0.4s ease";
  lastLockDirection = direction;
  lockDialOverlay.style.transform = `rotate(${lockDialAngle}deg)`;
  lockDebug.textContent = `num: ${lockCurrentNum} | step: ${lockSequenceIndex}`;
}

function resetLock() {
  lockDialAngle = 0;
  lockDialSteps = 0;
  lockTotalClicks = 0;
  lockCurrentNum = 0;
  lockSequenceIndex = 0;
  lastLockDirection = null;
  lockDialOverlay.style.transform = "rotate(0deg)";
  lockDebug.textContent = `num: 0 | step: 0`;
}

lockSetBtn.addEventListener("click", () => {
  if (currentImage !== "assets/images/IMG_7293.jpg") return;
  const correctNum = lockCurrentNum === LOCK_SEQUENCE[lockSequenceIndex];
  const correctDir = lastLockDirection === LOCK_DIRECTIONS[lockSequenceIndex];
  if (correctNum && correctDir) {
    lockSequenceIndex++;
    lockDialOverlay.style.filter = "brightness(1.6)";
    setTimeout(() => { lockDialOverlay.style.filter = ""; }, 300);
    lockDebug.textContent = `num: ${lockCurrentNum} | step: ${lockSequenceIndex}`;
    if (lockSequenceIndex >= LOCK_SEQUENCE.length) {
      lockSolved = true;
      resetLock();
      setTimeout(() => {
        history.push({ image: "assets/images/IMG_7331.jpg", zone1: "none", zone2: "none", zone3: "none" });
        setImage("assets/images/IMG_7303.jpg");
      }, 600);
    }
  } else {
    lockFailPopup.style.display = "block";
  }
});

lockFailOk.addEventListener("click", () => {
  lockFailPopup.style.display = "none";
  resetLock();
});

lockBtnLeft.addEventListener("click", () => rotateDial("left"));
lockBtnRight.addEventListener("click", () => rotateDial("right"));

// Colophon
const colophonBtn = document.querySelector("#colophon-btn");
const colophonOverlay = document.querySelector("#colophon-overlay");
const colophonClose = document.querySelector("#colophon-close");
colophonBtn.addEventListener("click", () => colophonOverlay.classList.add("open"));
colophonClose.addEventListener("click", () => colophonOverlay.classList.remove("open"));
colophonOverlay.addEventListener("click", (e) => {
  if (e.target === colophonOverlay) colophonOverlay.classList.remove("open");
});

lockersHint2Zone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7202.jpg");
});

exitDoorZone.addEventListener("click", () => {
  saveState();
  setImage(EXIT_CLOSEUP);
});

exitClosupZone.addEventListener("click", () => {
  saveState();
  setImage(EXIT_KEYPAD);
});

tvZone.addEventListener("click", () => {
  saveState();
  setImage(TV_CLOSEUP);
});

tvTrash.addEventListener("click", () => {
  saveState();
  setImage(trashClueTaken ? TRASH_CLUE : TRASH_CLOSEUP);
});

trashClueZone.addEventListener("click", () => {
  // Show "Trash Clue.jpg" — the close-up of the note
  saveState();
  setImage(TRASH_CLUE_OUT);
});

trashTakeZone.addEventListener("click", () => {
  // Clicking anywhere on "Trash Clue.jpg" shows the numbers image (no back button)
  backButton.hidden = true;
  setImage(TRASH_CLUE_NUMBERS);
});

trashNumbersZone.addEventListener("click", () => {
  // Clicking anywhere on Numbers adds "3219" and removes the two partial clues
  if (!inventory.includes("3219")) {
    // Remove "3*" and "*9" from inventory array and UI
    ["3*", "*9"].forEach(clue => {
      const idx = inventory.indexOf(clue);
      if (idx !== -1) {
        inventory.splice(idx, 1);
        const items = inventoryList.querySelectorAll("li");
        items.forEach(li => { if (li.textContent === clue) li.remove(); });
      }
    });

    inventory.push("3219");
    const listItem = document.createElement("li");
    listItem.textContent = "3219";
    inventoryList.appendChild(listItem);
    inventoryEmpty.hidden = true;
  }
  trashClueTaken = true;
  setImage(TRASH_CLUE);
});

tvLaptop.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7385.jpg");
});

laptopZone.addEventListener("click", () => {
  saveState();
  setImage("assets/images/IMG_7385.jpg");
});

tvRemote.addEventListener("click", () => {
  saveState();
  setImage(REMOTE_CLOSEUP);
});

remotePersonZone.addEventListener("click", () => {
  setImage(REMOTE_PERSON);
});

remoteBackZone.addEventListener("click", () => {
  setImage(REMOTE_CLOSEUP);
});

document.querySelectorAll(".key-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    doorInput += btn.dataset.key;
    if (doorInput.length === DOOR_CODE.length) {
      if (doorInput === DOOR_CODE) {
        keypadSuccess.style.display = "flex";
        // Fade out background music
        if (window._bgMusic) {
          const fadeOut = setInterval(() => {
            window._bgMusic.volume = Math.max(0, window._bgMusic.volume - 0.03);
            if (window._bgMusic.volume <= 0) {
              window._bgMusic.pause();
              clearInterval(fadeOut);
            }
          }, 80);
        }
      } else {
        keypadFail.style.display = "flex";
      }
      doorInput = "";
    }
  });
});

document.querySelector("#keypad-ok").addEventListener("click", () => {
  keypadSuccess.style.display = "none";
});

document.querySelector("#keypad-fail-ok").addEventListener("click", () => {
  keypadFail.style.display = "none";
});

// ── Map button & overlay ────────────────────────────────────────────────────
const mapBtn = document.querySelector("#map-btn");
const mapOverlay = document.querySelector("#map-overlay");
const mapStar = document.querySelector("#map-star");

// Star positions for each main scene — { left: %, top: % } as percent of map size
// Add/update entries here as each room position is confirmed
const MAP_STAR_POSITIONS = {
  "assets/images/IMG_7260.jpg":           { left: 50,   top: 48.25 },
  "assets/images/IMG_7269.jpg":           { left: 50,   top: 35    },
  "assets/images/Locker hint.jpg":        { left: 50,   top: 48.25 },
  "assets/images/Lockers Hint 2.jpg":     { left: 50,   top: 48.25 },
  [TV_MAIN]:                              { left: 50,   top: 48.25 },
  "assets/images/TV Section 2.png":      { left: 40,   top: 47    },
  "assets/images/Book shelf.jpg":         { left: 37.5, top: 32 },
  "assets/images/IMG_7280.jpg":           { left: 61.3, top: 39.75 },
  "assets/images/IMG_7202.jpg":           { left: 60.75, top: 63.75 },
  "assets/images/Posters Hint.jpg":       { left: 62,   top: 60.75 },
  "assets/images/Mermaid Poster.jpg":     { left: 53.75, top: 48.25 },
  "assets/images/Mermaid Poster Letters.jpg": { left: 53.75, top: 48.25 },
  "assets/images/Exit Door.jpg":          { left: 43,   top: 57.75 },
  "assets/images/Exit Door Closeup.jpg":  { left: 38,   top: 69.75 },
};

function updateMapStar() {
  const pos = MAP_STAR_POSITIONS[currentImage];
  if (pos) {
    mapStar.style.left = pos.left + "%";
    mapStar.style.top  = pos.top  + "%";
    mapStar.style.display = "block";
  } else {
    mapStar.style.display = "none";
  }
}

function openMap() {
  updateMapStar();
  mapOverlay.hidden = false;
}

function closeMap() {
  mapOverlay.hidden = true;
}

mapBtn.addEventListener("click", openMap);
// Close when clicking anywhere on the overlay
mapOverlay.addEventListener("click", closeMap);

// M key toggles the map; Escape closes it
document.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    mapOverlay.hidden ? openMap() : closeMap();
  }
  if (e.key === "Escape" && !mapOverlay.hidden) {
    closeMap();
  }
  if ((e.key === "b" || e.key === "B") && !backButton.hidden) {
    backButton.click();
  }
});

// Set initial states
updateNavZones();
updateBsZones();
updateTvZones();
updateExitDoorZones();

// Position DEADLINE title: centered in the white margin above the scene,
// or inside the scene top if there's no room.
function positionGameTitle() {
  const title = document.querySelector("#game-title");
  const scene = document.querySelector("#scene");
  if (!title || !scene) return;
  const rect = scene.getBoundingClientRect();
  const titleH = title.offsetHeight || 22;
  const marginAbove = rect.top;
  if (marginAbove >= titleH + 16) {
    // Enough room — center it in the white margin above the scene
    title.style.top = (marginAbove / 2 - titleH / 2) + "px";
    title.style.visibility = "visible";
  } else {
    // Not enough room — hide it to avoid clashing with the timer
    title.style.visibility = "hidden";
  }
}

positionGameTitle();
window.addEventListener("resize", positionGameTitle);

