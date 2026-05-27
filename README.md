# Pejobrili - Visual Bookmarks PWA

Pejobrili is a lightweight, privacy-focused Progressive Web App (PWA) designed to visualize, manage, and clean up your browser bookmarks. It allows you to import HTML bookmark files (such as those exported via Google Takeout or standard browser backups), weed out dead or unwanted links, and export a freshly sanitized, universal HTML bookmark file.

Built entirely with standard web technologies and Tailwind CSS, it runs completely in the browser with zero server-side storage tracking your data.

## 🚀 Features

* **Dual Input Methods:**
  * **HTML File Import:** Instantly parses standard browser bookmark exports (Netscape format).
  * **Bulk Link Paste:** Paste raw text or multiple URLs copied from your active mobile tabs.
* **Smart UI Selector:** Smooth, native-feeling switch to toggle between input methods.
* **Visual Cards & Previews:** Automatically generates titles, descriptions, and cover image previews for your links using a lightweight asynchronous meta-scraper.
* **On-the-Fly Cleanup:** Delete individual bookmarks directly from your dashboard using responsive, touch-optimized red "✕" buttons.
* **One-Click Export:** Download your updated, curated bookmark list as a compliant `Netscape-Bookmark-file-1` HTML file, fully compatible with Chrome, Safari, Firefox, and Edge.
* **PWA Capable:** Fully installable on iOS and Android devices. It runs full-screen, hiding browser bars for a true native app experience.
* **Privacy First:** All bookmarks are managed locally via your device's `localStorage`. Your links never leave your phone.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, JavaScript (ES6+), Tailwind CSS (via CDN)
* **PWA Features:** Web App Manifest (`manifest.json`), Basic Service Worker (`sw.js`)
* **Deployment:** Optimized for Vercel Serverless Environments

---

## 📦 Project Structure

```text
├── api/
│   └── preview.js       # Serverless function fetching OpenGraph metadata
├── public/
│   ├── index.html       # Responsive Tailwind layout & UI skeleton
│   ├── app.js           # Core state management, DOM logic & Event Delegation
│   ├── sw.js            # Service Worker for PWA compliance
│   ├── manifest.json    # App branding, standalone settings & icons
│   └── icon.png         # 512x512 application icon
├── package.json         # Project configuration
└── README.md            # You are here!

⚙️ How to Install & Run Locally
1. Clone the repository:

git clone [https://github.com/YOUR_USERNAME/pejobrili.git](https://github.com/YOUR_USERNAME/pejobrili.git)
cd pejobrili

2. Install dependencies (if running with Vercel CLI locally):
npm install

3. Run the local development server:
vercel dev

Open http://localhost:3000 in your browser.

📱 How to Install on Smartphone
Deploy the project to production (e.g., via Vercel).

Open your unique deployment URL in your mobile browser.

On Android (Chrome): Tap the three vertical dots in the top-right corner and select "Install App" or "Add to Home screen".

On iOS (Safari): Tap the Share button (square with an up arrow) at the bottom and select "Add to Home Screen".

Launch Pejobrili right from your desktop in glorious full-screen mode.

📝 License
This project is open-source and available under the MIT License. Feel free to fork it, tweak it, and make it your own!




