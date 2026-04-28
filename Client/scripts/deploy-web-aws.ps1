param(
    [string]$BucketName = $env:AWS_WEB_BUCKET,
    [string]$DistributionId = $env:AWS_CLOUDFRONT_DISTRIBUTION_ID,
    [string]$BuildDirectory = "dist",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

if (-not $BucketName) {
    throw "Set AWS_WEB_BUCKET or pass -BucketName before deploying the web build."
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw "AWS CLI is not installed or not available in PATH."
}

$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        Write-Host "Building Expo web bundle..."
        npm run web:build
        if ($LASTEXITCODE -ne 0) {
            throw "Expo web build failed."
        }
    }

    $resolvedBuildDirectory = Join-Path $projectRoot $BuildDirectory
    if (-not (Test-Path $resolvedBuildDirectory)) {
        throw "Build directory '$resolvedBuildDirectory' does not exist."
    }

    Write-Host "Uploading static assets to s3://$BucketName ..."
    aws s3 sync $resolvedBuildDirectory "s3://$BucketName" --delete --exclude "*.html" --exclude "*.json" --cache-control "public,max-age=31536000,immutable"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload static assets to S3."
    }

    Write-Host "Uploading HTML and JSON with no-cache headers..."
    aws s3 sync $resolvedBuildDirectory "s3://$BucketName" --delete --exclude "*" --include "*.html" --include "*.json" --cache-control "public,max-age=0,must-revalidate"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload HTML/JSON files to S3."
    }

    if ($DistributionId) {
        Write-Host "Creating CloudFront invalidation for $DistributionId ..."
        aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create the CloudFront invalidation."
        }
    }
    else {
        Write-Host "Skipping CloudFront invalidation because AWS_CLOUDFRONT_DISTRIBUTION_ID was not provided."
    }

    Write-Host "Web deployment completed successfully."
}
finally {
    Pop-Location
}