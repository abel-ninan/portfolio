# Abel Ninan's Windows 95 Portfolio

My portfolio, built as a working Windows 95 desktop in the browser. Open My Projects, the Resume, the Bio or Contact Me straight from the desktop. Every icon opens with a single click or tap, and every window fits on a phone screen.

**Live site:** [abelninan.com](https://abelninan.com/)

---

## What's on the desktop

- **My Projects**: one window per project, with metrics, how it works, the tech stack, diagrams and links. The projects are HairMaxxx, AI Lead Generation Workflow, @historyslides, Lecture & Meeting AI, MarketPulse, Creator Analytics Pipeline and QueryPilot.
- **Resume**: a WordPad window with my experience, education, skills and certifications. It has a **Download PDF** button and a **Print** button that prints only the resume.
- **Abel Ninan Bio**: a Notepad window.
- **Contact Me**: an Outlook Express "New Message" window. **Send** opens your own email app, and there are LinkedIn, GitHub and Copy email buttons.
- **My Files**:
  - Documents: the resume PDF, Resume.doc and Certifications.txt.
  - Photos.
  - My Projects.
- **Win95 extras**: Internet Explorer, Paint, Notepad, MS-DOS Prompt, Minesweeper, Disk Defragmenter, Winamp, the Run dialog (try `resume`, `projects` or `github`), Shut Down and the Recycle Bin. You can drag desktop icons into the Recycle Bin.

## Run it locally

It is plain HTML, CSS and JavaScript. There is no build step and nothing to install.

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Check it

`tests/check_site.py` opens the site in Chromium and WebKit (Python Playwright) at phone, tablet and desktop sizes. It taps every icon and opens every window, and it fails if anything is off screen, cut off on the right, too small to tap, or throws an error.

```sh
pip install playwright && python3 -m playwright install chromium webkit
python3 -I tests/check_site.py http://localhost:8000/ --browser both
```

Options: `--browser chromium|webkit|both`, `--only 390x844,1440x900` to test some sizes, `--jobs N` for how many browsers run at once (default 2), and `--shots DIR` to save screenshots. It prints one row per browser and size, then every problem, and exits non-zero if anything failed.

## Project structure

```
index.html            desktop, taskbar, Start menu and the <script> load order
css/                  variables (colors, bevels), base, desktop, taskbar,
                      window, widgets, winamp, mobile (phone overrides, loaded last)
css/apps/             one stylesheet per app; portfolio.css styles the
                      portfolio windows
js/state.js           shared state, phone detection, escapeHTML, icon paths
js/content.js         all portfolio text and data (PORTFOLIO)
js/windows.js         open / close / maximize, and keeping windows on screen
js/desktop.js         Start menu, single-click opening (data-open / data-href /
                      data-action), Recycle Bin drag and drop
js/apps/              one file per app; registry.js lists every window type
img/, fonts/, audio/, videos/, docs/   assets
```

To edit the text, change `js/content.js`. Every window reads its copy from there.

## Credits

- **[React95](https://github.com/react95-io/React95)**: the border system, color palette and resize handle follow React95's original theme.
- **[95CSS](https://github.com/yoshimannaert/95CSS)**: a reference for the scrollbar styling and dialog layouts.
- **[w95fa font](https://fontsarena.com/w95fa-by-alina-sava/)** by Alina Sava: the Windows 95 interface font.
- **[Fixedsys Excelsior](https://web.archive.org/web/20190207073141/http://www.fixedsysexcelsior.com/)** by Darien Valentine: the monospace font in Notepad and MS-DOS.
- **Win95/WinXP icons pack**: the shutdown and system tray icons.
- **[Windows 95 app icons by Wallpapers Clan](https://wallpapers-clan.com)**: retro app icons, including the LinkedIn icon.
- **[Windows 95 Design System (Figma)](https://www.figma.com/community/file/1214528480728795592)** and **[Windows 95 UI Kit (Figma)](https://www.figma.com/community/file/1254078490904184073)**: references for the title bars, buttons, controls and icons.

Windows 95, Internet Explorer, WordPad, Outlook Express and the other product names are trademarks of their owners. This site is a fan tribute and is not affiliated with them.
