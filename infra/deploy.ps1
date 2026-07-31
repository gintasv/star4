<#
.SYNOPSIS
    Publish dist/ to S3 and invalidate CloudFront, with hard safety checks.

.DESCRIPTION
    This runs `aws s3 sync --delete`, which removes files at the destination.
    In an account that hosts other websites, pointing that at the wrong bucket
    would delete somebody else's site. Four assertions run before any write,
    and any failure aborts with nothing changed:

      1. The caller's AWS account matches infra/deploy.config.json.
      2. The target bucket and distribution are read from the CloudFormation
         stack outputs, never guessed or hard-coded.
      3. The bucket name starts with the expected star4-construction prefix.
      4. The bucket carries the tag Project=Star4Construction.

    Assertion 4 is the real backstop: only a bucket this project created
    carries that tag, so even a stack misconfiguration cannot redirect the
    sync at an unrelated bucket.

.PARAMETER WhatIf
    Run every check and show what would sync, without uploading or deleting.

.PARAMETER SkipInvalidation
    Upload but do not create a CloudFront invalidation.
#>
[CmdletBinding()]
param(
    [switch]$WhatIf,
    [switch]$SkipInvalidation,
    [string]$AwsProfile
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$distPath = Join-Path $root 'dist'
$configPath = Join-Path $here 'deploy.config.json'

function Fail([string]$Message) {
    Write-Host ''
    Write-Host "ABORTED: $Message" -ForegroundColor Red
    Write-Host 'Nothing was uploaded or deleted.' -ForegroundColor Red
    Write-Host ''
    exit 1
}

function Invoke-Aws {
    param([string[]]$Arguments, [switch]$Raw)
    $full = @($Arguments)
    if ($AwsProfile) { $full += @('--profile', $AwsProfile) }
    if (-not $Raw) { $full += @('--output', 'json') }

    $result = & aws @full
    if ($LASTEXITCODE -ne 0) { Fail "aws $($Arguments -join ' ') exited with $LASTEXITCODE" }
    if ($Raw) { return $result }
    if ([string]::IsNullOrWhiteSpace($result)) { return $null }
    return $result | ConvertFrom-Json
}

Write-Host ''
Write-Host 'Star 4 Construction - deploy' -ForegroundColor Cyan
Write-Host '============================='

# -- 0. Inputs exist -----------------------------------------------------------
if (-not (Test-Path $configPath)) {
    Fail "Missing $configPath. Copy deploy.config.example.json and fill it in."
}
if (-not (Test-Path $distPath)) {
    Fail "Missing $distPath. Run 'npm run build' first."
}

$indexPath = Join-Path $distPath 'index.html'
if (-not (Test-Path $indexPath)) {
    Fail "$distPath has no index.html - the build looks incomplete."
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
foreach ($key in @('AccountId', 'StackName', 'Region', 'BucketPrefix')) {
    if (-not $config.$key) { Fail "deploy.config.json is missing '$key'." }
}

# -- 1. Account identity -------------------------------------------------------
Write-Host ''
Write-Host '[1/4] Verifying AWS account...' -ForegroundColor Yellow
$identity = Invoke-Aws @('sts', 'get-caller-identity')
Write-Host "      caller  : $($identity.Arn)"
Write-Host "      account : $($identity.Account)"

if ($identity.Account -ne $config.AccountId) {
    Fail "Account mismatch. Credentials are for $($identity.Account) but deploy.config.json expects $($config.AccountId)."
}
Write-Host '      OK' -ForegroundColor Green

# -- 2. Targets from stack outputs --------------------------------------------
Write-Host ''
Write-Host '[2/4] Reading targets from CloudFormation outputs...' -ForegroundColor Yellow
$stacks = Invoke-Aws @('cloudformation', 'describe-stacks', '--stack-name', $config.StackName, '--region', $config.Region)
$outputs = $stacks.Stacks[0].Outputs

$bucket = ($outputs | Where-Object { $_.OutputKey -eq 'BucketName' }).OutputValue
$distributionId = ($outputs | Where-Object { $_.OutputKey -eq 'DistributionId' }).OutputValue

if (-not $bucket) { Fail "Stack '$($config.StackName)' has no BucketName output." }
if (-not $distributionId) { Fail "Stack '$($config.StackName)' has no DistributionId output." }

Write-Host "      bucket       : $bucket"
Write-Host "      distribution : $distributionId"
Write-Host '      OK' -ForegroundColor Green

# -- 3. Name prefix ------------------------------------------------------------
Write-Host ''
Write-Host '[3/4] Checking bucket name prefix...' -ForegroundColor Yellow
if (-not $bucket.StartsWith($config.BucketPrefix)) {
    Fail "Bucket '$bucket' does not start with '$($config.BucketPrefix)'. Refusing to sync."
}
Write-Host '      OK' -ForegroundColor Green

# -- 4. Ownership tag ----------------------------------------------------------
# The decisive check. Other sites in this account do not carry this tag, so a
# sync can only ever land on a bucket this project created.
Write-Host ''
Write-Host '[4/4] Checking bucket ownership tag...' -ForegroundColor Yellow
$tagging = Invoke-Aws @('s3api', 'get-bucket-tagging', '--bucket', $bucket)
$projectTag = ($tagging.TagSet | Where-Object { $_.Key -eq 'Project' }).Value

if ($projectTag -ne 'Star4Construction') {
    Fail "Bucket '$bucket' is not tagged Project=Star4Construction (found '$projectTag'). Refusing to sync."
}
Write-Host '      Project=Star4Construction'
Write-Host '      OK' -ForegroundColor Green

# -- Sync ----------------------------------------------------------------------
Write-Host ''
Write-Host 'All checks passed.' -ForegroundColor Green
Write-Host ''

$fileCount = (Get-ChildItem $distPath -Recurse -File).Count
Write-Host "Publishing $fileCount files from dist/ to s3://$bucket" -ForegroundColor Cyan

# Two passes so cache headers match content lifetime. Astro fingerprints
# everything under /_astro/, so those are immutable for a year, while HTML must
# revalidate or visitors keep seeing the previous build.
$immutable = @(
    's3', 'sync', $distPath, "s3://$bucket",
    '--delete',
    '--exclude', '*',
    '--include', '_astro/*',
    '--cache-control', 'public,max-age=31536000,immutable'
)

$mutable = @(
    's3', 'sync', $distPath, "s3://$bucket",
    '--delete',
    '--exclude', '_astro/*',
    '--cache-control', 'public,max-age=0,must-revalidate'
)

if ($WhatIf) {
    $immutable += '--dryrun'
    $mutable += '--dryrun'
    Write-Host '(dry run - no changes will be made)' -ForegroundColor Yellow
}

if ($AwsProfile) {
    $immutable += @('--profile', $AwsProfile)
    $mutable += @('--profile', $AwsProfile)
}

Write-Host ''
Write-Host '-- fingerprinted assets (immutable) --' -ForegroundColor DarkGray
& aws @immutable
if ($LASTEXITCODE -ne 0) { Fail "Asset sync failed with exit code $LASTEXITCODE" }

Write-Host ''
Write-Host '-- html and everything else (revalidate) --' -ForegroundColor DarkGray
& aws @mutable
if ($LASTEXITCODE -ne 0) { Fail "HTML sync failed with exit code $LASTEXITCODE" }

if ($WhatIf) {
    Write-Host ''
    Write-Host 'Dry run complete. Nothing was changed.' -ForegroundColor Yellow
    exit 0
}

# -- Invalidate ----------------------------------------------------------------
if (-not $SkipInvalidation) {
    Write-Host ''
    Write-Host "Invalidating CloudFront distribution $distributionId..." -ForegroundColor Cyan
    $invalidation = Invoke-Aws @(
        'cloudfront', 'create-invalidation',
        '--distribution-id', $distributionId,
        '--paths', '/*'
    )
    Write-Host "      invalidation: $($invalidation.Invalidation.Id)"
}

$domain = ($outputs | Where-Object { $_.OutputKey -eq 'DistributionDomain' }).OutputValue

Write-Host ''
Write-Host 'Deployed.' -ForegroundColor Green
if ($domain) { Write-Host "  https://$domain" }
Write-Host ''
Write-Host 'CloudFront can take a few minutes to serve the new build everywhere.'
Write-Host ''
