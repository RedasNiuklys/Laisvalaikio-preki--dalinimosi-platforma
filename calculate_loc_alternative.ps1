# Calculate Lines of Code for Client, Server, and Server.Tests directories

Write-Host "`n=== Analyzing Client Directory (Overall) ===`n" -ForegroundColor Green
cloc ./Client `
    --exclude-dir=node_modules, .expo `
    --not-match-f="package-lock\\.json$" `
    --not-match-d="node_modules|\\.expo" `
    --quiet `
    --hide-rate

# Define subdirectories within Client to analyze individually
$clientSubdirectories = @("app", "src")

foreach ($subdir in $clientSubdirectories) {
    $path = Join-Path "./Client" $subdir
    if (Test-Path $path -PathType Container) {
        Write-Host "`n--- Analyzing Client/$subdir Directory ---`n" -ForegroundColor Cyan
        cloc $path `
            --exclude-dir=node_modules, .expo `
            --not-match-f="package-lock\\.json$" `
            --not-match-d="node_modules|\\.expo" `
            --quiet `
            --hide-rate
    }
    else {
        Write-Host "`n--- Directory Client/$subdir not found. Skipping. ---`n" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Analyzing Server Directory ===`n" -ForegroundColor Green
cloc ./Server `
    --exclude-dir=bin, obj, Migrations `
    --not-match-d="bin|obj|Migrations" `
    --quiet `
    --hide-rate

Write-Host "`n=== Analyzing Server.Tests Directory ===`n" -ForegroundColor Green
cloc ./Server.Tests `
    --exclude-dir=bin, obj `
    --not-match-d="bin|obj" `
    --quiet `
    --hide-rate

Write-Host "`nAnalysis Complete!`n" -ForegroundColor Green 