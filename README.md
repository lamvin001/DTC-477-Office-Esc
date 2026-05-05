# DTC-477-Game  
Project 5: Collaborative HTML5 Canvas Game

---

## Project Overview
A click-to-play escape room game set inside an eerie, abandoned office space. The player is searching for their kidnapped brother after receiving a mysterious message containing an address.

The game follows a mostly linear progression, but players may need to backtrack to previous rooms to use clues or items they discovered later.

---

## Team & Roles
- **Nakai Daniel** — Writer and Sound Design  
- **Sonia** — Illustration and Coding  
- **Vincent** — Coding and Project Manager  

---

## Game Structure
- Progress through 5–6 rooms  
- Solve puzzles to progress  
- Collect keycards from rooms  
- Use all 3 keycards to unlock the final room  
- Complete the final quiz/interrogation to open the door holding your brother  

---

## Core Systems
- Clicking objects triggers:
  - Puzzle interactions  
  - Item pickup  
  - Movement between rooms  

- Tracks items like:
  - Phone  
  - Keycards  
  - Room status  

- Tracks which puzzles are solved  
- Unlocks new areas/items once conditions are met  
- Phone delivers story and hints when entering new rooms  
- Pop-ups trigger when completing rooms or collecting items  

---

## Folder Structure
OfficeEsc/
│-- index.html
│-- about.html
│-- style.css
│-- gamereq.script.js
│-- main.rooms.script.js
│-- side.rooms.scipt.js
│
│-- images/
│ │-- rooms.png
│ │-- items.png
│
│-- audio/
│ │-- click.mp3
│ │-- unlock.mp3

---

## Setup Instructions
Open `officeesc/index.html` in your browser (or use Live Server), then click to play.

---

## Git Workflow
- Pull Requests must include a summary of changes (what was added/updated).  
- All changes should be reviewed before merging into `main`.

---

## Naming Conventions
Names should be clear and simple. Each name should clearly describe its purpose without confusion.

---

## Style Guide
- Minimalist design  
- Dark color palette  
- Use of empty space to create an eerie atmosphere  
- Liminal aesthetic  

---

## Commit Guidelines
Commit messages should be concise and direct to reduce confusion.

---

## Game Design Rules
- All player input must be done through clicks  
- Puzzles should not be overly difficult  
- Phone text should guide players clearly  

---

## Code Structure Rules
- Player input handled through click events  
- Puzzles remain reasonably simple  
- Phone messages clearly guide gameplay progression  

---

## Communication Protocol
- In-class discussion for major decisions and issues  
- Use clear commit messages for updates  
- Regular Slack communication to keep everyone aligned  

---

## Testing Guidelines
- Test all features locally before sharing  
- Use branches for changes before merging into main  

---

## Integration Rules
- Code must be tested locally before pushing  
- Merge only after team agreement  
- Resolve all merge conflicts before final merge  

---

## Merge Conflict Strategy
- Identify where the conflict occurs  
- Evaluate the cause  
- Adjust code until functional and agreed upon  
- Save changes and notify team members  

---

## Assets Management
Asset names should be simple, clear, and descriptive to avoid confusion.

---

## AI Usage Policy
AI tools may be used to:
- Assist with coding  
- Improve understanding of code  
- Help with debugging and troubleshooting  

---

## Documentation Requirements
Students must clearly explain the game logic and how the system functions.

---

## Roadmap / Milestones
- **Week 1–2:** Brainstorming and concept development  
- **Week 3:** Working game demo  
- **Week 4:** Refinement and finalization  
- **Week 5:** In-class testing  
- **Week 6:** Final fixes and submission  

---

## Known Issues / Bugs
- Resizing the canvas shifts element positions on the page  

---

## License
The project is public on GitHub. All members share equal credit for the creation of the game.

---

## Credits
- All images used are stock images from Canva.
