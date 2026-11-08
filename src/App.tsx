import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  CircleAlert,
  FileSearch,
  LayoutGrid,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { loadResults, type Category, type Result } from "./data";
import { getVisibleRange, searchResults, type SortOrder } from "./search";

const categories: Array<Category | "전체"> = [
  "전체",
  "디자인",
  "개발",
  "마케팅",
  "비즈니스",
];
const ROW_HEIGHT = 112;
const numberFormat = new Intl.NumberFormat("ko-KR");

function App() {
  const [items, setItems] = useState<Result[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<Category | "전체">("전체");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Result | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fail =
      new URLSearchParams(window.location.search).get("state") === "error";
    loadResults(controller.signal, fail)
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setViewportHeight(node.clientHeight),
    );
    observer.observe(node);
    setViewportHeight(node.clientHeight);
    return () => observer.disconnect();
  }, [status]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const results = useMemo(
    () => searchResults(items, deferredQuery, category, sort),
    [items, deferredQuery, category, sort],
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>([["전체", items.length]]);
    for (const item of items)
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return counts;
  }, [items]);
  const { start, end } = getVisibleRange(
    scrollTop,
    viewportHeight,
    results.length,
    ROW_HEIGHT,
  );
  const visible = results.slice(start, end);

  const resetPosition = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
    setScrollTop(0);
    setActiveIndex(0);
  }, []);

  const changeCategory = (next: Category | "전체") => {
    setCategory(next);
    setMobileFiltersOpen(false);
    resetPosition();
  };

  const changeQuery = (next: string) => {
    setQuery(next);
    resetPosition();
  };

  const onListScroll = () => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      setScrollTop(listRef.current?.scrollTop ?? 0);
      frameRef.current = null;
    });
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!results.length) return;
    let next = activeIndex;
    if (event.key === "ArrowDown")
      next = Math.min(results.length - 1, activeIndex + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, activeIndex - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = results.length - 1;
    else if (event.key === "PageDown")
      next = Math.min(
        results.length - 1,
        activeIndex + Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT)),
      );
    else if (event.key === "PageUp")
      next = Math.max(
        0,
        activeIndex - Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT)),
      );
    else if (event.key === "Enter") {
      setSelected(results[activeIndex]);
      return;
    } else return;
    event.preventDefault();
    setActiveIndex(next);
    const top = next * ROW_HEIGHT;
    const node = listRef.current;
    if (node) {
      if (top < node.scrollTop) node.scrollTop = top;
      else if (top + ROW_HEIGHT > node.scrollTop + node.clientHeight)
        node.scrollTop = top + ROW_HEIGHT - node.clientHeight;
      setScrollTop(node.scrollTop);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

  const retry = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("state");
    window.history.replaceState(null, "", url);
    setStatus("loading");
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="주 메뉴">
        <a className="brand" href="/" aria-label="Atlas 홈">
          <span className="brand-mark">
            <LayoutGrid size={18} strokeWidth={2.5} />
          </span>
          <span>
            atlas<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="탐색">
          <a className="nav-link active" href="#results">
            <FileSearch size={18} /> 검색 결과
          </a>
          <a className="nav-link" href="#guide">
            <BookOpen size={18} /> 사용 가이드
          </a>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">카테고리</div>
        <div className="category-nav" aria-label="카테고리 필터">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className={`category-link ${category === name ? "selected" : ""}`}
              onClick={() => changeCategory(name)}
              aria-pressed={category === name}
            >
              <span className={`category-dot dot-${name}`} />{" "}
              <span>{name}</span>
              <span className="category-count">
                {numberFormat.format(categoryCounts.get(name) ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <span className="sidebar-bottom-icon">
            <SlidersHorizontal size={17} />
          </span>
          <div>
            <strong>빠르게 탐색하세요</strong>
            <p>20,000개의 결과를 한곳에서</p>
          </div>
        </div>
      </aside>

      <main className="main-content" id="results">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>검색 결과</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-avatar">A</span>
            <span>Atlas Workspace</span>
            <ChevronDown size={15} />
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> EXPLORE YOUR CONTENT
              </div>
              <h1>
                검색 결과<span className="heading-period">.</span>
              </h1>
              <p>필요한 정보를 더 빠르고 정확하게 찾아보세요.</p>
            </div>
            <div className="heading-decoration" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <section className="search-panel" aria-label="검색 및 필터">
            <label className="search-box">
              <Search size={21} aria-hidden="true" />
              <span className="sr-only">결과 검색</span>
              <input
                type="search"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="제목, 내용, 작성자로 검색해 보세요"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="clear-button"
                  aria-label="검색어 지우기"
                  onClick={() => changeQuery("")}
                >
                  <X size={17} />
                </button>
              )}
            </label>
            <div className="search-panel-bottom">
              <div className="filter-buttons" aria-label="카테고리 필터">
                {categories.map((name) => (
                  <button
                    key={name}
                    className={`filter-chip ${category === name ? "is-active" : ""}`}
                    type="button"
                    onClick={() => changeCategory(name)}
                    aria-pressed={category === name}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button
                className="mobile-filter-toggle"
                type="button"
                onClick={() => setMobileFiltersOpen((open) => !open)}
                aria-expanded={mobileFiltersOpen}
              >
                <SlidersHorizontal size={17} /> 필터
              </button>
              <span className="filter-hint">
                {query ? `“${query}” 검색 중` : "전체 콘텐츠에서 검색"}
              </span>
            </div>
            {mobileFiltersOpen && (
              <div className="mobile-filter-menu" aria-label="카테고리 필터">
                {categories.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => changeCategory(name)}
                    aria-pressed={category === name}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="results-section" aria-labelledby="result-heading">
            <div className="results-toolbar">
              <div>
                <div className="results-title-line">
                  <h2 id="result-heading">전체 결과</h2>
                  <span className="total-badge">
                    {numberFormat.format(
                      status === "ready" ? results.length : 0,
                    )}
                  </span>
                </div>
                <p aria-live="polite" aria-atomic="true">
                  {status === "loading"
                    ? "결과를 불러오는 중입니다."
                    : status === "error"
                      ? "결과를 불러오지 못했습니다."
                      : `${numberFormat.format(results.length)}개의 결과를 찾았습니다.`}
                </p>
              </div>
              <label className="sort-control">
                <span>정렬</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortOrder);
                    resetPosition();
                  }}
                >
                  <option value="recent">최신순</option>
                  <option value="popular">조회순</option>
                  <option value="oldest">오래된순</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>
            </div>
            {status === "loading" && (
              <div className="state-panel" role="status">
                <LoaderCircle className="spin" size={28} />
                <h3>결과를 불러오고 있어요</h3>
                <p>잠시만 기다려 주세요.</p>
              </div>
            )}
            {status === "error" && (
              <div className="state-panel" role="alert">
                <div className="state-icon error">
                  <CircleAlert size={27} />
                </div>
                <h3>검색 결과를 불러오지 못했어요</h3>
                <p>일시적인 문제가 발생했습니다. 다시 시도해 주세요.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={retry}
                >
                  다시 시도
                </button>
              </div>
            )}
            {status === "ready" && results.length === 0 && (
              <div className="state-panel" role="status">
                <div className="state-icon">
                  <FileSearch size={28} />
                </div>
                <h3>검색 결과가 없어요</h3>
                <p>다른 검색어나 카테고리로 다시 찾아보세요.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    changeQuery("");
                    changeCategory("전체");
                  }}
                >
                  필터 초기화
                </button>
              </div>
            )}
            {status === "ready" && results.length > 0 && (
              <>
                <div className="list-heading">
                  <span>콘텐츠</span>
                  <span>카테고리</span>
                  <span>작성자</span>
                  <span>작성일</span>
                  <span className="sr-only">자세히 보기</span>
                </div>
                <div
                  className="result-list"
                  ref={listRef}
                  onScroll={onListScroll}
                  onKeyDown={onListKeyDown}
                  role="listbox"
                  tabIndex={0}
                  aria-label="검색 결과. 방향키로 이동하고 Enter로 자세히 보기"
                  aria-activedescendant={`result-${results[activeIndex]?.id}`}
                >
                  <div
                    className="list-spacer"
                    style={{ height: results.length * ROW_HEIGHT }}
                  >
                    <div
                      style={{
                        transform: `translateY(${start * ROW_HEIGHT}px)`,
                      }}
                    >
                      {visible.map((item, offset) => (
                        <div
                          key={item.id}
                          id={`result-${item.id}`}
                          role="option"
                          aria-selected={selected?.id === item.id}
                          aria-posinset={start + offset + 1}
                          aria-setsize={results.length}
                          className={`result-row ${activeIndex === start + offset ? "keyboard-active" : ""}`}
                          onClick={() => {
                            setActiveIndex(start + offset);
                            setSelected(item);
                          }}
                        >
                          <div className="result-primary">
                            <span
                              className={`result-thumbnail thumb-${item.category}`}
                            >
                              <span>
                                {item.category === "디자인"
                                  ? "✳"
                                  : item.category === "개발"
                                    ? "⌘"
                                    : item.category === "마케팅"
                                      ? "◈"
                                      : "↗"}
                              </span>
                            </span>
                            <div className="result-copy">
                              <strong>{item.title}</strong>
                              <p>{item.description}</p>
                            </div>
                          </div>
                          <span
                            className={`category-pill pill-${item.category}`}
                          >
                            {item.category}
                          </span>
                          <span className="author-cell">
                            <span className="mini-avatar">{item.initials}</span>
                            {item.author}
                          </span>
                          <time dateTime={item.date}>{item.date}</time>
                          <ArrowUpRight
                            size={18}
                            className="row-arrow"
                            aria-hidden="true"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="list-footer">
                  <span>총 {numberFormat.format(results.length)}개 결과</span>
                  <span>
                    <ArrowDown size={15} /> 스크롤하여 더 보기
                  </span>
                </div>
              </>
            )}
          </section>
          <footer id="guide" className="page-footer">
            Atlas · 대량의 콘텐츠를 빠르게 탐색하는 공간
          </footer>
        </div>
      </main>
      <dialog
        ref={dialogRef}
        className="detail-dialog"
        onClose={() => {
          setSelected(null);
          listRef.current?.focus();
        }}
        aria-labelledby="detail-title"
      >
        {selected && (
          <>
            <div className="dialog-top">
              <span className={`category-pill pill-${selected.category}`}>
                {selected.category}
              </span>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => dialogRef.current?.close()}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="detail-title">{selected.title}</h2>
            <p className="dialog-description">{selected.description}</p>
            <dl>
              <div>
                <dt>작성자</dt>
                <dd>{selected.author}</dd>
              </div>
              <div>
                <dt>작성일</dt>
                <dd>{selected.date}</dd>
              </div>
              <div>
                <dt>조회수</dt>
                <dd>{numberFormat.format(selected.views)}</dd>
              </div>
            </dl>
          </>
        )}
      </dialog>
    </div>
  );
}

export default App;
