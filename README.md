# DeepSeek Chat Exporter

A Chrome extension that allows you to export your DeepSeek chat conversations to JSON format.

## Features

- Automatically monitors and captures all messages in DeepSeek chat conversations
- Preserves the role (user/assistant) and content of each message
- Includes timestamps for each message
- Exports conversations to a well-structured JSON file
- Simple one-click export button

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension is now installed and will activate when you visit DeepSeek

## Usage

1. Visit any DeepSeek chat page
2. The extension will automatically monitor and capture all messages
3. Click the "Export Chat" button in the bottom-right corner to download the conversation as a JSON file

## JSON Format

The exported JSON file follows this structure:

```json
{
  "platform": "DeepSeek",
  "session": {
    "start_time": "ISO8601 timestamp",
    "page_url": "URL of the chat page"
  },
  "messages": [
    {
      "role": "user" or "assistant",
      "content": "Message content",
      "timestamp": 1234567890,
      "element_id": "Unique identifier for the message element"
    }
  ]
}
```

## Technical Details

- Built with Manifest V3 for Chrome extensions
- Uses MutationObserver to detect new messages
- Implements message deduplication to prevent duplicates
- Throttles storage operations for better performance
- Handles DOM structure changes gracefully

## License

MIT
