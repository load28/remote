// P-02: 50+ 항목 가상화를 위한 mock 데이터

import type { RecentUser } from '@/features/auth/types';

const NAMES = [
  '김민수', '이서연', '박지훈', '최유진', '정태현',
  '강수빈', '조현우', '윤하영', '임도현', '한소희',
  '서민준', '오예린', '배준서', '류시은', '신동현',
  '권나연', '장현준', '황서윤', '문재현', '양하은',
  '송민서', '안태윤', '유지원', '홍승현', '전소민',
  '남주혁', '구하린', '백승민', '노유나', '하태준',
  '변서영', '추민혁', '진소연', '공태영', '성하윤',
  '탁준영', '차예은', '봉현서', '석지우', '길태민',
  '맹서하', '어준호', '용예지', '주태은', '위현수',
  '연서빈', '피준서', '감혜민', '독고현', '제갈윤',
  '남궁서', '사공민', '선우진', '황보현', '소하늘',
];

export const MOCK_RECENT_USERS: RecentUser[] = NAMES.map((name, i) => {
  const username = `user${i + 10}`;
  return {
    id: `recent-${i}`,
    username,
    displayName: name,
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
  };
});
