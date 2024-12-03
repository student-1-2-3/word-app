const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const loadFromLocalStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const loadFromLocalStorageValue = (key, defaultValue) => JSON.parse(localStorage.getItem(key)) ?? defaultValue;

const DATA_KEY = 'wordData';
const DEFAULT_KEY = 'defaultWordList';
const PROGRESS_KEY = 'sectionLearnedData';
const SECTION_SIZE_KEY = 'sectionSize';
const CURRENT_SECTION_KEY = 'currentSectionIndex';
const CURRENT_INDEX_KEY = 'currentWordIndex';

const MY_WORDS_KEY = 'myWords'; // My単語帳用のローカルストレージキー

let defaultWordList = loadFromLocalStorage(DEFAULT_KEY);
if (defaultWordList.length === 0) {
  defaultWordList = [
    { word: 'apple', meaning: 'りんご', hint: 'I have an apple.' },
    { word: 'banana', meaning: 'バナナ', hint: 'I like bananas.' },
    { word: 'cherry', meaning: 'さくらんぼ', hint: 'Cherries are red.' }
  ];
  saveToLocalStorage(DEFAULT_KEY, defaultWordList);
}

let sectionSize = loadFromLocalStorageValue(SECTION_SIZE_KEY, 50);
let data = loadFromLocalStorage(DATA_KEY);
if (data.length === 0) {
  data = [...defaultWordList];
  saveToLocalStorage(DATA_KEY, data);
}

let sections = [];
let sectionLearnedData = loadFromLocalStorageValue(PROGRESS_KEY, {});
let currentSectionIndex = loadFromLocalStorageValue(CURRENT_SECTION_KEY, 0);
let index = loadFromLocalStorageValue(CURRENT_INDEX_KEY, 0);

const sectionSizeInput = document.getElementById('sectionSizeInput');
const wordDisplay = document.getElementById('wordDisplay');
const meaningDisplay = document.getElementById('meaningDisplay');
const confirmButton = document.getElementById('confirmButton');
const learnedButton = document.getElementById('learnedButton');
const notLearnedButton = document.getElementById('notLearnedButton');
const progressDisplay = document.getElementById('progress');
const hintDisplay = document.getElementById('hintDisplay');
const hintButton = document.getElementById('hintButton');
const sectionContainer = document.getElementById('sections');
const currentSectionDisplay = document.getElementById('currentSection');
const speakButton = document.getElementById('speakButton');
const addToMyWordsButton = document.getElementById('addToMyWordsButton');

function setInitialSectionSize() {
  sectionSizeInput.value = sectionSize;
}

function getSectionSize() {
  const size = parseInt(sectionSizeInput.value, 10);
  return size > 0 ? size : sectionSize;
}

function splitIntoSections() {
  sections = []; // セクションのリセット

  // デフォルトの単語リストが空の場合の処理
  if (defaultWordList.length === 0) {
    console.warn('defaultWordList is empty. No sections created.');
    return; // 処理を終了
  }

  // セクションごとに単語リストを分割
  for (let i = 0; i < defaultWordList.length; i += sectionSize) {
    const section = defaultWordList.slice(i, i + sectionSize);

    // セクションが空でない場合のみ追加
    if (section.length > 0) {
      sections.push(section);
    } else {
      console.warn(`Empty section encountered at index: ${i}`);
    }
  }

  // セクションが作成されているか確認
  if (sections.length === 0) {
    console.error('No sections created. Check the defaultWordList or sectionSize.');
  } else {
    console.log(`Sections created successfully: ${sections.length}`);
  }
}

function createSectionButtons() {
  sectionContainer.innerHTML = '';

// 各セクションボタン
  sections.forEach((_, idx) => {
    const button = document.createElement('button');
    button.textContent = `${idx + 1}日目`;
    button.onclick = () => loadSection(idx);
    sectionContainer.appendChild(button);
  });

 // My単語帳ボタン
  const myWordsButton = document.createElement('button');
  myWordsButton.textContent = 'My単語帳';
  myWordsButton.onclick = loadMyWords;
  sectionContainer.appendChild(myWordsButton);

  updateSectionButtonStyles();
}

