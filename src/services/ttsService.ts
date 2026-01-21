/**
 * 브라우저의 SpeechSynthesis API를 사용하여 Text-to-Speech(TTS) 기능을 제공하는 서비스입니다.
 * 이 서비스는 텍스트를 음성으로 변환하고, 재생, 중지, 언어 선택 등의 기능을 캡슐화합니다.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
 */

// 사용 가능한 음성 목록을 저장하기 위한 변수입니다. 이 목록은 비동기적으로 로드됩니다.
let voices: SpeechSynthesisVoice[] = [];

/**
 * 브라우저에서 사용 가능한 음성 목록을 가져와 `voices` 배열을 채웁니다.
 * 이 함수는 초기에 한 번 호출되고, 'voiceschanged' 이벤트가 발생할 때마다 다시 호출되어
 * 음성 목록을 최신 상태로 유지합니다.
 */
const populateVoiceList = () => {
  if (typeof speechSynthesis === 'undefined') {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }
  voices = speechSynthesis.getVoices();
};

// 페이지 로드 시 음성 목록을 초기에 가져옵니다.
populateVoiceList();

// 음성 목록이 변경될 때 (예: 비동기적으로 로드 완료) 목록을 다시 가져오도록 이벤트 리스너를 설정합니다.
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

/**
 * 지정된 언어 코드에 가장 적합한 음성을 찾아서 반환합니다.
 * @param lang 찾고자 하는 언어의 코드 ('ko' 또는 'lo').
 * @returns {SpeechSynthesisVoice | null} 찾은 음성 객체 또는 null.
 */
const getVoice = (lang: 'ko' | 'lo'): SpeechSynthesisVoice | null => {
  // `voices` 배열이 비어있을 경우를 대비해 다시 목록을 가져옵니다.
  if (!voices.length) {
    populateVoiceList();
  }

  // 프로젝트에서 사용하는 언어 코드('ko', 'lo')를 SpeechSynthesisVoice의 lang 속성 형식('ko-KR', 'lo-LA')에 맞게 변환합니다.
  const langCode = lang === 'ko' ? 'ko-KR' : 'lo-LA';

  // 1. 가장 정확하게 일치하는 음성을 찾습니다 (예: 'ko-KR').
  let voice = voices.find(v => v.lang === langCode);
  if (voice) return voice;

  // 2. 정확한 음성이 없을 경우, 언어 코드로 시작하는 음성을 찾습니다 (예: 'ko').
  voice = voices.find(v => v.lang.startsWith(lang));
  if (voice) return voice;

  // 3. 특정 이름(예: 'Google')을 포함하는 음성을 우선적으로 고려할 수 있습니다 (품질이 더 좋은 경향이 있음).
  voice = voices.find(v => v.lang.startsWith(lang) && v.name.includes('Google'));
  if (voice) return voice;

  // 적합한 음성을 찾지 못하면 null을 반환합니다.
  return null;
};

/**
 * 주어진 텍스트를 지정된 언어로 읽어주는 함수입니다.
 * @param {string} text - 음성으로 변환할 텍스트.
 * @param {'ko' | 'lo'} lang - 텍스트의 언어.
 */
const speak = (text: string, lang: 'ko' | 'lo'): void => {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }

  // 이전에 재생 중이던 음성이 있다면 중단시킵니다.
  speechSynthesis.cancel();

  // 음성 변환을 위한 SpeechSynthesisUtterance 인스턴스를 생성합니다.
  const utterance = new SpeechSynthesisUtterance(text);

  // 해당 언어에 맞는 음성을 찾아 설정합니다.
  const voice = getVoice(lang);
  if (voice) {
    utterance.voice = voice;
  } else {
    // 적합한 음성을 찾지 못했을 경우, 브라우저의 기본 음성을 사용하도록 언어 속성만 설정합니다.
    console.warn(`No specific voice found for language: ${lang}. Using browser default.`);
    utterance.lang = lang;
  }

  // 필요에 따라 음성의 속성(높낮이, 속도 등)을 조절할 수 있습니다.
  // utterance.pitch = 1;
  // utterance.rate = 1;
  // utterance.volume = 1;

  // 음성 재생을 시작합니다.
  speechSynthesis.speak(utterance);
};

/**
 * 현재 재생 중인 모든 음성을 즉시 중단합니다.
 */
const cancel = (): void => {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }
  speechSynthesis.cancel();
};

/**
 * 현재 음성이 재생 중인지 여부를 확인합니다.
 * @returns {boolean} 음성이 재생 중이면 true, 아니면 false.
 */
const isSpeaking = (): boolean => {
  if (typeof speechSynthesis === 'undefined') {
    return false;
  }
  return speechSynthesis.speaking;
};

/**
 * ttsService 객체로 TTS 관련 함수들을 내보냅니다.
 */
export const ttsService = {
  speak,
  cancel,
  isSpeaking,
};
