const FAIRY_DATA = {
    pink:   { name: "ももぴぃ",   img: "fairy_pink.png",   voices: ["pink_1.wav", "pink_2.wav", "pink_3.wav"],   again: "pink_again.wav" },
    blue:   { name: "あおぴぃ",   img: "fairy_blue.png",   voices: ["blue_1.wav", "blue_2.wav", "blue_3.wav"],   again: "blue_again.wav" },
    green:  { name: "みどぴぃ",   img: "fairy_green.png",  voices: ["green_1.wav", "green_2.wav", "green_3.wav"],   again: "green_again.wav" },
    purple: { name: "むらぴぃ",   img: "fairy_purple.png", voices: ["purple_1.wav", "purple_2.wav", "purple_3.wav"], again: "purple_again.wav" },
    yellow: { name: "きいぴぃ",   img: "fairy_yellow.png", voices: ["yellow_1.wav", "yellow_2.wav", "yellow_3.wav"], again: "yellow_again.wav" },
    orange: { name: "おれぴぃ",   img: "fairy_orange.png", voices: ["orange_1.wav", "orange_2.wav", "orange_3.wav"], again: "orange_again.wav" },
    white:  { name: "しろぴぃ",   img: "fairy_white.png",  voices: ["white_1.wav", "white_2.wav", "white_3.wav"],   again: "white_again.wav" }
};

const COLORS = ["pink", "blue", "green", "purple", "yellow", "orange", "white"];

const board = document.getElementById('board');
const startBtn = document.getElementById('startBtn');
const rouletteWrap = document.getElementById('rouletteWrap');
const resultWrap = document.getElementById('resultWrap');
const compactImg = document.getElementById('compactImg');
const fairyImg = document.getElementById('fairyImg');
const serifuBox = document.getElementById('serifuBox');
const audioGuide = document.getElementById('audioGuide');

let isSpinning = false;
let audioUnlocked = false;

// ルーレットの回転音用プレイヤー
const rouletteAudio = new Audio('roulette.mp3');
rouletteAudio.loop = true;

// 💡 iPhone対策用の「空の音声プレイヤー」たちを最初からグローバルに用意しておく
let colorVoice = new Audio();
let kirakiraAudio = new Audio('kirakira.mp3');
let fairyVoice = new Audio();

function unlockAudio() {
    if (audioUnlocked) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    audioUnlocked = true;
    audioGuide.style.display = "none";
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
}
document.addEventListener('touchstart', unlockAudio, { passive: true });
document.addEventListener('click', unlockAudio);

