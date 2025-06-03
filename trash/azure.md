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

REM ── parameters ──────────────────────────────────────────
set SA=teststoreacc32
set RG=MyResourceGroup2
set DIST=C:\Users\hp\Documents\GenAI\language-learn-mvp\dist
set LOCATION=southeastasia
https://teststoreacc32.z23.web.core.windows.net/
REM ── create infra ────────────────────────────────────────

az cdn profile create \
  --name langappcdn \
  --resource-group %RG% \
  --sku Standard_Microsoft

az group create --location %LOCATION% --resource-group %RG%

az storage account create ^
  --name %SA% ^
  --resource-group %RG% ^
  --location %LOCATION% ^
  --sku Standard_LRS ^
  --kind StorageV2

REM enable static website
az storage blob service-properties update ^
  --account-name %SA% ^
  --static-website ^
  --index-document index.html ^
  --404-document 404.html

REM allow public blob access (needed for $web)
az storage account update ^
  --name %SA% ^
  --resource-group %RG% ^
  --allow-blob-public-access true

REM ── deploy placeholder index/404 (optional) ─────────────
echo "{}" > %DIST%\index.html
echo "{}" > %DIST%\404.html
az storage blob upload ^
  --account-name %SA% ^
  --container-name $web ^
  --file "%DIST%\index.html" ^
  --name "index.html" 

  
az storage blob upload ^
  --account-name %SA% ^
  --container-name $web ^
  --file "%DIST%\404.html" ^
  --name "404.html" 

az storage cors add ^
  --methods GET ^
  --origins http://localhost:8081 ^
  --allowed-headers '*' ^
  --exposed-headers '*' ^
  --services b ^
  --account-name %SA%


export AZURE_STORAGE_ACCOUNT=%SA%
export AZURE_STORAGE_KEY=EqPJfmNlR4nMDy5p/V+18j0v79v/SQOHTj5PThiZbPBrzWgScezp7sM26RiFZMEQ9hJQkegeDV8e+AStVuQ+OQ==

az storage cors add \
  --services b \
  --origins http://localhost:8081 \
  --methods GET \
  --allowed-headers 'x-ms-meta-*,*' \
  --exposed-headers 'x-ms-meta-*,*' \
  --max-age 3600

az storage cors add ^
  --connection-string "DefaultEndpointsProtocol=https;AccountName=teststoreacc32;AccountKey=EqPJfmNlR4nMDy5p/V+18j0v79v/SQOHTj5PThiZbPBrzWgScezp7sM26RiFZMEQ9hJQkegeDV8e+AStVuQ+OQ==;EndpointSuffix=core.windows.net" ^
  --services b ^
  --origins http://localhost:8081 ^
  --methods GET ^
  --allowed-headers x-ms-meta-*,Content-Type,Accept ^
  --exposed-headers x-ms-meta-*,Content-Length ^
  --max-age 3600

WTF
REM ── long-cache: sentences / words / pictures ──────────────────
for %F in (sentences words pictures) do @az storage blob upload-batch ^
  --account-name %SA% ^
  --auth-mode login ^
  --destination "$web/v1/%F/batch01" ^
  --source "%DIST%\%F\batch01" ^
  --overwrite true ^
  --content-cache-control "public,max-age=31536000,immutable"

REM ── short-cache: CSV ───────────────────────────────────────────
az storage blob upload-batch ^
  --account-name %SA% --auth-mode login ^
  --destination "$web/v1/csv/batch01" ^
  --source "%DIST%\csv\batch01" ^
  --overwrite true ^
  --content-cache-control "public,max-age=300,must-revalidate"

REM master index JSON
az storage blob upload ^
  --account-name %SA% --auth-mode login ^
  --container-name $web ^
  --file "%DIST%\index_v1.json" ^
  --name "v1/index_v1.json" ^
  --overwrite true ^
  --content-cache-control "public,max-age=300,must-revalidate"

az storage blob upload ^
  --account-name %SA% --auth-mode login ^
  --container-name $web ^
  --file "%DIST%\index_v1.json" ^
  --name "v1/index_v1.json" ^
  --overwrite true ^
  --content-cache-control "public,max-age=300,must-revalidate"

WTF

az storage account show ^
  --name teststoreacc32 ^
  --resource-group MyResourceGroup2 ^
  --query "primaryEndpoints.web" ^
  -o tsv
REM sentences, words, pictures  → 1 year immutable cache
for %F in (csv sentences words pictures) do @az storage blob upload-batch ^
  --account-name %SA% ^
  --auth-mode login ^
  --destination "$web/v1/%F/batch01" ^
  --source "%DIST%\%F\batch01" ^
  --overwrite true ^
  --content-cache-control "public,max-age=31536000,immutable"

REM ── long-cache uploads ──────────────────────────────────
for %%F in (csv sentences words pictures) do (
  az storage blob upload-batch ^
    --account-name %SA% ^
    --auth-mode login ^
    --destination "$web/v1/%%F" ^
    --source "%DIST%\%%F\batch01" ^
    --content-cache-control "public,max-age=31536000,immutable"
)

REM If picture batch contains JPEGs ensure correct content-type
az storage blob upload-batch ^
  --account-name %SA% ^
  --auth-mode login ^
  --destination "$web/v1/pictures/batch01" ^
  --pattern "*.jpg" ^
  --source "%DIST%\pictures\batch01" ^
  --overwrite true ^
  --content-type "image/jpeg" ^
  --content-cache-control "public,max-age=31536000,immutable"

REM ── short-cache uploads (CSV + JSON) ────────────────────
az storage blob upload-batch ^
  --account-name %SA% ^
  --auth-mode login ^
  --destination "$web/v1/csv/batch01" ^
  --source "%DIST%\csv\batch01" ^
  --overwrite true ^
  --content-cache-control "public,max-age=300,must-revalidate"

az storage blob upload ^
  --account-name %SA% ^
  --auth-mode login ^
  --container-name $web ^
  --file "%DIST%\index_v1.json" ^
  --name "v1/index_v1.json" ^
  --overwrite true ^
  --content-cache-control "public,max-age=300,must-revalidate"




















