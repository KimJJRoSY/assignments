# 검색 결과 화면 성능 개선

React + TypeScript로 만든 대량 검색 결과 탐색 화면입니다.

Node.js 22 LTS 또는 24 이상을 권장합니다.

## 실행

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## 구현

- 20,000개 샘플 결과를 클라이언트에서 생성합니다.
- 검색어, 카테고리, 정렬을 조합해 탐색할 수 있습니다. `useDeferredValue`로 입력 반응을 유지하고, 결과 계산은 메모이제이션합니다.
- 결과 목록은 고정 높이 행과 오버스캔을 이용해 화면에 필요한 행만 렌더링합니다. 방향키, Home/End, Page Up/Down, Enter로 목록을 탐색할 수 있습니다.
- 로딩·오류·빈 상태에 상태 메시지와 복구 동작을 제공합니다. 오류 상태는 `?state=error`로 확인할 수 있습니다.
- 검색·정렬·가상 목록 범위 계산을 Vitest로 검증합니다.

샘플 데이터 로딩은 실제 API 대신 비동기 함수로 모델링했습니다. 실제 서비스에 연결할 때 `loadResults`를 API 호출로 교체하면 됩니다.
