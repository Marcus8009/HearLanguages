set SA=teststoreacc32
set RG=MyResourceGroup2
set DIST=C:\Users\hp\Documents\GenAI\language-learn-mvp\dist

az group create --location westus --resource-group %RG%

az storage account create ^
  --name %SA% ^
  --resource-group %RG% ^
  --location westus ^
  --sku Standard_LRS ^
  --kind StorageV2

az storage blob service-properties update ^
  --account-name %SA% ^
  --static-website ^
  --index-document index.html ^
  --404-document 404.html

az storage account update ^
  --name %SA% ^
  --resource-group %RG% ^
  --allow-blob-public-access true

az storage blob upload-batch ^
  --account-name teststoreacc324 ^
  --destination "$web/v1" ^
  --source "%DIST%"


az extension add --name storage-preview
##########################################

REM 1-year immutable for audio & images
az storage blob update-batch ^
  --account-name %SA% ^
  --destination "$web/v1/sentences" ^
  --content-cache-control "public,max-age=31536000,immutable"

az storage blob update-batch ^
  --account-name %SA% ^
  --destination "$web/v1/words" ^
  --content-cache-control "public,max-age=31536000,immutable"

az storage blob update-batch ^
  --account-name %SA% ^
  --destination "$web/v1/pictures" ^
  --content-cache-control "public,max-age=31536000,immutable"

REM 5-minute must-revalidate for metadata
az storage blob update-batch ^
  --account-name %SA% ^
  --destination "$web/v1/csv" ^
  --content-cache-control "public,max-age=300,must-revalidate"

az storage blob upload ^
  --account-name %SA% ^
  --container-name $web ^
  --file "%DIST%\index_v1.json" ^
  --name "v1/index_v1.json" ^
  --content-cache-control "public,max-age=300,must-revalidate"

###############################

REM ── long-cache upload: audio ─────────────────────────
az storage blob upload-batch ^
  --account-name %SA% ^
  --destination "$web/v1/sentences" ^
  --source "%DIST%\sentences\batch01" ^
  --content-cache-control "public,max-age=31536000,immutable"

az storage blob upload-batch ^
  --account-name %SA% ^
  --destination "$web/v1/words" ^
  --source "%DIST%\words" ^
  --content-cache-control "public,max-age=31536000,immutable"

az storage blob upload-batch ^
  --account-name %SA% ^
  --destination "$web/v1/pictures" ^
  --source "%DIST%\pictures\batch01" ^
  --content-cache-control "public,max-age=31536000,immutable"

REM ── short-cache upload: CSV + JSON ───────────────────
az storage blob upload-batch ^
  --account-name %SA% ^
  --destination "$web/v1/csv/batch01" ^
  --source "%DIST%\csv\batch01" ^
  --content-cache-control "public,max-age=300,must-revalidate"

az storage blob upload ^
  --account-name %SA% ^
  --container-name $web ^
  --file "%DIST%\index_v1.json" ^
  --name "v1/index_v1.json" ^
  --content-cache-control "public,max-age=300,must-revalidate"





