function loadSection(sectionIndex) {
  // 現在のセクション進捗を保存（My単語帳の場合はスキップ）
  if (currentSectionIndex !== 'myWords') {
    saveCurrentSectionProgress(); // 通常セクションの進捗のみ保存
  } else {
    console.log('Skipping progress save for My単語帳.'); // **ログを残す**
  }

  // セクションインデックスを保存
  saveToLocalStorage(CURRENT_SECTION_KEY, sectionIndex);
  currentSectionIndex = sectionIndex;

  // セクションをロード
  if (currentSectionIndex === 'myWords') {
    // My単語帳をロード
    const myWords = loadFromLocalStorage(MY_WORDS_KEY);

    // **修正: データが空の場合の処理**
    if (!myWords || myWords.length === 0) {
      console.warn('My単語帳にデータがありません。');
      data = []; // データを空にリセット
    } else {
      data = [...myWords]; // My単語帳のデータをセット
    }

    // 現在のセクション名を更新
    currentSectionDisplay.textContent = 'My単語帳';

    // **元コード保持**
    // 現在のセクション名を別形式で記録可能（必要なら復元）
    // currentSectionDisplay.innerText = "セクション: My単語帳";

  } else if (sections[currentSectionIndex]) {
    // 通常セクションをロード
    const learnedIndices = sectionLearnedData[currentSectionIndex] || [];
    data = sections[currentSectionIndex].filter((_, idx) => !learnedIndices.includes(idx));
    currentSectionDisplay.textContent = `${currentSectionIndex + 1}日目`;
  } else {
    // **コメントアウトで元コードを保持**
    // console.error(`Invalid section index: ${currentSectionIndex}`);
    // data = [];
    console.error(`Invalid section index: ${currentSectionIndex}`); // エラー表示をそのまま維持
    data = []; // 不正なインデックスの場合は空データにする（必要に応じて修正）
  }

  // **元コードの保存処理をコメントアウト**
  // index = 0;
  // saveToLocalStorage(DATA_KEY, data);

  // 修正: 保存処理を維持しつつログを追加
  index = 0;
  saveToLocalStorage(CURRENT_INDEX_KEY, index);

  // **元コード保持**
  // saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);

  // 進捗と表示を更新
  updateProgress();
  showCard();
  updateSectionButtonStyles();

  // **ログは残す**
  console.log(`${sectionIndex}日目が正常にロードされました`, { currentSectionIndex, data });

  // **元コード保持**
  // return; // 必要に応じて後に復元可能
}

function saveCurrentSectionProgress() {
  console.log('saveCurrentSectionProgress called');
  console.log('Current Section Index:', currentSectionIndex);

  // My単語帳の場合は進捗を保存しない（コメントアウトして残す）
  // if (currentSectionIndex === 'myWords') {
  //   console.log('Skipping progress save for My単語帳');
  //   return;
  // }

  // currentSectionIndexが不正な場合にリセット
  if (currentSectionIndex < 0 || currentSectionIndex >= sections.length) {
    console.warn('Invalid currentSectionIndex. Resetting to default.');
    currentSectionIndex = 0; // デフォルトにリセット
    saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);
    return; // 進捗保存をスキップ
  }

  // セクションが存在しない場合のエラーハンドリング（元コードを維持）
  if (!sections[currentSectionIndex]) {
    console.error(`Invalid section data for currentSectionIndex: ${currentSectionIndex}`);
    return;
  }

  // 学習済みインデックスを収集（修正なし）
  const learnedIndices = [];
  sections[currentSectionIndex].forEach((word, idx) => {
    if (!data.some(d => d.word === word.word)) {
      learnedIndices.push(idx);
    }
  });

  // 学習済みインデックスを収集した結果をログ出力（元コード維持）
  console.log('Learned Indices for Section:', currentSectionIndex, learnedIndices);

  // 学習済みインデックスを保存（元コード維持）
  sectionLearnedData[currentSectionIndex] = learnedIndices;
  saveToLocalStorage(PROGRESS_KEY, sectionLearnedData);

  // 進捗保存完了のログ出力（元コード維持）
  console.log('Progress saved successfully for section:', currentSectionIndex);
}



function shuffleWords() {
  if (!data || data.length === 0) {
    alert("シャッフルする単語がありません。");
    return;
  }

  // 現在のセクション内の単語をシャッフル
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]]; // 配列の要素を交換
  }

  index = 0; // 最初の単語に戻す
  saveToLocalStorage(DATA_KEY, data);
  saveToLocalStorage(CURRENT_INDEX_KEY, index);

  alert("単語をシャッフルしました。");
  showCard(); // UIを更新
}

