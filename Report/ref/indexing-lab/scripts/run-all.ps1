$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

Write-Host "Starting MySQL and MongoDB containers..."
docker compose up -d

Write-Host "Waiting for MySQL to become healthy..."
do {
    Start-Sleep -Seconds 2
    docker compose exec -T -e MYSQL_PWD=root mysql mysqladmin ping -uroot --silent *> $null
    $mysqlReady = $LASTEXITCODE -eq 0
} until ($mysqlReady)

Write-Host "Waiting for MongoDB to become healthy..."
do {
    Start-Sleep -Seconds 2
    $mongoPing = docker compose exec -T mongo mongosh --quiet -u root -p root --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 }).ok"
    $mongoReady = $mongoPing -match "1"
} until ($mongoReady)

Write-Host "Waiting extra for MySQL to finish initialization..."
Start-Sleep -Seconds 15

Write-Host "Running MySQL tests..."
Get-Content .\mysql\tests\all_tests.sql | docker compose exec -T -e MYSQL_PWD=root mysql mysql -uroot indexing_lab | Tee-Object -FilePath mysql_result.txt

Write-Host "Running MongoDB tests..."
docker compose exec -T mongo mongosh --quiet -u root -p root --authenticationDatabase admin /tests/all_tests.js | Tee-Object -FilePath mongo_result.txt

Write-Host "Done. Results saved to mysql_result.txt and mongo_result.txt"
