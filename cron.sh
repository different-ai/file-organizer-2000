#!/bin/zsh


# To configure this script with crontab, use the command 'crontab -e' to open the crontab file.
# Then add a new line in the following format: '* * * * * /path/to/cron.sh /path/to/source /path/to/dest'
# This will run the script every minute. Adjust the cron schedule as needed.


# Define the source and destination directories
SOURCE_DIR="$1"
DESTINATION_DIR="$2"


# Temporary file to store the last processed file
LAST_PROCESSED_FILE="$HOME/.last_processed_file"

# Get the directory of the current script
SCRIPT_DIR=$(dirname $0)

# Log file
LOG_FILE="$SCRIPT_DIR/app.log"

# Check if the last processed file exists and read it
if [[ -f "$LAST_PROCESSED_FILE" ]]; then
    read -r last_file < "$LAST_PROCESSED_FILE"
else
    last_file=""
fi

# Find the newest file in the source directory
newest_file=$(find "$SOURCE_DIR" -type f -print0 | xargs -0 stat -f "%m %N" | sort -rn | head -1 | cut -f2- -d" ")
echo "$(date '+%Y-%m-%d %H:%M:%S') - Newest file: $newest_file" >> "$LOG_FILE"

# Check if the newest file is different from the last processed file
if [[ "$newest_file" != "$last_file" ]]; then
    # Move the newest file to the destination directory
    cp "$newest_file" "$DESTINATION_DIR"
    
    # Update the last processed file
    echo "$newest_file" > "$LAST_PROCESSED_FILE"
    
    # Log the moved file
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Moved file: $newest_file to $DESTINATION_DIR" >> "$LOG_FILE"
fi