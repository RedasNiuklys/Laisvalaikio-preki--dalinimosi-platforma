# Count all files in specific directories
cloc Client/src Server/src

# Exclude node_modules and other common directories
cloc . --exclude-dir=node_modules,dist,build

# Generate output in specific format (XML, JSON, CSV)
cloc . --json --out=cloc-report.json

# Count only specific file types
cloc . --include-ext=ts,tsx,js,jsx