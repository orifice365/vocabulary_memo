// ページ切り替え機能
function showPage(pageId) {
    document.getElementById('page-memo').style.display = (pageId === 'memo') ? 'block' : 'none';
    document.getElementById('page-analysis').style.display = (pageId === 'analysis') ? 'block' : 'none';

    // タブの活性化状態を更新
    const buttons = document.querySelectorAll('.nav-item');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(pageId === 'memo' ? 'メモ' : '分析'));
    });
}

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    
    // openクラスを付け外しする
    menu.classList.toggle('open');
    overlay.classList.toggle('open');
    
    // メニューが開いているときは背面のスクロールを止める（綺麗めアプリの作法）
    if (menu.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// メモ保存機能
document.getElementById('save-btn').addEventListener('click', () => {
    const input = document.getElementById('memo-input');
    const text = input.value.trim();

    if (!text) return;

    const memos = JSON.parse(localStorage.getItem('memos') || '[]');
    const newMemo = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('ja-JP')
    };

    memos.unshift(newMemo);
    localStorage.setItem('memos', JSON.stringify(memos));

    input.value = '';
    renderMemos();
});

// --- 期間選択のグローバル変数 ---
let currentPeriod = 'all';

// 期間切り替え関数
function setPeriod(period) {
    currentPeriod = period;
    // ボタンの見た目更新
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    runAnalysis(); // 再分析
}

function renderMemos() {
    const list = document.getElementById('memo-list');
    if (!list) return;

    const memos = JSON.parse(localStorage.getItem('memos') || '[]');

    list.innerHTML = memos.map(memo => `
        <div class="memo-item">
            <div class="memo-header">
                <p class="memo-date">${memo.date}</p>
                
                <div class="memo-actions">
                    <button class="edit-btn" data-id="${memo.id}" title="編集">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                            <rect width="256" height="256" fill="none"/>
                            <path d="M92.69,216H48a8,8,0,0,1-8-8V163.31a8,8,0,0,1,2.34-5.65L165.66,34.34a8,8,0,0,1,11.32,0L221.66,79a8,8,0,0,1,0,11.32L98.34,213.66A8,8,0,0,1,92.69,216Z" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                            <line x1="136" y1="64" x2="192" y2="120" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                        </svg>
                    </button>
                    <button class="delete-btn" data-id="${memo.id}" title="削除">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                            <rect width="256" height="256" fill="none"/>
                            <line x1="216" y1="56" x2="40" y2="56" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                            <line x1="104" y1="104" x2="104" y2="168" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                            <line x1="152" y1="104" x2="152" y2="168" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                            <path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                            <path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="memo-content">${escapeHTML(memo.text)}</div>
        </div>
    `).join('');

    // イベントリスナーの割り当て
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => editMemo(btn.dataset.id);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteMemo(btn.dataset.id);
    });
}

// 削除機能
function deleteMemo(id) {
    // 数値型に変換して比較を確実にする
    const targetId = Number(id);
    if (!confirm("このメモを削除しますか？")) return;

    let memos = JSON.parse(localStorage.getItem('memos') || '[]');
    memos = memos.filter(m => m.id !== targetId);

    localStorage.setItem('memos', JSON.stringify(memos));
    renderMemos();

    // 分析ページが表示されている場合は再計算
    if (document.getElementById('page-analysis').style.display === 'block') {
        runAnalysis();
    }
}

// 編集機能
function editMemo(id) {
    const targetId = Number(id);
    let memos = JSON.parse(localStorage.getItem('memos') || '[]');

    // 対象のメモを探す
    const memoIndex = memos.findIndex(m => m.id === targetId);

    if (memoIndex === -1) {
        alert("メモが見つかりませんでした。");
        return;
    }

    const currentText = memos[memoIndex].text;
    const newText = prompt("メモを編集:", currentText);

    // キャンセルされた場合は null になるので、null でなく空でもない場合のみ更新
    if (newText !== null) {
        const trimmedText = newText.trim();
        if (trimmedText !== "") {
            memos[memoIndex].text = trimmedText;
            localStorage.setItem('memos', JSON.stringify(memos));
            renderMemos();

            // 分析中なら再計算
            if (document.getElementById('page-analysis').style.display === 'block') {
                runAnalysis();
            }
        }
    }
}

