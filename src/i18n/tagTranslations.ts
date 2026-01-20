/**
 * 학과/태그 다국어 매핑
 * 백엔드에서 받은 한국어 태그를 현재 언어로 번역
 */

export const tagTranslations: Record<string, { ko: string; lo: string }> = {
  // 실제 학과 목록
  '건축학부': { ko: '건축학부', lo: 'ຄະນະສະຖາປັດຕະຍາກຳສາດ' },
  '공과대학': { ko: '공과대학', lo: 'ຄະນະວິສະວະກຳສາດ' },
  '농업경제·식품기술학과': { ko: '농업경제·식품기술학과', lo: 'ສາຂາເສດຖະກິດກະສິກຳ ແລະ ເຕັກໂນໂລຊີອາຫານ' },
  '농학부': { ko: '농학부', lo: 'ຄະນະກະສິກຳ' },
  '수의학과': { ko: '수의학과', lo: 'ສາຂາສັດທະແພດ' },
  '자연과학부': { ko: '자연과학부', lo: 'ຄະນະວິທະຍາສາດທຳມະຊາດ' },
  '축산수산학과': { ko: '축산수산학과', lo: 'ສາຂາປະສຸສັດ ແລະ ປະມົງ' },
  '형법학과': { ko: '형법학과', lo: 'ສາຂາກົດໝາຍອາຍາ' },
  '기술학과': { ko: '기술학과', lo: 'ສາຂາຊີອາຫານ' },
  '농업자원경제학과': { ko: '농업자원경제학과', lo: 'ສາຂາເສດຖະກິດຊັບພະຍານ ກະສິກຳ' },
  '동물자원학과': { ko: '동물자원학과', lo: 'ສາຂາຊັບພະຍານ' },

}

/**
 * 태그를 현재 언어로 번역
 * @param tag 원본 태그 (한국어)
 * @param language 현재 언어 ('ko' | 'lo')
 * @returns 번역된 태그
 */
export function translateTag(tag: string, language: 'ko' | 'lo'): string {
  const translation = tagTranslations[tag]
  if (!translation) return tag // 매핑이 없으면 원본 반환
  return translation[language]
}

/**
 * 여러 태그를 한번에 번역
 * @param tags 태그 배열
 * @param language 현재 언어
 * @returns 번역된 태그 배열
 */
export function translateTags(tags: string[], language: 'ko' | 'lo'): string[] {
  return tags.map(tag => translateTag(tag, language))
}
