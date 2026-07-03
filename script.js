const FAIRY_DATA = {
    pink:   { name: "ピンクフェアリー",   img: "fairy_pink.png",   voices: ["pink_1.wav", "pink_2.wav", "pink_3.wav"],   again: "pink_again.wav" },
    blue:   { name: "ブルーフェアリー",   img: "fairy_blue.png",   voices: ["blue_1.wav", "blue_2.wav", "blue_3.wav"],   again: "blue_again.wav" },
    green:  { name: "グリーンフェアリー", img: "fairy_green.png",  voices: ["green_1.wav", "green_2.wav", "green_3.wav"],   again: "green_again.wav" },
    purple: { name: "パープルフェアリー", img: "fairy_purple.png", voices: ["purple_1.wav", "purple_2.wav", "purple_3.wav"], again: "purple_again.wav" },
    yellow: { name: "イエローフェアリー", img: "fairy_yellow.png", voices: ["yellow_1.wav", "yellow_2.wav", "yellow_3.wav"], again: "yellow_again.wav" },
    orange: { name: "オレンジフェアリー", img: "fairy_orange.png", voices: ["orange_1.wav", "orange_2.wav", "orange_3.wav"], again: "orange_again.wav" },
    white:  { name: "ホワイトフェアリー", img: "fairy_white.png",  voices: ["white_1.wav", "white_2.wav", "white_3.wav"],   again: "white_again.wav" }
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

// ルーレットの回転音用プレイヤーを動的に作成
const rouletteAudio = new Audio('roulette.mp3');
rouletteAudio.loop = true; // 回転中はループ再生

// ★iPhone対策：ユーザーが画面を最初にタップした瞬間に、空の音を再生してブラウザの音声を解放する処理
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

    // 1. 【iOS対策】クリックした瞬間に決定音を鳴らす！
    const firstAudio = document.getElementById("audio_kettei");
    if (firstAudio) {
        firstAudio.muted = false;
        firstAudio.volume = 1.0;
        firstAudio.play().catch(e => console.log("iOS対策再生失敗:", e));
    }

    // 2. ルーレットを「回転中」にする
    isSpinning = true;
    startBtn.disabled = true;

    // 3. 画面のリセット処理（前の結果を消す）
    rouletteWrap.style.display = "block";
    resultWrap.style.display = "none";
    compactImg.className = "compact-img"; // コンパクトの倒れるクラスをリセット
    fairyImg.style.display = "none";
    fairyImg.className = "fairy-img"; // 妖精のクラスもリセット
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

    // --- 2. 回転角度計算 ---
    const colorIndex = COLORS.indexOf(targetColor);
    const oneSlice = 360 / 7;
    const targetAngle = (colorIndex * oneSlice) + (oneSlice / 2);
    const totalRotation = (5 * 360) - targetAngle;

    // 4. ルーレット回転スタート！
    board.style.transform = `rotate(${totalRotation}deg)`;
    
    // 5. ルーレット中の「ピピピピ…」音を再生
    rouletteAudio.currentTime = 0;
    rouletteAudio.play().catch(e => console.log("roulette音再生エラー:", e));

    // 6. 4秒後（ルーレットがピタッと止まる瞬間）に演出リレーを開始！
    setTimeout(() => {
        // ① ルーレット回転音（ピピピピ）を止める
        rouletteAudio.pause();

        // ② カチッ音（kachi.mp3）を鳴らす
        const kachiAudio = new Audio('kachi.mp3');
        kachiAudio.play().catch(e => console.log("kachi再生エラー:", e));

        // ③ 【画面フラッシュ】画面を一瞬その色でピカッと光らせる
        const flashBg = document.createElement('div');
        Object.assign(flashBg.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: targetColor, opacity: '0.7', zIndex: '9999',
            pointerEvents: 'none', transition: 'opacity 0.4s ease-out'
        });
        document.body.appendChild(flashBg);
        requestAnimationFrame(() => {
            flashBg.style.opacity = '0';
            setTimeout(() => flashBg.remove(), 400);
        });

        // ④ 【カラーボイス】ここで「ピンク〜！」（pink.wavなど）を再生！
        const colorVoice = new Audio(`${targetColor}.wav`); 
        colorVoice.load();

        // カチッ音のすぐ後（100ms後）に「ピンク〜！」ボイスを再生
        setTimeout(() => {
            colorVoice.play().catch(e => console.log("カラーボイス再生エラー:", e));

            // ⑤ 【「ピンク〜！」ボイス終了後】結果エリアを表示し、コンパクトをパタンと倒す！
            colorVoice.onended = () => {
                // ルーレットを隠して結果エリアを表示
                rouletteWrap.style.display = "none";
                resultWrap.style.display = "flex";
                
                // 元々CSSに用意されていた「パタンと奥に倒れるクラス」を適用する
                setTimeout(() => {
                    compactImg.classList.add('compact-fall');
                }, 100);

                // しゃらら〜ん音（きらきら輝く3.mp3）を再生
                const kirakiraAudio = document.getElementById("audio_kirakira");
                if (kirakiraAudio) {
                    kirakiraAudio.currentTime = 0;
                    kirakiraAudio.play().catch(e => console.log("きらきら音再生エラー:", e));
                    
                    // ⑥ 【しゃらら〜ん終了後】ついにコンパクトの奥から妖精が出てくる！
                    kirakiraAudio.onended = () => {
                        // 当選した色の妖精画像と名前を設定
                        fairyImg.src = FAIRY_DATA[targetColor].img;
                        serifuBox.innerText = FAIRY_DATA[targetColor].name;
                        
                        // アニメーション用クラス（ふわっと出現 ＋ ふわふわ浮く効果）を付与
                        fairyImg.classList.add('fairy-appear', 'fairy-float');

                        // ⑦ 【妖精が出てきたら】ランダムボイス（pink_1.wavなど）を再生！
                        const voices = FAIRY_DATA[targetColor].voices;
                        const randomVoiceFile = voices[Math.floor(Math.random() * voices.length)];
                        const fairyVoice = new Audio(randomVoiceFile);
                        
                        fairyVoice.play().catch(e => console.log("妖精ボイス再生エラー:", e));

                        // すべての演出が完了したので、ボタンを復帰
                        fairyVoice.onended = () => {
                            isSpinning = false;
                            startBtn.disabled = false;
                        };
                    };
                } else {
                    // 万が一きらきら音が取得できなかった場合のフォールバック
                    isSpinning = false;
                    startBtn.disabled = false;
                }
            };
        }, 100);

    }, 4000); // ルーレットの回転時間（4秒）に合わせて停止処理を動かします
});
