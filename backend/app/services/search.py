try:
    from duckduckgo_search import DDGS
    SEARCH_AVAILABLE = True
except ImportError:
    SEARCH_AVAILABLE = False

def perform_web_search(query: str, max_results=3) -> str:
    if not SEARCH_AVAILABLE: return ""
    print(f"[SEARCH] Infiltrating public network for: {query}")
    try:
        results_text = ""
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            for i, res in enumerate(results):
                results_text += f"[Web Result {i+1}: {res['title']}]\n{res['body']}\nSource: {res['href']}\n\n"
        return results_text
    except Exception as e:
        print(f"[SEARCH ERROR] {e}")
        return ""
