# Calculate Lines of Code for Client, Server, and Server.Tests directories

Write-Host "`n=== Analyzing Client Directory ===`n" -ForegroundColor Green
cloc ./Client `
    --exclude-dir=node_modules, .expo `
    --exclude-list-file=package-lock.json `
    --md `
    --quiet `
    --hide-rate

Write-Host "`n=== Analyzing Server Directory ===`n" -ForegroundColor Green
cloc ./Server `
    --exclude-dir=bin, obj, Migrations `
    --md `
    --quiet `
    --hide-rate

Write-Host "`n=== Analyzing Server.Tests Directory ===`n" -ForegroundColor Green
cloc ./Server.Tests `
    --exclude-dir=bin, obj `
    --md `
    --quiet `
    --hide-rate

Write-Host "`nAnalysis Complete!`n" -ForegroundColor Green 