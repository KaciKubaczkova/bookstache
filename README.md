# Knihovnička - Skenování & Správa Knih

Webová aplikace pro školní a malé knihovníky pro snadnou správu knih, skenování ISBN čárových kódů pomocí fotoaparátu a prohlížení katalogu pro čtenáře.

Aplikace je navržena pro statické nasazení na **GitHub Pages** a funguje zcela v prohlížeči bez nutnosti vlastního databázového serveru.

---

## 🚀 Návod na nasazení na GitHub Pages (krok za krokem)

Pro správné zobrazení a nasazení webové stránky postupujte podle následujících 4 jednoduchých kroků:

### 1. Uložte a pushněte kód do GitHub repozitáře
Ujistěte se, že všechny změny z tohoto repozitáře jsou nahrány (pushed) v hlavní větvi (`main` nebo `master`).

### 2. Otevřete Nastavení repozitáře na GitHubu
1. Jděte na webu GitHub.com do vašeho repozitáře.
2. V horním menu klikněte na **Settings** (Ozubené kolečko / Nastavení).

### 3. Zapněte GitHub Pages z GitHub Actions
1. V levém postranním menu vyberte položku **Pages** (v sekci *Code and automation*).
2. Pod nadpisem **Build and deployment**:
   - U položky **Source** přepněte z *"Deploy from a branch"* na **"GitHub Actions"**.

### 4. Sledujte nasazení v záložce Actions
1. Po změně zdroje na GitHub Actions se v záložce **Actions** automaticky spustí akce **Deploy to GitHub Pages**.
2. Jakmile proběhne zelené zatržítko, v sekci **Settings -> Pages** uvidíte veřejný odkaz na vaši aplikaci (např. `https://vase-jmeno.github.io/nazev-repozitare/`).

---

## 🛠️ Použité technologie & Kompatibilita
Všechny použité technologie jsou plně podporované pro bezplatný provoz na GitHub Pages:
- **React 19** & **Vite 6** (Single Page Application)
- **Tailwind CSS v4** (Moderní stylizace)
- **HTML5 QR/Barcode Scanner** (`html5-qrcode` & `@zxing/library`) pro skenování čárových kódů fotoaparátem
- **Google Books API & Open Library API** pro automatické načítání údajů o knihách podle ISBN
- **LocalStorage** pro ukládání dat přímo v prohlížeči
