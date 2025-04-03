#!/bin/bash

# Directory containing MDX files
MDX_DIR="/home/lucas/iwill/cloudflare-docs/src/content/docs/workers/examples"

# Base directory for worker projects
TARGET_DIR="/home/lucas/iwill/test-bash-worker"

# Function to extract TypeScript code - improved to grab only relevant blocks
extract_typescript_code() {
  local mdx_file="$1"
  
  # Look specifically for TypeScript code blocks
  local typescript_code=""
  local capture=false
  local in_typescript_tab=false
  
  while IFS= read -r line; do
    # Detect TypeScript tab section
    if [[ "$line" == *"TabItem label=\"TypeScript\""* ]]; then
      in_typescript_tab=true
      continue
    fi
    
    # Detect end of TypeScript tab section (when we hit the next tab item)
    if [[ "$in_typescript_tab" == true && "$line" == *"</TabItem>"* ]]; then
      in_typescript_tab=false
      break  # Stop after finding the first TypeScript section
    fi
    
    # If we're in TypeScript tab section and find a code block
    if [[ "$in_typescript_tab" == true && ("$line" == '```js' || "$line" == '```ts' || "$line" == '```typescript') ]]; then
      capture=true
      continue
    fi
    
    # If we're capturing code and encounter the end marker
    if [[ "$capture" == true && "$line" == '```' ]]; then
      capture=false
      continue
    fi
    
    # If we're capturing, add the line to our code content
    if [[ "$capture" == true ]]; then
      typescript_code+="$line"$'\n'
    fi
  done < "$mdx_file"
  
  # Return the extracted code
  echo "$typescript_code"
}

# Process each MDX file
for mdx_file in "$MDX_DIR"/*.mdx; do
  # Get the base name without extension
  base_name=$(basename "$mdx_file" .mdx)
  
  # Target directory for this worker
  worker_dir="$TARGET_DIR/$base_name"
  
  # Target file
  target_file="$worker_dir/src/index.ts"
  
  # Check if worker directory exists
  if [[ -d "$worker_dir" ]]; then
    echo "Processing $base_name..."
    
    # Extract TypeScript code
    typescript_code=$(extract_typescript_code "$mdx_file")
    
    # Write code to target file if we found content
    if [[ -n "$typescript_code" ]]; then
      # First truncate the file to ensure it's empty
      truncate -s 0 "$target_file"
      # Then write the extracted code
      echo "$typescript_code" > "$target_file"
      echo "  Wrote code to $target_file"
    else
      echo "  No TypeScript code found in $mdx_file"
    fi
  else
    echo "Warning: Worker directory for $base_name not found at $worker_dir"
  fi
done

echo "Done!"