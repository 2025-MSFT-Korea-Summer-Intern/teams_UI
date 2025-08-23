# 테스트용 더미 데이터 - 실제에서는 필요 x
import time, uuid
from datetime import datetime
from ws_producer import emit

def now_iso():
    return datetime.utcnow().isoformat() + "Z"

SAMPLE = [
    {
        "id": str(uuid.uuid4()),
        "term": "Latency",
        "category": "Metric",
        "confidence": 0.96,
        "timestamp": now_iso(),
        "source_text": "네트워크 지연이 커지면 사용자 경험이 나빠집니다.",
        "explanation": "요청과 응답 사이에 발생하는 지연 시간.",
        "lang": "ko",
    },
    {
        "id": str(uuid.uuid4()),
        "term": "Jitter",
        "category": "Metric",
        "confidence": 0.92,
        "timestamp": now_iso(),
        "source_text": "지터가 높으면 스트리밍 품질이 저하됩니다.",
        "explanation": "패킷 지연 시간이 들쭉날쭉하게 변하는 정도.",
        "lang": "ko",
    },
    {
        "id": str(uuid.uuid4()),
        "term": "Throughput",
        "category": "Metric",
        "confidence": 0.94,
        "timestamp": now_iso(),
        "source_text": "초당 전송 가능한 데이터 양을 처리량이라고 합니다.",
        "explanation": "단위 시간당 처리 가능한 데이터의 양.",
        "lang": "ko",
    },
]

if __name__ == "__main__":
    i = 0
    print("Dummy feed start. Sending one doc every 2s...")
    while True:
        doc = dict(SAMPLE[i % len(SAMPLE)])
        doc["timestamp"] = now_iso()  # 매번 갱신 느낌
        emit(doc)
        i += 1
        time.sleep(2)
