export function handleThemeChange(theme, setTheme) {
    if (theme === "dark") setTheme("dark");
    else if (theme === "contrast") setTheme("contrast");
    else setTheme("light");
}