function resetList() {
  const confirmation = confirm("現在のセクションの学習データをリセットします。本当によろしいですか？");
  if (!confirmation) {
    return;
  }

  // 現在のセクションをリセットデータに戻す
  sectionLearnedData[currentSectionIndex] = [];
  saveToLocalStorage(PROGRESS_KEY, sectionLearnedData);

  // 現在のセクションのデータをリセット
  sections[currentSectionIndex] = [...defaultWordList.slice(currentSectionIndex * sectionSize, (currentSectionIndex + 1) * sectionSize)];
  data = [...sections[currentSectionIndex]]; // 現在のセクションデータを再計算
  index = 0;

  saveToLocalStorage(DATA_KEY, data);
  saveToLocalStorage(CURRENT_INDEX_KEY, index);

  // セクション構造を再構築
  splitIntoSections();

  // ボタンスタイルを再構築
  createSectionButtons();

  // UIを更新
  updateProgress();
  showCard();
  updateSectionButtonStyles();

  alert("現在のセクションのデータをリセットしました。");
}

function resetAllSections() {
  sectionLearnedData = {};
  saveToLocalStorage(PROGRESS_KEY, sectionLearnedData);

  data = [...defaultWordList];
  splitIntoSections();
  createSectionButtons();
  loadSection(0);

  alert("すべてのセクションがリセットされました。");
}

function updateProgress() {
  let totalWords = 0;
  let remainingWords = 0;

  if (currentSectionIndex === 'myWords') {
    // My単語帳の場合
    totalWords = loadFromLocalStorage(MY_WORDS_KEY)?.length || 0; // My単語帳の全単語数
    remainingWords = data.length; // My単語帳の未学習単語数
  } else if (sections[currentSectionIndex]) {
    // 通常セクションの場合
    totalWords = sections[currentSectionIndex]?.length || 0; // 現在のセクションの単語総数
    remainingWords = data.length; // 未学習の単語数
  }

  if (totalWords === 0) {
    progressDisplay.textContent = `すべての単語を学習しました！`;
  } else if (remainingWords === 0) {
    progressDisplay.textContent = `学習完了！ 合計${totalWords}語`;
  } else {
    progressDisplay.textContent = `あと${remainingWords}語 / 合計${totalWords}語`;
  }
}


function updateSectionButtonStyles() {
  sections.forEach((_, idx) => {
    const button = sectionContainer.children[idx];
    if (sectionLearnedData[idx]?.length === sections[idx].length) {
      button.style.backgroundColor = '#28a745';
      button.style.color = 'white';
      button.style.border = '1px solid #1e7e34';
    } else {
      button.style.backgroundColor = '';
      button.style.color = '';
      button.style.border = '';
    }
  });

  // My単語帳ボタンのスタイル設定
  const myWordsButton = sectionContainer.lastElementChild; // 最後のボタンを取得（My単語帳）
  const myWords = loadFromLocalStorage(MY_WORDS_KEY) || [];

  if (myWords.length === 0) {
    // データがない場合：ゴールド
    myWordsButton.style.backgroundColor = '#FFD700'; // ゴールド
    myWordsButton.style.color = 'black';
    myWordsButton.style.border = '1px solid #DAA520';
  } else {
    // データがある場合：ピンク
    myWordsButton.style.backgroundColor = '#FF69B4'; // ショッキングピンク
    myWordsButton.style.color = 'white';
    myWordsButton.style.border = '1px solid #FF1493';
  }

}

function updateSectionSize() {
  sectionSize = getSectionSize();
  saveToLocalStorage(SECTION_SIZE_KEY, sectionSize);
  resetAllSections();
  alert(`セクションサイズを${sectionSize}語に更新しました。`);
}

