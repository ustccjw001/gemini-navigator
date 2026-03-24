# Gemini Chat Navigator

A Chrome extension for Google Gemini (gemini.google.com) that adds a minimal, right-side anchor navigation bar to help you quickly jump to your questions in the chat history.

## Features

- **Auto-Extraction**: Automatically identifies and extracts user questions from the chat interface.
- **Quick Jump**: Click any navigation item to smoothly scroll to the corresponding question with a brief highlight effect.
- **Minimalist Design**: Collapsed by default to save screen space; expands on hover or click.
- **Real-time Updates**: Uses `MutationObserver` to monitor chat changes and automatically update the navigation list.
- **Auto-Collapse**: Automatically collapses when the mouse leaves the navigator to keep the interface clean.

## Installation

Since it is not yet published on the Chrome Web Store, you can install it manually:

1. Download or clone this repository to your local machine.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the project folder.

## Usage

1. Visit [gemini.google.com](https://gemini.google.com/app).
2. You will see a minimal toggle button on the right side of the page.
3. Click or hover to expand the list of all questions in the current conversation.
4. Click any item in the list to jump to that question.

## Project Structure

- `manifest.json`: Extension configuration (Manifest V3).
- `content.js`: Core logic for extracting questions, creating the UI, and handling scroll jumps.
- `styles.css`: Styling for the navigation bar, including animations and layout.
- `icons/`: Icon assets for the extension.

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS3 (Flexbox, Transitions)
- Chrome Extension API (Manifest V3)

## License

[MIT License](LICENSE)
