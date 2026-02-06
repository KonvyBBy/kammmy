# New Features Added

## 1. Review System (`/review`)

### Description
Users can now submit reviews with star ratings (1-5 stars) for the service.

### Usage
```
/review rating:<1-5 stars> review:<your review text>
```

### Features
- Star rating selection (1-5 stars)
- Custom review text
- Beautiful embed with user avatar and rating display
- Automatically posts to vouches channel (ID: 1462381972474167491)
- Logs all reviews to webhook

### Example
```
/review rating:⭐⭐⭐⭐⭐ 5 Stars review:Great service! Fast delivery and excellent support!
```

---

## 2. Support Ticket System

### Commands

#### `/ticketpanel` (Admin Only)
Creates a ticket panel with a button for users to open support tickets.

### Features
- **Persistent Ticket Panel**: Creates an embed with a "Open Ticket" button
- **Automatic Ticket Creation**: Creates private ticket channels when users click the button
- **Category Organization**: All tickets are organized under "Support Tickets" category
- **Private Channels**: Only the user who opened the ticket and staff can see it
- **One Ticket Per User**: Users can only have one open ticket at a time
- **Close Ticket Button**: Each ticket has a close button
- **Auto-Delete**: Tickets are deleted 5 seconds after closing
- **Ticket Tracking**: All tickets are tracked in the database

### Ticket Channel Features
- Unique naming: `ticket-{number}-{username}`
- Welcome embed with ticket number
- Close button for staff and ticket creator
- Logged to webhook (open and close events)

---

## 3. Comprehensive Webhook Logging

All bot actions are now logged to a webhook for monitoring and auditing purposes.

### Webhook URL
```
https://discord.com/api/webhooks/1469144387286994985/Ahnt6H00KMwkIa9cIrdGmALtm8gCt3NgIHE0i7VQ1fPY8-ioItSV7tfxLnVUh6PDn_6Y
```

### Logged Events

#### Stock Operations
- ✅ **Keys Stocked**: Product, duration, keys added, duplicates, added by
- ❌ **Stock Cleared**: Product, duration, keys cleared, cleared by
- 📊 **Inventory Checked**: Who accessed inventory

#### Key Operations
- 🔑 **Key Sent**: Product, duration, recipient, sent by, DM status, remaining stock
- 📋 **Logs Accessed**: Who viewed delivery logs
- 👤 **User History Checked**: Target user, total keys, accessed by

#### Support System
- 🎫 **Ticket Opened**: User, channel, ticket number
- 🔒 **Ticket Closed**: Closed by, original user, ticket number

#### Reviews
- ⭐ **Review Submitted**: User, rating, review preview

### Log Format
All webhook logs include:
- Colored embeds (green for positive actions, red for negative, blue for info)
- Timestamp
- Relevant user mentions and IDs
- Action-specific details in fields
- "Bot Logging System" footer

---

## Technical Changes

### Dependencies Added
- `aiohttp>=3.9.0` - For webhook HTTP requests

### Database Schema Updates
Added `tickets` field to store:
- Ticket number
- User ID
- Channel ID
- Status (open/closed)
- Creation timestamp
- Closure timestamp and user (when closed)

### New Classes
1. `TicketButton(discord.ui.View)` - Persistent view for ticket panel
2. `CloseTicketButton(discord.ui.View)` - Persistent view for closing tickets

### New Functions
- `log_to_webhook(title, description, color, fields)` - Async function for webhook logging

### Configuration Updates
- `WEBHOOK_URL` - Webhook URL for logging
- `TICKET_CATEGORY_NAME` - Category name for ticket channels

---

## Usage Instructions

### For Admins

1. **Create Ticket Panel**:
   ```
   /ticketpanel
   ```
   This creates a panel in the current channel where users can open tickets.

2. **All existing commands now log to webhook**:
   - `/stock` - Logs keys added
   - `/send` - Logs keys sent with recipient info
   - `/clearstock` - Logs stock clearing
   - `/inventory` - Logs who checked inventory
   - `/logs` - Logs who accessed logs
   - `/userhistory` - Logs user history checks

### For Users

1. **Submit a Review**:
   ```
   /review
   ```
   Select rating and write your review. It will be posted to the vouches channel.

2. **Open a Support Ticket**:
   - Click the "Open Ticket" button on the ticket panel
   - A private channel will be created for you
   - Describe your issue
   - Staff will help you
   - Click "Close Ticket" when done

---

## Security Features

- All webhook logging is done asynchronously to not block bot operations
- Failed webhook sends are caught and logged to console
- Ticket permissions ensure only relevant users can see ticket channels
- Duplicate ticket prevention (one open ticket per user)
- Authorization checks maintained on all admin commands

