"""
手动下载 Embedding 模型到本地缓存
使用国内镜像加速下载
"""
import os
from sentence_transformers import SentenceTransformer

# 使用镜像加速
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

print("开始下载模型（使用国内镜像）...")
print("这可能需要几分钟，请耐心等待...")

try:
    # 下载并缓存多语言模型
    model = SentenceTransformer(
        'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        device='cpu'
    )
    print("✅ 模型下载成功！已保存到本地缓存。")
    print("下次启动将直接使用本地模型，不会再有超时警告。")
    
    # 测试模型
    test_embedding = model.encode(["测试文本"])
    print(f"✅ 模型测试通过！向量维度: {len(test_embedding[0])}")
    
except Exception as e:
    print(f"❌ 下载失败: {e}")
    print("建议：继续使用当前的回退模型，功能完全正常。")
