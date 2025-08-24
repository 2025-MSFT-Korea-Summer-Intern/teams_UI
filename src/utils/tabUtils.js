import useTermCardStyles from "../styles/tab";

// 단어 카드 렌더링 컴포넌트
export function RenderTerm({ term, theme }) {
    const styles = useTermCardStyles(theme);
    return (
        <li style={{ listStyle: "none" }}>
            <div style={styles.card}>
                <span style={styles.term}>{term.term}</span>
                <span style={styles.category}>{term.category}</span>
                <span style={styles.explanation}>{term.explanation}</span>
            </div>
        </li>
    );
}