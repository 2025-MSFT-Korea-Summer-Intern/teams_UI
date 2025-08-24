// 테마별 스타일 반환 함수 (예시, 필요시 수정)
function useTermCardStyles(theme) {
    return {
        card: {
            background: theme === "dark" ? "#222" : "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
        },
        term: { fontWeight: "bold", fontSize: "1.1em" },
        category: { color: "#888", fontSize: "0.95em" },
        explanation: { marginTop: 2, fontSize: "0.98em" },
    };
}

export default useTermCardStyles;