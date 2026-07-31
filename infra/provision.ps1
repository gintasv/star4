<#
.SYNOPSIS
    Create or update the two CloudFormation stacks for the website.

.DESCRIPTION
    Order matters: dns-stack issues the TLS certificate and the SES sending
    identity, and site-stack needs the certificate ARN, so dns-stack goes first.

    SHARED ACCOUNT SAFETY
    ---------------------
    This account hosts other websites. Before any stack operation this script:

      1. Verifies the caller's account matches deploy.config.json.
      2. Verifies the hosted zone in the config actually belongs to the domain
         in the config - a wrong zone ID would write records into somebody
         else's domain.
      3. Refuses to continue if the hosted zone already has an apex A record,
         because that would mean something is already published there.
      4. Prints a change set for review and waits for confirmation before
         applying anything (unless -Force).

    Nothing here deletes or modifies a resource created outside these stacks.

.PARAMETER Stack
    Which stack to deploy: dns, site, or all (default).

.PARAMETER Force
    Skip the interactive confirmation. Intended for re-runs of an already
    reviewed change.
#>
[CmdletBinding()]
param(
    [ValidateSet('dns', 'site', 'all')]
    [string]$Stack = 'all',
    [switch]$Force,
    [string]$AwsProfile
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $here 'deploy.config.json'

function Fail([string]$Message) {
    Write-Host ''
    Write-Host "ABORTED: $Message" -ForegroundColor Red
    Write-Host ''
    exit 1
}

function Invoke-Aws {
    param([string[]]$Arguments)
    $full = @($Arguments)
    if ($AwsProfile) { $full += @('--profile', $AwsProfile) }
    $full += @('--output', 'json')
    $result = & aws @full
    if ($LASTEXITCODE -ne 0) { Fail "aws $($Arguments -join ' ') exited with $LASTEXITCODE" }
    if ([string]::IsNullOrWhiteSpace($result)) { return $null }
    return $result | ConvertFrom-Json
}

if (-not (Test-Path $configPath)) {
    Fail "Missing $configPath. Copy deploy.config.example.json and fill it in."
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json

foreach ($key in @('AccountId', 'Region', 'StackName', 'DomainName', 'HostedZoneId', 'NotifyEmail')) {
    if (-not $config.$key) { Fail "deploy.config.json is missing '$key'." }
}

$dnsStackName = 'star4-construction-dns'
$siteStackName = $config.StackName
$sender = "no-reply@$($config.DomainName)"

Write-Host ''
Write-Host 'Star 4 Construction - provision' -ForegroundColor Cyan
Write-Host '================================'

# -- 1. Account ----------------------------------------------------------------
Write-Host ''
Write-Host '[1/4] Verifying AWS account...' -ForegroundColor Yellow
$identity = Invoke-Aws @('sts', 'get-caller-identity')
Write-Host "      caller  : $($identity.Arn)"
if ($identity.Account -ne $config.AccountId) {
    Fail "Account mismatch: credentials are $($identity.Account), config expects $($config.AccountId)."
}
Write-Host '      OK' -ForegroundColor Green

# -- 2. Hosted zone really is this domain -------------------------------------
Write-Host ''
Write-Host '[2/4] Verifying the hosted zone matches the domain...' -ForegroundColor Yellow
$zone = Invoke-Aws @('route53', 'get-hosted-zone', '--id', $config.HostedZoneId)
$zoneName = $zone.HostedZone.Name.TrimEnd('.')
Write-Host "      zone $($config.HostedZoneId) is '$zoneName'"

if ($zoneName -ne $config.DomainName) {
    Fail "Hosted zone $($config.HostedZoneId) is for '$zoneName', not '$($config.DomainName)'. Refusing to write records into another domain."
}
Write-Host '      OK' -ForegroundColor Green

# -- 3. Nothing already published at the apex ---------------------------------
Write-Host ''
Write-Host '[3/4] Checking the zone for existing apex records...' -ForegroundColor Yellow
$records = Invoke-Aws @('route53', 'list-resource-record-sets', '--hosted-zone-id', $config.HostedZoneId)
$apex = @($records.ResourceRecordSets | Where-Object {
        $_.Name.TrimEnd('.') -eq $config.DomainName -and $_.Type -in @('A', 'AAAA', 'CNAME')
    })

if ($apex.Count -gt 0) {
    Write-Host ''
    Write-Host '      An apex record already exists in this zone:' -ForegroundColor Red
    foreach ($r in $apex) { Write-Host "        $($r.Type) $($r.Name)" -ForegroundColor Red }
    Fail 'Something is already published at this domain. Review before continuing - deploying would replace it.'
}
Write-Host "      no apex A/AAAA/CNAME present - safe to add"
Write-Host '      OK' -ForegroundColor Green

# -- 4. Confirm ----------------------------------------------------------------
Write-Host ''
Write-Host '[4/4] Planned changes' -ForegroundColor Yellow
Write-Host ''
Write-Host "  Account   : $($config.AccountId)"
Write-Host "  Region    : $($config.Region)"
Write-Host "  Domain    : $($config.DomainName)"
Write-Host "  Zone      : $($config.HostedZoneId)"
Write-Host "  Notify    : $($config.NotifyEmail)"
Write-Host ''
Write-Host '  Stacks to create or update:'
if ($Stack -in @('dns', 'all')) {
    Write-Host "    $dnsStackName" -ForegroundColor Green
    Write-Host '      ACM certificate (apex + www, DNS validated)'
    Write-Host '      SES domain identity with DKIM'
    Write-Host '      3 DKIM CNAMEs, 1 DMARC TXT, 2 cert-validation CNAMEs'
}
if ($Stack -in @('site', 'all')) {
    Write-Host "    $siteStackName" -ForegroundColor Green
    Write-Host '      private S3 bucket, CloudFront distribution + OAC'
    Write-Host '      URL-rewrite function, security headers policy'
    Write-Host '      quote-form Lambda + function URL + IAM role'
    Write-Host '      apex and www alias records'
}
Write-Host ''
Write-Host '  Nothing existing is modified or deleted.' -ForegroundColor DarkGray
Write-Host ''

if (-not $Force) {
    $answer = Read-Host 'Proceed? Type YES to continue'
    if ($answer -cne 'YES') { Fail 'Not confirmed.' }
}

# -- Deploy dns ----------------------------------------------------------------
if ($Stack -in @('dns', 'all')) {
    Write-Host ''
    Write-Host "Deploying $dnsStackName (certificate validation can take several minutes)..." -ForegroundColor Cyan

    $cfnArgs = @(
        'cloudformation', 'deploy',
        '--template-file', (Join-Path $here 'dns-stack.yaml'),
        '--stack-name', $dnsStackName,
        '--region', $config.Region,
        '--no-fail-on-empty-changeset',
        '--tags', 'Project=Star4Construction', 'ManagedBy=CloudFormation',
        '--parameter-overrides',
        "DomainName=$($config.DomainName)",
        "HostedZoneId=$($config.HostedZoneId)",
        "DmarcReportEmail=$($config.NotifyEmail)"
    )
    if ($AwsProfile) { $cfnArgs += @('--profile', $AwsProfile) }

    & aws @cfnArgs
    if ($LASTEXITCODE -ne 0) { Fail "dns-stack deployment failed with exit code $LASTEXITCODE" }
    Write-Host "  $dnsStackName deployed." -ForegroundColor Green
}

# -- Deploy site ---------------------------------------------------------------
if ($Stack -in @('site', 'all')) {
    Write-Host ''
    Write-Host 'Generating the site template (splicing in the Lambda handler)...' -ForegroundColor Cyan
    & node (Join-Path $here 'build-template.mjs')
    if ($LASTEXITCODE -ne 0) { Fail 'build-template.mjs failed.' }

    # The certificate ARN comes from the dns stack rather than the config, so
    # the two stacks cannot disagree about which certificate is in use.
    $certArn = ''
    try {
        $dns = Invoke-Aws @('cloudformation', 'describe-stacks', '--stack-name', $dnsStackName, '--region', $config.Region)
        $certArn = ($dns.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'CertificateArn' }).OutputValue
    } catch {
        Write-Host '  dns-stack not found; deploying without a certificate (CloudFront domain only).' -ForegroundColor Yellow
    }

    if ($certArn) {
        Write-Host "  certificate: $certArn"
    } else {
        Write-Host '  no certificate - the site will serve on its CloudFront domain and DNS stays untouched.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host "Deploying $siteStackName (CloudFront takes several minutes)..." -ForegroundColor Cyan

    $overrides = @(
        "DomainName=$($config.DomainName)",
        "NotifyEmail=$($config.NotifyEmail)",
        "SesSenderIdentity=$sender",
        "CertificateArn=$certArn"
    )
    # Alias records are only published once there is a certificate to serve them.
    if ($certArn) { $overrides += "HostedZoneId=$($config.HostedZoneId)" }

    $cfnArgs = @(
        'cloudformation', 'deploy',
        '--template-file', (Join-Path $here 'site-stack.generated.yaml'),
        '--stack-name', $siteStackName,
        '--region', $config.Region,
        '--capabilities', 'CAPABILITY_NAMED_IAM',
        '--no-fail-on-empty-changeset',
        '--tags', 'Project=Star4Construction', 'ManagedBy=CloudFormation',
        '--parameter-overrides'
    ) + $overrides
    if ($AwsProfile) { $cfnArgs += @('--profile', $AwsProfile) }

    & aws @cfnArgs
    if ($LASTEXITCODE -ne 0) { Fail "site-stack deployment failed with exit code $LASTEXITCODE" }

    Write-Host "  $siteStackName deployed." -ForegroundColor Green

    $site = Invoke-Aws @('cloudformation', 'describe-stacks', '--stack-name', $siteStackName, '--region', $config.Region)
    $out = $site.Stacks[0].Outputs

    Write-Host ''
    Write-Host 'Outputs' -ForegroundColor Cyan
    foreach ($o in $out) { Write-Host ("  {0,-20} {1}" -f $o.OutputKey, $o.OutputValue) }

    $endpoint = ($out | Where-Object { $_.OutputKey -eq 'QuoteFormEndpoint' }).OutputValue
    Write-Host ''
    Write-Host 'Next:' -ForegroundColor Yellow
    Write-Host "  1. Put this in .env so the contact form renders:"
    Write-Host "       PUBLIC_FORM_ENDPOINT=$endpoint"
    Write-Host '  2. npm run build'
    Write-Host '  3. .\infra\deploy.ps1'
    Write-Host '  4. powershell -File .\infra\inventory.ps1 -Label after'
    Write-Host '     powershell -File .\infra\inventory.ps1 -Diff'
}

Write-Host ''