// セキュリティのためのエスケープ処理
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    }).replace(/\n/g, '<br>');
}

// 初期化
window.onload = renderMemos;

// --- 分析用グローバル変数 ---
let tokenizer = null;

// Kuromojiの初期化（一度だけ実行）
function initTokenizer() {
    return new Promise((resolve, reject) => {
        if (tokenizer) {
            resolve(tokenizer);
            return;
        }
        // 辞書ファイルをCDNから読み込む
kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" }).build((err, _tokenizer) => {
            if (err) {
                console.error("Kuromojiの読み込みに失敗しました", err);
                reject(err);
            } else {
                tokenizer = _tokenizer;
                resolve(tokenizer);
            }
        });
    });
}

// 分析ページの表示と解析の実行
async function showPage(pageId) {
    document.getElementById('page-memo').style.display = (pageId === 'memo') ? 'block' : 'none';
    document.getElementById('page-analysis').style.display = (pageId === 'analysis') ? 'block' : 'none';

    // タブの更新
    const buttons = document.querySelectorAll('.nav-item');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(pageId === 'memo' ? 'メモ' : '分析'));
    });

    // 分析ページを開いたときに実行
    if (pageId === 'analysis') {
        const resultArea = document.getElementById('analysis-result');
        resultArea.innerHTML = "分析中...";

        try {
            await initTokenizer();
            runAnalysis();
        } catch (e) {
            resultArea.innerHTML = "分析エンジンの読み込みに失敗しました。";
        }
    }
}

// 分析実行（期間フィルタリング & 単語重複排除）
function runAnalysis() {
    const memos = JSON.parse(localStorage.getItem('memos') || '[]');
    if (memos.length === 0) return;

    const allText = memos.map(m => m.text).join('\n');
    const tokens = tokenizer.tokenize(allText);

    analyzeSentiment(tokens);

    const counts = { noun: {}, verb: {}, adj: {}, adv: {} };
    // 「あまりにも」を拾うため、不要な助詞的な副詞のみ除外
    const stopWords = ["これ", "それ", "ある", "する", "いる", "なる", "ない", "よい", "思う", "いう", "てる"];

    tokens.forEach(token => {
        let word = token.basic_form || token.surface_form;
        if (word.length <= 1 || stopWords.includes(word)) return;

        if (token.pos === "名詞" && token.pos_detail_1 !== "非自立" && token.pos_detail_1 !== "代名詞") {
            counts.noun[word] = (counts.noun[word] || 0) + 1;
        } else if (token.pos === "動詞") {
            counts.verb[word] = (counts.verb[word] || 0) + 1;
        } else if (token.pos === "形容詞" || (token.pos === "名詞" && token.pos_detail_1 === "形容動詞語幹")) {
            counts.adj[word] = (counts.adj[word] || 0) + 1;
        } else if (token.pos === "副詞") {
            counts.adv[word] = (counts.adv[word] || 0) + 1;
        }
    });

    // Word Cloud用に「名詞・形容詞・副詞」を合算
    const combinedCounts = {};
    [counts.noun, counts.adj, counts.adv].forEach(group => {
        for (let w in group) combinedCounts[w] = (combinedCounts[w] || 0) + group[w];
    });

    // 各ランキングの描画
// 表示処理（新しい共通関数を呼び出す）
    renderGenericResult(Object.entries(counts.noun).sort((a,b)=>b[1]-a[1]).slice(0,15), 'analysis-result', '--color-noun');
    renderGenericResult(Object.entries(counts.verb).sort((a,b)=>b[1]-a[1]).slice(0,15), 'verb-analysis-result', '--color-verb');
    renderGenericResult(Object.entries(counts.adj).sort((a,b)=>b[1]-a[1]).slice(0,15), 'adj-analysis-result', '--color-adj');
    renderGenericResult(Object.entries(counts.adv).sort((a,b)=>b[1]-a[1]).slice(0,15), 'adv-analysis-result', '--color-adv');
    
    renderWordCloud(Object.entries(combinedCounts).sort((a,b)=>b[1]-a[1]).slice(0,30));
}