function importCSV(event, mode) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    let csvData = e.target.result;

    if (csvData.charCodeAt(0) === 0xFEFF) {
      csvData = csvData.slice(1);
    }

    const rows = csvData.split('\n').map(row => row.trim());
    const importedData = [];
    rows.forEach(row => {
      const [word, meaning, hint] = row.split(',');
      if (word && meaning) {
        importedData.push({ word: word.trim(), meaning: meaning.trim(), hint: hint ? hint.trim() : '' });
      }
    });

    if (importedData.length > 0) {
      if (mode === 'replace') {
        defaultWordList = importedData;
        saveToLocalStorage(DEFAULT_KEY, defaultWordList);

        resetAllSections();
        alert('単語データを置換しました。すべての進捗がリセットされました。');
      } else if (mode === 'add') {
        defaultWordList = [...defaultWordList, ...importedData];
        saveToLocalStorage(DEFAULT_KEY, defaultWordList);

        splitIntoSections();
        createSectionButtons();
        alert('単語データを追加しました。');
      }
    } else {
      alert('インポートされたCSVに有効なデータがありません。');
    }

    event.target.value = '';
  };

  reader.readAsText(file, 'UTF-8');
}

function showCard() {
  // data が空の場合の処理
  if (!data || data.length === 0) {
    wordDisplay.textContent = 'Good Job!';
    meaningDisplay.textContent = '';
    hintDisplay.textContent = '';
    confirmButton.style.display = 'none';
    learnedButton.style.display = 'none';
    notLearnedButton.style.display = 'none';
    hintButton.style.display = 'none';
    speakButton.style.display = 'none';
    addToMyWordsButton.style.display = 'none';

    // My単語帳の場合の進捗保存
    if (currentSectionIndex === 'myWords') {
      saveMyWordsProgress();
    } else if (sections[currentSectionIndex]) {
      // すべて学習済みの場合の状態保持
      sectionLearnedData[currentSectionIndex] = sections[currentSectionIndex].map((_, idx) => idx) || [];
      saveToLocalStorage(PROGRESS_KEY, sectionLearnedData);
    // updateSectionButtonStyles();
    }
    updateSectionButtonStyles();
    return;
  }

  // インデックスの範囲確認
  if (index >= data.length || index < 0) {
    console.warn('Index out of bounds. Resetting to 0.');
    index = 0; // インデックスをリセット
  }

  // 現在の単語を表示
  wordDisplay.textContent = data[index]?.word || '未設定';
  meaningDisplay.textContent = '';
  hintDisplay.textContent = '';
  confirmButton.style.display = 'inline';
  learnedButton.style.display = 'none';
  notLearnedButton.style.display = 'none';
  hintButton.style.display = 'inline';
  speakButton.style.display = 'inline';
  addToMyWordsButton.style.display = 'inline';
}

function initializeApp() {
  setInitialSectionSize(); // セクションサイズの初期化
  splitIntoSections(); // セクションを分割
  createSectionButtons(); // セクションボタンの作成

  // 現在のセクションインデックスをローカルストレージからロード
  currentSectionIndex = loadFromLocalStorageValue(CURRENT_SECTION_KEY, 0);

if (currentSectionIndex === 'myWords' || currentSectionIndex >= sections.length || currentSectionIndex < 0) {
  console.warn('Invalid currentSectionIndex. Resetting to default.');
  currentSectionIndex = 0;
  saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);
}

  // セクションインデックスが範囲外の場合を修正
  if (currentSectionIndex >= sections.length || currentSectionIndex < 0 || !sections[currentSectionIndex]) {
    console.warn('Invalid currentSectionIndex. Resetting to default.');
    currentSectionIndex = 0; // デフォルトにリセット
    saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);
  }

  // 現在のセクションのデータをロード
  if (currentSectionIndex === 'myWords') {
    const myWords = loadFromLocalStorage(MY_WORDS_KEY);
  　data = myWords.length > 0 ? [...myWords] : [];
  　updateProgress(); // 進捗の初期化
  } else if (sections[currentSectionIndex]) {
    const learnedIndices = sectionLearnedData[currentSectionIndex] || [];
    data = sections[currentSectionIndex].filter((_, idx) => !learnedIndices.includes(idx));
  } else {
    console.error(`Invalid section: ${currentSectionIndex}`);
    data = []; // デフォルトで空の配列
  }

  // 現在のセクションの進捗データをロード
  const learnedIndices = sectionLearnedData[currentSectionIndex] || [];
  if (learnedIndices.length === sections[currentSectionIndex]?.length) {
    data = []; // すべて学習済みの場合
  } else {
    data = sections[currentSectionIndex].filter((_, idx) => !learnedIndices.includes(idx));
  }

  // 現在の単語インデックスを復元
  index = loadFromLocalStorageValue(CURRENT_INDEX_KEY, 0);
  if (index >= data.length) {
    index = 0; // 範囲外ならリセット
  }

  // 現在のセクション表示を更新
  currentSectionDisplay.textContent = `${currentSectionIndex + 1}日目`;

  // 保存
  saveToLocalStorage(DATA_KEY, data);
  saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);
  saveToLocalStorage(CURRENT_INDEX_KEY, index);

  // 初期カードを表示
  showCard();
  updateProgress(); // 進捗を表示
  updateSectionButtonStyles(); // ボタンのスタイルを更新

  // ボタンのイベントリスナー設定
  confirmButton.onclick = showBack;
  hintButton.onclick = showHint;
  speakButton.onclick = speakCurrentWord;
  learnedButton.onclick = markAsLearned;
  notLearnedButton.onclick = nextCard;
  addToMyWordsButton.onclick = addToMyWords;

  // document.getElementById('updateSectionSizeButton').onclick = updateSectionSize;
  // document.getElementById('resetCurrentSectionButton').onclick = resetCurrentSection;
  document.getElementById('importFileAdd').onchange = (e) => importCSV(e, 'add');
  document.getElementById('importFileReplace').onchange = (e) => importCSV(e, 'replace');
}

