"""
URL解析工具 - 专门处理学术论文URL（Arxiv等）
"""
import re
from typing import Tuple


def parse_arxiv_url(url: str) -> Tuple[str, str]:
    """
    解析 Arxiv URL
    
    Returns:
        (pdf_url, year) - PDF下载链接和论文年份
    """
    # 转换 /abs/ 为 /pdf/
    if "/abs/" in url:
        pdf_url = url.replace("/abs/", "/pdf/") + ".pdf"
    elif "/pdf/" in url and not url.endswith(".pdf"):
        pdf_url = url + ".pdf"
    else:
        pdf_url = url
    
    # 从 Arxiv ID 提取年份（如 2312.xxxxx -> 2023）
    year_match = re.search(r'(\d{4})\.\d{4,5}', url)
    if year_match:
        year_prefix = year_match.group(1)[:2]
        year = f"20{year_prefix}"
    else:
        year = "2025"  # 默认年份
    
    return pdf_url, year


def parse_url(url: str) -> Tuple[str, str]:
    """
    通用URL解析入口（可扩展其他学术平台）
    
    Returns:
        (download_url, year)
    """
    if "arxiv.org" in url:
        return parse_arxiv_url(url)
    else:
        # 其他平台保持原样
        return url, "2025"