/*
// 名詞のレンダリング関数
function renderAnalysisResult(data) {
    const resultArea = document.getElementById('analysis-result');
    if (data.length === 0) {
        resultArea.innerHTML = "データが不足しています。";
        return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';
    data.forEach(([word, count]) => {
        html += `<li style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding: 0 8px 4px; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-noun);">${word}</span> 
                    <span style="color: var(--text-sub); font-size: 0.9rem;">${count} <span style="font-size: 0.7rem; opacity: 0.8; margin-left: 2px;">回</span></span>
                </li>`;
    });
    html += '</ul>';
    resultArea.innerHTML = html;
}

// 形容詞用のレンダリング
function renderAdjResult(data) {
    const resultArea = document.getElementById('adj-analysis-result');
    if (data.length === 0) {
        resultArea.innerHTML = "データが不足しています。";
        return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';
    data.forEach(([word, count]) => {
        html += `<li style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding: 0 8px 4px; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-adj);">${word}</span> 
                    <span style="color: var(--text-sub); font-size: 0.9rem;">${count} <span style="font-size: 0.7rem; opacity: 0.8; margin-left: 2px;">回</span></span>
                </li>`;
    });
    html += '</ul>';
    resultArea.innerHTML = html;
}

// 動詞専用のレンダリング関数
function renderVerbResult(data) {
    const resultArea = document.getElementById('verb-analysis-result');
    if (data.length === 0) {
        resultArea.innerHTML = "データが不足しています。";
        return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';
    data.forEach(([word, count]) => {
        html += `<li style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding: 0 8px 4px; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-verb);">${word}</span> 
                    <span style="color: var(--text-sub); font-size: 0.9rem;">${count} <span style="font-size: 0.7rem; opacity: 0.8; margin-left: 2px;">回</span></span>
                </li>`;
    });
    html += '</ul>';
    resultArea.innerHTML = html;
}
// 副詞専用のレンダリング関数
function renderAdvResult(data) {
    const resultArea = document.getElementById('adv-analysis-result');
    if (data.length === 0) {
        resultArea.innerHTML = "データが不足しています。";
        return;
    }
    let html = '<ul style="list-style: none; padding: 0;">';
    data.forEach(([word, count]) => {
        html += `<li style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding: 0 8px 4px; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-adv);">${word}</span> 
                    <span style="color: var(--text-sub); font-size: 0.9rem;">${count} <span style="font-size: 0.7rem; opacity: 0.8; margin-left: 2px;">回</span></span>
                </li>`;
    });
    html += '</ul>';
    resultArea.innerHTML = html;
}
*/

function toggleList(listId, btn) {
    const list = document.getElementById(listId);
    
    // 1. リスト本体の開閉クラス
    const isExpanded = list.classList.toggle('expanded');
    
    // 2. ボタン自身のクラス（SVG回転用）
    btn.classList.toggle('expanded');
    
    // 3. テキストの切り替え
    btn.querySelector('span').innerText = isExpanded ? 'とじる' : 'もっとみる';
}

// 4つの品詞で共通して使う表示用関数
function renderGenericResult(data, elementId, colorVar) {
    const resultArea = document.getElementById(elementId);
    if (!resultArea) return;
    if (data.length === 0) {
        resultArea.innerHTML = "データが不足しています。";
        return;
    }

    // リストの生成
    let html = `<div class="analysis-list" id="${elementId}-list">`;
    html += '<ul style="list-style: none; padding: 0; margin: 0;">';
    data.forEach(([word, count]) => {
        html += `
            <li style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding: 0 8px 4px; display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: var(${colorVar});">${word}</span> 
                <span style="color: var(--text-sub); font-size: 1.1rem;">
                    ${count} <span style="font-size: 0.6rem; opacity: 0.8; margin-left: 2px;">回</span>
                </span>
            </li>`;
    });
    html += '</ul></div>';
    
// データが5個より多い場合のみ「もっと見る」ボタンを表示
if (data.length > 5) {
    html += `
        <button class="show-more-btn" onclick="toggleList('${elementId}-list', this)">
            <span>もっとみる</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="none" viewBox="0 0 256 256">
                <path d="M208,96l-80,80L48,96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            </svg>
        </button>`;
}
    resultArea.innerHTML = html;
}