startBtn.addEventListener('click', () => {
    if (isSpinning) return;

    // 1. 【iOS最重要対策】クリックした瞬間にすべての音声の再生権限をブラウザから奪い取る！
    const firstAudio = document.getElementById("audio_kettei");
    if (firstAudio) {
        firstAudio.muted = false;
        firstAudio.volume = 1.0;
        firstAudio.play().catch(e => console.log("iOS対策再生失敗:", e));
    }
    
    // 💡 演出の後半で鳴らす音も、このクリックした瞬間に一度 load() してiPhoneの認証を通す
    kirakiraAudio.load();

    isSpinning = true;
    startBtn.disabled = true;

    rouletteWrap.style.display = "block";
    resultWrap.style.display = "none";
    compactImg.className = "compact-img";
    fairyImg.style.display = "none";
    fairyImg.className = "fairy-img";
    serifuBox.innerText = "";

    // --- 1. 日付チェックと色の決定 ---
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('fairy_roulette_date');
    const savedColor = localStorage.getItem('fairy_roulette_color');
    let targetColor = "";

    if (savedDate === todayStr && savedColor) {
        targetColor = savedColor;
    } else {
        const randomIndex = Math.floor(Math.random() * COLORS.length);
        targetColor = COLORS[randomIndex];
        localStorage.setItem('fairy_roulette_date', todayStr);
        localStorage.setItem('fairy_roulette_color', targetColor);
    }

    // 💡 当選した色のボイスファイルと、ランダム妖精ボイスも「今この瞬間」に確定させてロードする！
    colorVoice.src = `${targetColor}.wav`;
    colorVoice.load();

    const voices = FAIRY_DATA[targetColor].voices;
    const randomVoiceFile = voices[Math.floor(Math.random() * voices.length)];
    fairyVoice.src = randomVoiceFile;
    fairyVoice.load();

    // --- 2. 回転角度計算 ---
    const colorIndex = COLORS.indexOf(targetColor);
    const oneSlice = 360 / 7;
    const targetAngle = (colorIndex * oneSlice) + (oneSlice / 2);
    const totalRotation = (5 * 360) - targetAngle;

    board.style.transform = `rotate(${totalRotation}deg)`;
    
    rouletteAudio.currentTime = 0;
    rouletteAudio.play().catch(e => console.log("roulette音再生エラー:", e));

    // 6. 4秒後（ルーレットがピタッと止まる瞬間）
    setTimeout(() => {
        rouletteAudio.pause();

        const kachiAudio = new Audio('kachi.mp3');
        kachiAudio.play().catch(e => console.log("kachi再生エラー:", e));

        // ③-2 【ルーレットマスの強調】
        const highlightSector = document.createElement('div');
        Object.assign(highlightSector.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            borderRadius: '50%',
            background: 'conic-gradient(from 334.3deg, rgba(255,255,255,0.8) 0deg, rgba(255,255,255,0.8) 51.4deg, transparent 51.4deg)',
            zIndex: '10',
            pointerEvents: 'none',
            transform: `rotate(${-totalRotation}deg)`,
            animation: 'blinkEffect 0.4s ease-in-out infinite'
        });

        if (!document.getElementById('roulette-blink-style')) {
            const style = document.createElement('style');
            style.id = 'roulette-blink-style';
            style.innerHTML = `@keyframes blinkEffect { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }`;
            document.head.appendChild(style);
        }
        board.appendChild(highlightSector);

        // ④ 【カラーボイス再生】（事前にロードしてあるのでiPhoneでも100%鳴ります）
        setTimeout(() => {
            colorVoice.play().catch(e => console.log("カラーボイス再生エラー:", e));

            // ⑤ 【色のボイス終了後】
            colorVoice.onended = () => {
                // 1.5秒ルーレット画面のまま待つ
                setTimeout(() => {
                    highlightSector.remove(); 
                    rouletteWrap.style.display = "none";
                    resultWrap.style.display = "flex";
                    
                    // 妖精を出現させて喋らせる関数
                    const showFairyAndPlayVoice = () => {
                        fairyImg.src = FAIRY_DATA[targetColor].img;
                        serifuBox.innerText = FAIRY_DATA[targetColor].name;
                        fairyImg.style.display = "block";
                        fairyImg.classList.add('fairy-appear', 'fairy-float');

                        // ⑦ 妖精のボイス再生（事前に認証を通したプレイヤーなので100%鳴ります！）
                        fairyVoice.play().catch(e => console.log("妖精ボイス再生エラー:", e));

                        fairyVoice.onended = () => {
                            isSpinning = false;
                            startBtn.disabled = false;
                        };
                    };

                    // 1秒後にコンパクトを倒して、同時に「きらきら音」を鳴らす
                    setTimeout(() => {
                        compactImg.classList.add('compact-fall');
                        
                        kirakiraAudio.play()
                            .then(() => {
                                kirakiraAudio.onended = showFairyAndPlayVoice;
                            })
                            .catch(e => {
                                console.log("きらきら音ブロック対策発動:", e);
                                // 万が一iPhoneに拒否された場合も、タイマーで妖精とボイスを強制起動
                                setTimeout(showFairyAndPlayVoice, 1500);
                            });
                    }, 1000);

                }, 1500);
            };
        }, 100);

    }, 4000);
});
