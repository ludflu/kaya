# Kaya User Guide

## Getting Started

### Running the Application

**Desktop (macOS/Linux/Windows):**

Download from [GitHub Releases](https://github.com/kaya-go/kaya/releases) or build from source:

```bash
bun run dev
```

**Web (Browser):**

Visit [kaya-go.github.io/kaya](https://kaya-go.github.io/kaya) or run locally:

```bash
bun run dev:web
# Open http://localhost:3000
```

## Features

### 1. Playing a Game

**Starting a New Game:**

1. Click **📄 New** button in the toolbar
2. Confirm the dialog (unsaved changes will be lost)
3. An empty 19×19 board appears

**Playing Moves:**

- Click any intersection on the board to place a stone
- Stones automatically alternate: Black (first), White, Black...
- Invalid moves (ko, suicide) are silently ignored
- Captures trigger a sound effect

### 2. Working with SGF Files

#### Opening Files

**Drag & Drop** (Recommended):

- Drag any `.sgf` file and drop it in the Kaya window

**File Picker**:

1. Click **📂 Open** button
2. Select an `.sgf` file

**Paste OGS URL**:

1. Copy an Online-Go.com game URL (e.g., `https://online-go.com/game/81344851`)
2. Paste it anywhere in the Kaya window (Ctrl+V / Cmd+V)
3. The SGF is automatically downloaded and loaded

#### Saving Files

1. Click **💾 Save** button
2. File downloads with the current filename or `game.sgf`

### 3. Library Panel

The Library Panel organizes your game files:

**Adding Files:**

- Drag & drop SGF files into the Library panel
- Files are stored in your browser's local storage

**Organizing:**

- Create folders to organize games
- Drag files between folders
- Right-click for context menu: Rename, Duplicate, Delete

**Loading:**

- Click any file to load it
- The currently loaded file is highlighted

### 4. Navigation

#### Keyboard Shortcuts

| Key         | Action             |
| ----------- | ------------------ |
| `←`         | Previous move      |
| `→`         | Next move          |
| `Home`      | Go to start        |
| `End`       | Go to last move    |
| `↑`         | Previous variation |
| `↓`         | Next variation     |
| `Shift+←/→` | Jump 10 moves      |

#### Navigation Controls

Located at the bottom of the board:

- **⏮️** First move
- **◀️** Previous move
- **Move counter** Shows current position
- **▶️** Next move
- **⏭️** Last move

#### Next Move Preview

Toggle the **👁️** icon in the toolbar to show a ghost stone indicating the next move. Useful for reviewing games without spoilers.

### 5. Sidebar Panels

The left sidebar contains collapsible panels:

**Game Tree** - Visual tree navigation with variations

**Game Info** - Player names, komi, result, analyzed positions count

**Comment** - Shows SGF comments for the current position

**Analysis** - AI analysis graph showing win rate over the game

Click panel headers to expand/collapse.

### 6. Variations

**Creating Variations:**

1. Navigate to any position
2. Click a different intersection than the existing next move
3. A new variation is created

**Navigating Variations:**

- Use ↑/↓ arrow keys to switch between variations
- Click nodes in the Game Tree panel
- Variation buttons appear in the navigation bar when branches exist

### 7. AI Analysis

**Enabling Analysis:**

1. Click the **🧠** button in the toolbar
2. First time: The AI model downloads (~13MB)
3. Move suggestions appear on the board

**Live Analysis:**

- **Win Rate**: Probability of Black/White winning
- **Score Lead**: Estimated point advantage
- **Move Suggestions**: Colored circles showing best moves

**Move Color Guide:**

- 🟢 **Green**: Best move (≥ 70%)
- 🟦 **Blue**: Great move (60-70%)
- 🟩 **Light Green**: Good move (40-60%)
- 🟨 **Yellow**: Okay move (10-40%)
- 🟥 **Red**: Poor move (< 10%)

**Full Game Analysis:**

1. Click the **▶️ Run** button in the Analysis panel
2. Progress shows completed/total positions with ETA
3. Click **■ Stop** to abort
4. Results are saved and restored on page reload

**Ownership Heatmap:**

Toggle with the heatmap button to see territory control visualization.

**Analysis Graph:**

The Analysis panel shows a win rate graph across all analyzed positions. Click any point to navigate to that position.

### 8. Score Estimation

**Activating:**

1. Click the **Ⓢ** button in the toolbar
2. The panel switches to Score Estimation mode

**Marking Dead Stones:**

- Click stones to toggle dead/alive status
- Dead stones show an **×** overlay
- Score updates automatically

**Score Display:**

- Territory + Captures + Dead stones
- Komi included for White
- Winner and margin shown

### 9. Theme

Click the sun/moon icon in the header to toggle dark/light mode. Theme persists across sessions.

### 10. Gamepad Support

Connect a gamepad for controller navigation:

- **D-pad**: Navigate moves
- **A/B**: Place stone
- **Shoulders**: Switch variations
- **Triggers**: Jump to start/end

Supports standard gamepads and 8BitDo Lite 2.

## Keyboard Reference

### Navigation

| Key         | Action             |
| ----------- | ------------------ |
| `←`         | Previous move      |
| `→`         | Next move          |
| `↑`         | Previous variation |
| `↓`         | Next variation     |
| `Home`      | First move         |
| `End`       | Last move          |
| `Shift+←/→` | Jump 10 moves      |

### Actions

| Key | Action            |
| --- | ----------------- |
| `E` | Toggle edit mode  |
| `S` | Toggle score mode |
| `M` | Toggle sound      |
| `B` | Toggle sidebar    |
| `F` | Toggle fullscreen |

## Troubleshooting

### File won't open

- Verify the file has `.sgf` extension
- Check that it's valid SGF format
- Try opening in a text editor to verify syntax

### AI Analysis not working

- Ensure you have a stable internet connection (model download)
- Try WebGL backend if WebGPU fails
- Check browser console for errors

### Performance issues

- Large games (300+ moves) are optimized
- Close other browser tabs
- Try disabling AI analysis

---

**Enjoy playing Go with Kaya!** 🎋