// 簡易ポジネガ辞書（本来は数千語ありますが、まずは代表的なものを）
const pnDictionary = {
    "楽しい": 1, "嬉しい": 1, "最高": 1, "幸せ": 1, "期待": 1, "成功": 1, "面白い": 1,
    "悲しい": -1, "辛い": -1, "最悪": -1, "不安": -1, "失敗": -1, "苦しい": -1, "怒り": -1
};

function analyzeSentiment(tokens) {
    let score = 0;
    let count = 0;

    tokens.forEach(token => {
        const word = token.basic_form; // 辞書の見出し語で判定
        if (pnDictionary[word]) {
            score += pnDictionary[word];
            count++;
        }
    });

    const resultScore = count > 0 ? (score / count).toFixed(2) : 0;
    const scoreElem = document.getElementById('sentiment-score');
    const labelElem = document.getElementById('sentiment-label');

    // スコアに応じた絵文字とラベル
    if (resultScore > 0.1) {
        scoreElem.innerText = resultScore;
        labelElem.innerText = "ポジティブな傾向があります";
    } else if (resultScore < -0.1) {
        scoreElem.innerText = resultScore;
        labelElem.innerText = "ネガティブな傾向があります";
    } else {
        scoreElem.innerText = "0.00";
        labelElem.innerText = "ニュートラルな状態です";
    }
}


function renderWordCloud(wordData) {
    const width = document.getElementById('word-cloud').offsetWidth;
    const height = 300;

    // 最大・最小サイズを定義して、その範囲内に収める
    const minSize = 6; // 最も小さい文字
    const maxSize = 44; // 最も大きい文字（ここを50〜60から45に下げると圧が減ります）


    // 前のグラフを消去
    d3.select("#word-cloud").selectAll("*").remove();

    const layout = d3.layout.cloud()
        .size([width, height])
        .words(wordData.map(d => {
            // 出現回数に応じた計算（d[1]が回数）
            // 単純な足し算ではなく、平方根(Math.sqrt)を使うと、
            // 頻出単語だけが異常に巨大化するのを防げます
            return {
                text: d[0],
                size: minSize + Math.sqrt(d[1]) * 12
            };
        }))
        .padding(12)
        //.rotate(() => (~~(Math.random() * 2) * 90)) // 縦横ランダム
        .rotate(0)
        .fontSize(d => Math.min(d.size, maxSize)) // maxSizeで頭打ちにする
        .on("end", draw);

    layout.start();

    function draw(words) {
        d3.select("#word-cloud").append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1])
            .append("g")
            .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-family", "var(--font-base)")
            .style("font-size", d => d.size + "px")
            /*.style("fill", () => `hsl(${Math.random() * 360}, 30%, 60%)`) // くすみカラーをランダム生成*/
            .style("fill", () => {
                // メインの #9eb8a1 を中心に、静かな森や水辺を連想させる隣接色パレット
                const harmoniousPalette = [
                    "#7a967d", // ベースのグリーンを少し深めた色
                    "#6b8e8e", // 少し青に寄せた静かな色
                    "#8ba37d", // 少し黄に寄せた穏やかな色
                    "#5b7566", // 最も深いアクセントのグリーン
                    "#93a396"  // 最も淡い、馴染ませるためのグレー系グリーン
                ];
                return harmoniousPalette[Math.floor(Math.random() * harmoniousPalette.length)];
            })
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
            .text(d => d.text);
    }
}