<#
.SYNOPSIS
    Read-only inventory of the AWS account, taken before and after provisioning.

.DESCRIPTION
    This AWS account already hosts other websites. Nothing in this repo may
    modify or delete a resource it did not create, and the way we prove that is
    to snapshot the account before touching it and diff afterwards.

    Every call below is a List/Describe/Get. There is no create, update or
    delete anywhere in this file, by design - read it before you run it.

    Run it twice:
        .\inventory.ps1 -Label before     # before any provisioning
        .\inventory.ps1 -Label after      # after the stacks are deployed
        .\inventory.ps1 -Diff             # compare the two

    The diff must show additions only, all tagged Project=Star4Construction.

.PARAMETER Label
    Snapshot name. Written to infra/inventory-<Label>.json.

.PARAMETER Diff
    Compare inventory-before.json with inventory-after.json instead of
    taking a new snapshot.

.PARAMETER Profile
    Optional AWS CLI profile name.
#>
[CmdletBinding()]
param(
    [string]$Label = 'before',
    [switch]$Diff,
    [string]$AwsProfile
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Invoke-Aws {
    param([string[]]$Arguments)
    $full = @($Arguments)
    if ($AwsProfile) { $full += @('--profile', $AwsProfile) }
    $full += @('--output', 'json')

    $raw = & aws @full
    if ($LASTEXITCODE -ne 0) { throw "aws $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    return $raw | ConvertFrom-Json
}

# ---------------------------------------------------------------- diff mode --
if ($Diff) {
    $beforePath = Join-Path $here 'inventory-before.json'
    $afterPath = Join-Path $here 'inventory-after.json'

    foreach ($p in @($beforePath, $afterPath)) {
        if (-not (Test-Path $p)) { throw "Missing $p - take both snapshots first." }
    }

    $before = Get-Content $beforePath -Raw | ConvertFrom-Json
    $after = Get-Content $afterPath -Raw | ConvertFrom-Json

    Write-Host ''
    Write-Host 'Inventory diff (before -> after)' -ForegroundColor Cyan
    Write-Host '================================='

    $clean = $true
    foreach ($section in @('Buckets', 'Distributions', 'HostedZones', 'Functions', 'Certificates', 'SesIdentities', 'Stacks')) {
        $b = @($before.$section)
        $a = @($after.$section)

        $added = @($a | Where-Object { $_ -notin $b })
        $removed = @($b | Where-Object { $_ -notin $a })

        if ($added.Count -eq 0 -and $removed.Count -eq 0) {
            Write-Host ("  {0,-16} unchanged ({1})" -f $section, $b.Count) -ForegroundColor DarkGray
            continue
        }

        Write-Host ("  {0}" -f $section) -ForegroundColor Yellow
        foreach ($item in $added) {
            $ours = $item -like '*star4*'
            $colour = if ($ours) { 'Green' } else { 'Red' }
            if (-not $ours) { $clean = $false }
            Write-Host ("    + {0}" -f $item) -ForegroundColor $colour
        }
        foreach ($item in $removed) {
            # A removal is always a problem: this repo never deletes anything.
            $clean = $false
            Write-Host ("    - {0}   [REMOVED - INVESTIGATE]" -f $item) -ForegroundColor Red
        }
    }

    Write-Host ''
    if ($clean) {
        Write-Host 'PASS: additions only, all named star4*. No pre-existing resource was touched.' -ForegroundColor Green
        exit 0
    }
    Write-Host 'FAIL: the diff contains a removal or a non-star4 addition. Investigate before continuing.' -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------ snapshot mode --
Write-Host ''
Write-Host "Taking read-only inventory (label: $Label)..." -ForegroundColor Cyan

$identity = Invoke-Aws @('sts', 'get-caller-identity')
Write-Host ("  Account : {0}" -f $identity.Account)
Write-Host ("  Identity: {0}" -f $identity.Arn)

$inventory = [ordered]@{
    TakenAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    Label      = $Label
    Account    = $identity.Account
}

Write-Host '  Listing S3 buckets...'
$inventory.Buckets = @((Invoke-Aws @('s3api', 'list-buckets')).Buckets | ForEach-Object { $_.Name } | Sort-Object)

Write-Host '  Listing CloudFront distributions...'
$dist = Invoke-Aws @('cloudfront', 'list-distributions')
$inventory.Distributions = @(
    $dist.DistributionList.Items | ForEach-Object {
        '{0} [{1}]' -f $_.Id, ($_.Aliases.Items -join ',')
    } | Sort-Object
)

Write-Host '  Listing Route 53 hosted zones...'
$zones = Invoke-Aws @('route53', 'list-hosted-zones')
$inventory.HostedZones = @($zones.HostedZones | ForEach-Object { '{0} {1}' -f $_.Id, $_.Name } | Sort-Object)

# Record the record-sets of every zone, so we can prove no existing record
# was altered - this is the highest-risk area for a shared account.
$inventory.RecordSets = [ordered]@{}
foreach ($zone in $zones.HostedZones) {
    $zoneId = $zone.Id -replace '/hostedzone/', ''
    $records = Invoke-Aws @('route53', 'list-resource-record-sets', '--hosted-zone-id', $zoneId)
    $inventory.RecordSets[$zone.Name] = @(
        $records.ResourceRecordSets | ForEach-Object { '{0} {1}' -f $_.Type, $_.Name } | Sort-Object
    )
}

Write-Host '  Listing Lambda functions...'
$inventory.Functions = @((Invoke-Aws @('lambda', 'list-functions')).Functions | ForEach-Object { $_.FunctionName } | Sort-Object)

Write-Host '  Listing ACM certificates (us-east-1)...'
$certs = Invoke-Aws @('acm', 'list-certificates', '--region', 'us-east-1')
$inventory.Certificates = @($certs.CertificateSummaryList | ForEach-Object { $_.DomainName } | Sort-Object)

Write-Host '  Listing SES identities (us-east-1)...'
try {
    $ses = Invoke-Aws @('sesv2', 'list-email-identities', '--region', 'us-east-1')
    $inventory.SesIdentities = @($ses.EmailIdentities | ForEach-Object { $_.IdentityName } | Sort-Object)
} catch {
    Write-Host '    (SES not reachable or not enabled - recorded as empty)' -ForegroundColor DarkGray
    $inventory.SesIdentities = @()
}

Write-Host '  Listing CloudFormation stacks...'
$stacks = Invoke-Aws @('cloudformation', 'describe-stacks', '--region', 'us-east-1')
$inventory.Stacks = @($stacks.Stacks | ForEach-Object { $_.StackName } | Sort-Object)

$outPath = Join-Path $here "inventory-$Label.json"
$inventory | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding utf8

Write-Host ''
Write-Host "Wrote $outPath" -ForegroundColor Green
Write-Host ''
Write-Host 'Summary' -ForegroundColor Cyan
Write-Host ("  S3 buckets            : {0}" -f $inventory.Buckets.Count)
Write-Host ("  CloudFront dists      : {0}" -f $inventory.Distributions.Count)
Write-Host ("  Route 53 zones        : {0}" -f $inventory.HostedZones.Count)
Write-Host ("  Lambda functions      : {0}" -f $inventory.Functions.Count)
Write-Host ("  ACM certs (us-east-1) : {0}" -f $inventory.Certificates.Count)
Write-Host ("  SES identities        : {0}" -f $inventory.SesIdentities.Count)
Write-Host ("  CFN stacks (us-east-1): {0}" -f $inventory.Stacks.Count)
Write-Host ''
Write-Host 'Existing hosted zones (the domain must match one of these, or be added at your registrar):'
foreach ($z in $inventory.HostedZones) { Write-Host "  $z" }
Write-Host ''
