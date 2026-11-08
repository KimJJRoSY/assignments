export type Category = "디자인" | "개발" | "마케팅" | "비즈니스";
export type Result = {
  id: number;
  title: string;
  description: string;
  category: Category;
  author: string;
  date: string;
  views: number;
  initials: string;
};

const categories: Category[] = ["디자인", "개발", "마케팅", "비즈니스"];
const subjects = [
  "사용자 경험을 바꾸는 작은 디테일",
  "효율적인 협업을 위한 실전 가이드",
  "데이터로 발견한 새로운 기회",
  "더 빠른 제품 개발을 위한 전략",
  "좋은 서비스를 만드는 질문들",
  "팀의 성장을 돕는 업무 방식",
  "아이디어를 결과로 만드는 과정",
  "고객의 목소리에서 찾은 인사이트",
];
const descriptions = [
  "복잡한 문제를 단순하게 풀어내는 방법과 실제 프로젝트에서 얻은 배움을 공유합니다.",
  "현장에서 바로 적용할 수 있는 핵심 원칙과 사례를 한눈에 살펴보세요.",
  "더 나은 의사결정을 위해 알아두면 좋은 흐름과 실무 팁을 정리했습니다.",
  "작은 변화가 큰 차이를 만드는 순간을 구체적인 사례와 함께 소개합니다.",
];
const authors = [
  "김지민",
  "이서연",
  "박도현",
  "최하은",
  "정유진",
  "한민재",
  "오수빈",
  "윤태호",
];

export function createResults(count = 20000): Result[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const author = authors[index % authors.length];
    const date = new Date(Date.UTC(2026, 10, 8 - (index % 730)));
    return {
      id,
      title: subjects[index % subjects.length],
      description: descriptions[(index * 3) % descriptions.length],
      category: categories[(index + Math.floor(index / 8)) % categories.length],
      author,
      date: date.toISOString().slice(0, 10),
      views: 800 + ((index * 7919) % 98200),
      initials: author.slice(1, 3),
    };
  });
}

export async function loadResults(
  signal: AbortSignal,
  fail = false,
): Promise<Result[]> {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 350);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
  if (fail) throw new Error("결과를 불러오지 못했습니다.");
  return createResults();
}
