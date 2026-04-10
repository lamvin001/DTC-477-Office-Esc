# DTC-477-Game
Project 5: Collaborative HTML5 Canvas Game


Project Overview (what the game is, concept, goals)
A click-to-play escape room game set inside an eerie, abandoned office space. The player is searching for their kidnapped brother after receiving a mysterious message containing an address.
The game follows a mostly linear progression, but players may need to backtrack to previous rooms to use clues or items they discovered later.

Team & Roles (who is responsible for what)
Nakai Daniel: Writer
Sonia: Illustrations 
Vincent: Main coder


Game Structure (levels, stages, and overall flow of the game)
Go through 5-6 rooms
Solve puzzles to unlock doors and containers
Collect keycards from main rooms
Complete puzzles from side rooms to go back to main rooms
Use keycards to unlock the final room
Complete the final quiz/interrogation to open the door that has your brother 




Core Systems (shared logic and architecture used by all levels)
Clicking objects triggers:
 	- pop-up messages (on phone)
    - item pickup
Tracks items like:
-  Phone
- Keycards
- Codes

Tracks which puzzles are solved
Unlocks new areas/items once conditions are met
Phone delivers story and hints
Dialogue triggers when entering rooms or interacting with key objects

Folder Structure (how files and assets are organized)
OfficeEsc/
|-- index.html
|
|-- css/
| |-- style.css
|
|-- js/
| |-- main.js
|
|-- images/
    |-- rooms/
    |-- items/

Setup Instructions (how to run and test the project)
Open officeesc/index.html into your browser (or use Live Server) then click to play

Git Workflow (how the team collaborates using branches and pull requests)
Pull Requests will have summary of changes what was added/updated

Naming Conventions (rules for naming variables, files, and functions)
Names should be clear and simple. Names should tell users exactly what it is without creating confusion. 

Style Guide (visual design rules: color, UI, sprites, typography)
Minimalist, dark colors, use of empty space to convey eeriness. Liminal style.