function showBack() {
  if (!data || !data[index]) {
    console.error('Invalid data or index:', data, index);
    meaningDisplay.textContent = 'データがありません';
    return;
  }

  meaningDisplay.textContent = data[index].meaning || '未設定';
  confirmButton.style.display = 'none';
  learnedButton.style.display = 'inline';
  notLearnedButton.style.display = 'inline';
  hintButton.style.display = 'none';
}

function showHint() {
  hintDisplay.textContent = data[index].hint || 'ヒントはありません';
}

function speakCurrentWord() {
  if (!window.speechSynthesis) {
    alert('このブラウザは音声合成に対応していません。');
    return;
  }

  // 現在の単語データが有効かチェック
  if (data[index] && data[index].word) {
    // 新しいコード：音声合成の設定を明示化
    const utterance = new SpeechSynthesisUtterance(data[index].word);
    utterance.lang = 'en-US'; // 英語（アメリカ）
    utterance.rate = 0.9;     // 発音速度を調整
    utterance.pitch = 1.0;    // ピッチをデフォルトに設定

    // 旧コードをコメントアウト
    // const utterance = new SpeechSynthesisUtterance(data[index].word);
    // utterance.lang = 'en-US';
    // window.speechSynthesis.speak(utterance);

    // 修正：音声再生前に既存の音声をキャンセル
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    console.log(`発音中: ${data[index].word}`);
  } else {
    console.error('Invalid data or index for speech synthesis:', data, index);
  }
}

function markAsLearned() {
  if (data.length > 0) {
    // 現在の単語を学習済みとして記録
    const learnedWord = data.splice(index, 1);

    // セクションが`myWords`の場合の処理
    if (currentSectionIndex === 'myWords') {
      const myWords = loadFromLocalStorage(MY_WORDS_KEY) || [];

if (!learnedWord || learnedWord.length === 0 || !learnedWord[0]) {
  console.error('学習済み単語が無効です:', learnedWord);

  alert(
    '学習済みの操作に失敗しました。データが無効なため、現在のセクションをリセットします。'
  );

  // 自動的に現在のセクションをリセット
  resetList();
  return;
}

      // 現在の単語をMy単語帳から削除
      const updatedMyWords = myWords.filter(word => word.word !== learnedWord[0].word);
      saveToLocalStorage(MY_WORDS_KEY, updatedMyWords);

      console.log('My単語帳の更新後データ:', updatedMyWords);

    } else if (sections[currentSectionIndex]) {
      // 通常セクションの場合
      const originalIndex = sections[currentSectionIndex].findIndex(
        word => word.word === learnedWord[0].word
      );

      if (originalIndex !== -1) {
        // 学習済みインデックスを進捗データに追加
        sectionLearnedData[currentSectionIndex].push(originalIndex);
        saveToLocalStorage(PROGRESS_KEY, sectionLearnedData); // 進捗データをローカルストレージに保存
      }
    } else {
      console.error(`Invalid section data for currentSectionIndex: ${currentSectionIndex}`);
    }

    // インデックスが範囲外にならないよう調整
    if (index >= data.length) {
      index = 0;
    }

    // ローカルストレージに現在の単語データとインデックスを保存
    saveToLocalStorage(DATA_KEY, data);
    saveToLocalStorage(CURRENT_INDEX_KEY, index);

    // 進捗を更新し、次のカードを表示
    updateProgress();
    showCard();
  }
}


