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
- **Firebase Auth & Firestore** pro volitelnou online synchronizaci uživatelských profilů a Sousedskou výpůjčku

---

## 🔑 Jak nastavit Firebase (Sousedská výpůjčka a přihlašování)

Pokud se vám při registracích zobrazí chyba neplatného API klíče (`auth/api-key-not-valid`), aplikace ještě nemá nastaveny údaje z vaší Firebase Konzole.

Pro zprovoznění online přihlašování a sdílení knih mezi sousedy postupujte takto:

1. Navštivte [Firebase Console](https://console.firebase.google.com/) a přihlaste se pomocí svého Google účtu.
2. Klikněte na **Add project** (Přidat projekt) a vytvořte nový projekt (např. *Knihovnicka*).
3. V nastavení projektu (**Project Settings**) přidejte webovou aplikaci (**Web App** `</>`).
4. Zkopírujte konfiguraci Firebase (`firebaseConfig`), která obsahuje `apiKey`, `authDomain`, `projectId` atd.
5. V sekci **Build -> Authentication** zapněte metodu přihlášení **Email/Password** (E-mail a heslo).
6. V sekci **Build -> Firestore Database** vytvořte databázi.
7. Zkopírujte soubor `.env.example` do nového souboru `.env.local` ve vašem projektu a vyplňte získané hodnoty:
   ```env
   VITE_FIREBASE_API_KEY=vaše_skutečné_api_key
   VITE_FIREBASE_AUTH_DOMAIN=vaše_app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=vaše_project_id
   VITE_FIREBASE_STORAGE_BUCKET=vaše_app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=vaše_messaging_sender_id
   VITE_FIREBASE_APP_ID=vaše_app_id
   ```
8. Při nasazení na GitHub Pages vložte tyto proměnné do nastavení repozitáře (**Settings -> Secrets and variables -> Actions -> Secrets**).

> **Poznámka:** Pokud Firebase nakonfigurován není, aplikace automaticky funguje v lokálním/demo režimu pro vyzkoušení.
