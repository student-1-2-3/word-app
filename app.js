// ローカルストレージ操作
const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const loadFromLocalStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');

// 初期データキー
const DATA_KEY = 'wordData';
const DEFAULT_KEY = 'defaultWordList';

// 初期単語リスト（デフォルトデータ）
let defaultWordList = loadFromLocalStorage(DEFAULT_KEY);
if (defaultWordList.length === 0) {
  defaultWordList = [
    { word: 'apple', meaning: 'りんご' },
    { word: 'banana', meaning: 'バナナ' },
    { word: 'cherry', meaning: 'さくらんぼ' }
  ];
  saveToLocalStorage(DEFAULT_KEY, defaultWordList);
}

// 現在の単語リストを取得
let data = loadFromLocalStorage(DATA_KEY);
if (data.length === 0) {
  data = [...defaultWordList];
  saveToLocalStorage(DATA_KEY, data);
}

let totalWords = defaultWordList.length;
let index = 0;

// UI更新
const wordDisplay = document.getElementById('wordDisplay');
const meaningDisplay = document.getElementById('meaningDisplay');
const confirmButton = document.getElementById('confirmButton');
const learnedButton = document.getElementById('learnedButton');
const notLearnedButton = document.getElementById('notLearnedButton');
const progressDisplay = document.getElementById('progress');

// 単語を表示
function showCard() {
  if (data.length === 0) {
    wordDisplay.textContent = '単語リストが空です！';
    meaningDisplay.textContent = '';
    confirmButton.style.display = 'none';
    learnedButton.style.display = 'none';
    notLearnedButton.style.display = 'none';
    return;
  }
  wordDisplay.textContent = data[index].word || '未設定';
  meaningDisplay.textContent = '';
  confirmButton.style.display = 'inline';
  learnedButton.style.display = 'none';
  notLearnedButton.style.display = 'none';
}

// 意味を表示
function showBack() {
  meaningDisplay.textContent = data[index].meaning || '未設定';
  confirmButton.style.display = 'none';
  learnedButton.style.display = 'inline';
  notLearnedButton.style.display = 'inline';
}

// 単語を覚えたとして削除
function markAsLearned() {
  data.splice(index, 1);
  saveToLocalStorage(DATA_KEY, data);
  if (index >= data.length) index = 0;
  updateProgress();
  showCard();
}

// 次の単語へ
function nextCard() {
  index = (index + 1) % data.length;
  showCard();
}

// 単語リストをシャッフル
function shuffleWords() {
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  index = 0;
  showCard();
}

// リストをリセット
function resetList() {
  data = [...defaultWordList];
  saveToLocalStorage(DATA_KEY, data);
  index = 0;
  updateProgress();
  showCard();
}

// 進捗更新
function updateProgress() {
  totalWords = defaultWordList.length;
  progressDisplay.textContent = `残りの単語数: ${data.length} / 総単語数: ${totalWords}`;
}

// 発音機能
function speakCurrentWord() {
  const utterance = new SpeechSynthesisUtterance(data[index].word || '未設定');
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

// CSVエクスポート機能
function exportCSV() {
  const csvData = data.map(row => {
    const word = row.word || '未設定';
    const meaning = row.meaning || '未設定';
    return `${word},${meaning}`;
  }).join('\n');
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'word_data.csv';
  a.click();
}

// CSVインポート機能
function importCSV(event, mode) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    let csvData = e.target.result;

    // BOMを削除（必要に応じて）
    if (csvData.charCodeAt(0) === 0xFEFF) {
      csvData = csvData.slice(1);
    }

    const rows = csvData.split('\n').map(row => row.trim());
    const importedData = [];
    rows.forEach(row => {
      const [word, meaning] = row.split(',');
      if (word && meaning) {
        importedData.push({ word: word.trim(), meaning: meaning.trim() });
      }
    });

    if (importedData.length > 0) {
      if (mode === 'replace') {
        data = importedData;
        defaultWordList = [...importedData]; // デフォルトリストを更新
      } else if (mode === 'add') {
        data = [...data, ...importedData];
        defaultWordList = [...defaultWordList, ...importedData]; // デフォルトリストを拡張
      }
      saveToLocalStorage(DATA_KEY, data);
      saveToLocalStorage(DEFAULT_KEY, defaultWordList); // デフォルトも保存
      alert('CSVデータをインポートしました！');
      updateProgress();
      showCard();
    } else {
      alert('インポートするデータがありません。');
    }

    // ファイル選択をリセット
    event.target.value = '';
  };
  reader.readAsText(file, 'UTF-8');
}

// 初期化
updateProgress();
showCard();