function nextCard() {
  if (data.length > 0) {
    index = (index + 1) % data.length;
    saveToLocalStorage(CURRENT_INDEX_KEY, index);
    showCard();
  }
}

function addToMyWords() {
  // 現在の単語を取得
  if (!data || !data[index] || !data[index].word) {
    console.error('Invalid current word data:', data[index]);
    alert('現在の単語が無効です。');
    return;
  }

  const currentWord = data[index];

  // My単語帳データをロードまたは初期化
  const myWords = loadFromLocalStorage(MY_WORDS_KEY) || [];

  // My単語帳にすでに登録されているかチェック（安全に処理）
  if (
    currentWord &&
    myWords.some(word => word && word.word === currentWord.word)
  ) {
    console.warn('This word is already in My単語帳:', currentWord.word);
    alert('この単語はすでにMy単語帳に登録されています。');
    return;
  }

  // My単語帳に追加
  myWords.push(currentWord);
  saveToLocalStorage(MY_WORDS_KEY, myWords);

  alert(`単語「${currentWord.word}」をMy単語帳に追加しました。`);
　updateSectionButtonStyles();
}

function loadMyWords() {

let myWords = loadFromLocalStorage(MY_WORDS_KEY) || []; // 修正箇所

  // 不正なデータをフィルタリング
  myWords = myWords.filter(word => word && typeof word.word === 'string' && typeof word.meaning === 'string');

  console.log('フィルタ後のMY_WORDS_KEYデータ:', myWords);

  if (myWords.length === 0) {
   // console.warn('No words found in My単語帳. [修正時刻: 2024年12月2日20時57分（JST）]');
   // handleEmptyMyWords();
   // return;
  }

  // 修正箇所: エラー処理の追加 [修正時刻: 2024年12月2日20時57分（JST）]
  try {
    // My単語帳データをロード
    let myWords = loadFromLocalStorage(MY_WORDS_KEY) || []; // nullの場合でも初期化

    // 修正箇所: 無効データのフィルタリングを強化 [修正時刻: 2024年12月2日20時57分（JST）]
    myWords = myWords.filter(word => word && typeof word.word === 'string' && typeof word.meaning === 'string');

    console.log('フィルタ後のMY_WORDS_KEYデータ:', myWords);

    // My単語帳が空の場合の処理
    if (!myWords || myWords.length === 0) {
      // 修正箇所: My単語帳が空の場合の処理を追加 [修正時刻: 2024年12月2日20時57分（JST）]
      //console.warn('No words found in My単語帳. [修正時刻: 2024年12月2日20時57分（JST）]');
      //handleEmptyMyWords(); // 空データ時の処理を明確化
      //return;
    }

    // 進捗保存
    if (currentSectionIndex !== 'myWords') {
      // 修正箇所: 進捗保存の条件分岐を追加 [修正時刻: 2024年12月2日20時57分（JST）]
      saveCurrentSectionProgress();
    } else {
      console.log('進捗保存をスキップしました: My単語帳 [修正時刻: 2024年12月2日20時57分（JST）]');
    }

    // セクション切り替え
    currentSectionIndex = 'myWords'; // セクションを My単語帳 に切り替え
    saveToLocalStorage(CURRENT_SECTION_KEY, currentSectionIndex);

    // データ設定
    data = [...myWords]; // My単語帳のデータを設定
    index = 0; // インデックスをリセット
    saveToLocalStorage(CURRENT_INDEX_KEY, index);

    // セクション名更新
    currentSectionDisplay.textContent = 'My単語帳';

    // カード表示
    showCard();

    // 進捗更新
    updateProgress();

    // 修正箇所: My単語帳の正常ロードログを追加 [修正時刻: 2024年12月2日20時57分（JST）]
    console.log('My単語帳が正常にロードされました [修正時刻: 2024年12月2日20時57分（JST）]:', { data, currentSectionIndex });
  } catch (error) {
    // 修正箇所: エラーのキャッチ処理を追加 [修正時刻: 2024年12月2日20時57分（JST）]
    console.error('My単語帳のロード中にエラーが発生しました [修正時刻: 2024年12月2日20時57分（JST）]:', error);
    alert('エラーが発生しました。My単語帳のデータを確認してください。');
  }
}

