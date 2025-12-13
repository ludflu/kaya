# Kaya Brand Guide

## Logo

### Concept

The Kaya logo represents a bamboo plant (🎋), which is the literal meaning of "Kaya" in Japanese. The design combines:

- **Three bamboo stalks** - Representing growth, strength, and flexibility
- **Bamboo nodes** - Natural segments showing progression
- **Leaves** - Organic elements adding life and movement
- **Subtle circle** - A faint reference to a Go stone, connecting to the game

### Design Philosophy

**Bold & Visible** - Thick strokes and filled shapes for excellent visibility  
**Elegant** - Balanced composition with natural curves  
**Meaningful** - Each element has purpose (bamboo = name, circle = Go)  
**Scalable** - Works at any size from 16px favicon to large displays

### Files

```
public/
├── logo.svg          # Main logo (light theme, 120×120)
├── logo-dark.svg     # Dark theme variant
├── favicon.svg       # 32×32 favicon
└── icon-512.svg      # High-res app icon (512×512)
```

### Usage Guidelines

**Logo Display**:

- Minimum size: 64×64 pixels
- Clear space: 20% of logo width on all sides
- Background: White or light colors for `logo.svg`, dark for `logo-dark.svg`

**Favicon**:

- Use `favicon.svg` for web (scalable vector)
- Generate PNG versions if needed for compatibility

**App Icon**:

- Use `icon-512.svg` as source for platform-specific icons
- Generate required sizes for each platform (macOS, Windows, Linux)

## Color Palette

### Primary Colors

| Color            | Hex       | Usage                            |
| ---------------- | --------- | -------------------------------- |
| **Bamboo Green** | `#2d5016` | Primary brand color, logo stalks |
| **Leaf Green**   | `#4a7c2c` | Secondary color, logo leaves     |
| **Light Bamboo** | `#7fb069` | Dark theme variant               |
| **Soft Leaf**    | `#9ccc88` | Dark theme leaves                |

### UI Colors

| Color                | Hex       | Usage                   |
| -------------------- | --------- | ----------------------- |
| **Background Light** | `#f5f5f0` | Light theme background  |
| **Background Dark**  | `#1e1e1e` | Dark theme background   |
| **Text Primary**     | `#2d2d2d` | Main text (light theme) |
| **Text Secondary**   | `#666666` | Secondary text          |

### Board Colors

| Color           | Hex       | Usage                   |
| --------------- | --------- | ----------------------- |
| **Board Wood**  | `#deb887` | Traditional goban color |
| **Grid Lines**  | `#000000` | Board grid              |
| **Black Stone** | `#1a1a1a` | Black stones            |
| **White Stone** | `#f5f5f5` | White stones            |

## Typography

### Primary Font Stack

```css
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
  'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Philosophy**: Use system fonts for best performance and native feel.

### Font Weights

- **Regular (400)**: Body text, UI labels
- **Medium (500)**: Buttons, emphasis
- **Bold (700)**: Headings, strong emphasis

### Font Sizes

| Element   | Size | Usage              |
| --------- | ---- | ------------------ |
| Heading 1 | 32px | Page titles        |
| Heading 2 | 24px | Section headers    |
| Heading 3 | 18px | Subsections        |
| Body      | 14px | Main text          |
| Small     | 12px | Captions, metadata |

## Voice & Tone

### Brand Personality

- **Elegant** - Refined and sophisticated
- **Calm** - Peaceful like the game of Go
- **Approachable** - Friendly and welcoming to beginners
- **Modern** - Contemporary tech without being flashy

### Writing Style

**✅ DO**:

- Use clear, simple language
- Be concise and direct
- Focus on user benefits
- Use active voice
- Include helpful examples

**❌ DON'T**:

- Use jargon or technical terms without explanation
- Write long, complex sentences
- Assume knowledge of Go terminology
- Use passive constructions
- Over-explain simple concepts

### Example Phrases

| Situation     | Good                                                 | Bad                                            |
| ------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Welcome       | "Welcome to Kaya!"                                   | "Initializing application..."                  |
| Save success  | "Game saved ✓"                                       | "File write operation completed successfully"  |
| Error         | "Could not open file. Please check the file format." | "ERROR: SGF parse exception thrown at line 42" |
| Feature intro | "Click a stone to explore variations"                | "The game tree supports branching navigation"  |

## UI Guidelines

### Spacing

Use multiples of 8px for consistent spacing:

- **Tight**: 8px (buttons, small gaps)
- **Normal**: 16px (between sections)
- **Loose**: 24px (major sections)
- **Extra loose**: 32px (page margins)

### Border Radius

- **Small**: 4px (buttons, inputs)
- **Medium**: 8px (cards, panels)
- **Large**: 12px (modals, containers)
- **Round**: 50% (circular elements like stones)

### Shadows

```css
/* Subtle elevation */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Medium elevation */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* High elevation */
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
```

### Animations

**Duration**:

- **Quick**: 150ms (hover states, toggles)
- **Normal**: 250ms (transitions, reveals)
- **Slow**: 400ms (complex animations)

**Easing**:

- **Default**: `ease-in-out`
- **Enter**: `ease-out` (elements appearing)
- **Exit**: `ease-in` (elements disappearing)

## Icons

### Style

- **Outline style** preferred over filled
- **2px stroke weight** for consistency
- **Rounded corners** (stroke-linecap: round)
- **24×24px base size** (scale proportionally)

### Common Icons

Use Unicode emoji when appropriate for friendliness:

- 📄 New game
- 📂 Open file
- 💾 Save game
- ⚙️ Settings
- 🌙 Dark mode
- ☀️ Light mode
- Ⓢ Score estimation

## Examples

### Good Logo Usage

```html
<!-- Centered header -->
<header style="text-align: center; padding: 40px;">
  <img src="logo.svg" alt="Kaya" width="120" height="120" />
  <h1>Kaya</h1>
</header>

<!-- Dark theme -->
<div style="background: #1e1e1e;">
  <img src="logo-dark.svg" alt="Kaya" width="80" height="80" />
</div>
```

### Bad Logo Usage

❌ Stretching the logo (distortion)  
❌ Changing colors arbitrarily  
❌ Adding effects (drop shadow, glow, etc.)  
❌ Placing on busy backgrounds  
❌ Using at very small sizes (<32px) for the main logo
