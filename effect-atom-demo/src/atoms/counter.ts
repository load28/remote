import { Atom } from "@effect-atom/atom-react"

// 1. 기본 Writable 아톰 - 가장 단순한 형태
export const countAtom = Atom.make(0)

// 2. 파생(derived) 아톰 - 다른 아톰으로부터 계산된 읽기 전용 상태
export const doubleCountAtom = Atom.make((get) => get(countAtom) * 2)

export const countLabelAtom = Atom.make((get) => {
  const count = get(countAtom)
  if (count === 0) return "아직 클릭하지 않았어요"
  if (count < 5) return "조금 더 눌러보세요!"
  if (count < 10) return "좋아요, 계속 가보죠! 🔥"
  return "대단해요! 마스터 수준! 🎯"
})

// 3. keepAlive - 컴포넌트가 언마운트되어도 상태 유지
export const persistentCountAtom = Atom.keepAlive(Atom.make(0))