// 修正箇所: 空のMy単語帳データを処理する関数を追加 [修正時刻: 2024年12月2日20時57分（JST）]
function handleEmptyMyWords() {
  data = []; // データを空にリセット
  index = 0; // インデックスをリセット

  // ローカルストレージに保存
  saveToLocalStorage(DATA_KEY, data);
  saveToLocalStorage(CURRENT_INDEX_KEY, index);

  currentSectionDisplay.textContent = 'My単語帳 (空)';
  showCard();
  updateProgress();

  console.log('My単語帳が空の状態で処理を完了しました [修正時刻: 2024年12月2日20時57分（JST）]');
}



function saveMyWordsProgress() {
  if (currentSectionIndex === 'myWords') {
    // My単語帳の進捗保存処理
    const myWords = loadFromLocalStorage(MY_WORDS_KEY);
    const remainingWords = data;
    const updatedMyWords = myWords.filter(word => remainingWords.some(w => w.word === word.word));
    saveToLocalStorage(MY_WORDS_KEY, updatedMyWords);

    // デバッグ用ログを追加
    console.log('My単語帳の進捗を保存しました:', updatedMyWords);
  }
}


// すべてのセクションの進捗データをエクスポート（My単語帳を除く）
function exportCSV() {
  // 進捗データを反映した各セクションのデータを構築
  const progressData = sections.map((section, sectionIndex) => {
    const learnedIndices = sectionLearnedData[sectionIndex] || [];
    return section.filter((_, idx) => !learnedIndices.includes(idx)); // 未学習のデータのみ
  });

  // 各セクションのデータを結合
  const allProgressData = progressData.flat();

  // データが空の場合のチェック
  if (allProgressData.length === 0) {
    alert("エクスポートする進捗データがありません。");
    return;
  }

  // CSVデータの生成
  const csvData = allProgressData.map(row => {
    const word = row.word || '';
    const meaning = row.meaning || '';
    const hint = row.hint || '';
    return `${word},${meaning},${hint}`;
  }).join('\n');

  // Blobオブジェクトを作成してダウンロード
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'progress_data.csv'; // ダウンロードファイル名
  a.click();
  URL.revokeObjectURL(url); // メモリ解放

  console.log("進捗データをCSVとしてエクスポートしました。");
}


// My単語帳をカンマ区切り形式でエクスポート
function exportMyWordsToCSV() {
  const myWords = loadFromLocalStorage(MY_WORDS_KEY) || [];

  if (myWords.length === 0) {
    alert("My単語帳にデータがありません。");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";

  // 各単語をカンマ区切りで追加
  myWords.forEach(word => {
    const row = [
      word.word || '', // 英語
      word.meaning || '', // 日本語
      word.hint || '' // ヒント
    ].join(","); // カンマで区切る
    csvContent += row + "\n"; // 改行を追加
  });

  // CSVをダウンロード
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "MyWords.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log("My単語帳をCSVとしてエクスポートしました。");
}

function addWordToMyWords() {
  const word = document.getElementById('newMyWord').value.trim();
  const meaning = document.getElementById('newMyMeaning').value.trim();
  const hint = document.getElementById('newMyHint').value.trim();

  if (!word || !meaning) {
    alert('英単語と日本語訳は必須です。');
    return;
  }

  // My単語帳データを取得
  let myWords = loadFromLocalStorage(MY_WORDS_KEY) || [];

  // 重複チェック
  if (myWords.some(existingWord => existingWord.word === word)) {
    alert(`単語「${word}」は既にMy単語帳に登録されています。`);
    return;
  }

  // 新しい単語を追加
  myWords.push({ word, meaning, hint });
  saveToLocalStorage(MY_WORDS_KEY, myWords);

  alert(`単語「${word}」をMy単語帳に追加しました！`);

  // フィールドをクリア
  document.getElementById('newMyWord').value = '';
  document.getElementById('newMyMeaning').value = '';
  document.getElementById('newMyHint').value = '';

　loadMyWords();
}

initializeApp();
