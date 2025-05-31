REM ── Azure CDN Setup for Language Learning App ──────────────
REM ── parameters ──────────────────────────────────────────
set SA=teststoreacc32
set RG=MyResourceGroup2
set DIST=C:\Users\hp\Documents\GenAI\language-learn-mvp\dist
set LOCATION=southeastasia
set CDN_PROFILE=langappcdn
set CDN_ENDPOINT=langappendpoint

REM ── 1. Create CDN Profile ──────────────────────────────
echo Creating CDN profile...
az cdn profile create ^
  --resource-group %RG% ^
  --name %CDN_PROFILE% ^
  --location %LOCATION% ^
  --sku Standard_Microsoft  ⁠⁠⁠⁠⁠⁠⁠⁠⁠
REM ── 2. Create CDN Endpoint ─────────────────────────────
echo Creating CDN endpoint...
az cdn endpoint create ^
  --resource-group %RG% ^
  --profile-name %CDN_PROFILE% ^
  --name %CDN_ENDPOINT% ^
  --origin %SA%.z23.web.core.windows.net ^                         
  --origin-host-header %SA%.z23.web.core.windows.net ^            
  --origin-path '/$web' ^                                       
  --query-string-caching-behavior IgnoreQueryString ^
  --location %LOCATION%

REM ── 3. Configure Caching Rules ────────────────────────
echo Configuring caching rules...

REM Cache audio/images for 1 year (immutable)
az cdn endpoint rule add ^
  --resource-group %RG% ^
  --profile-name %CDN_PROFILE% ^
  --endpoint-name %CDN_ENDPOINT% ^
  --order 1 ^
  --rule-name CacheAudioImages ^
  --match-variable UrlPath ^
  --operator BeginsWith ^
  --match-values /v1/sentences/ /v1/words/ /v1/pictures/ /v1/thumbs/ ^  # drop the “\$web” prefix inside CDN rules :contentReference[oaicite:2]{index=2}
  --action-name CacheExpiration ^
  --cache-behavior Override ^
  --cache-duration 365.00:00:00

REM Cache CSV/JSON for 5 minutes (frequently updated)
az cdn endpoint rule add ^
  --resource-group %RG% ^
  --profile-name %CDN_PROFILE% ^
  --endpoint-name %CDN_ENDPOINT% ^
  --order 2 ^
  --rule-name CacheCsvJson ^
  --match-variable UrlPath ^
  --operator BeginsWith ^
  --match-values /v1/csv/ /v1/index_v1.json ^
  --action-name CacheExpiration ^
  --cache-behavior Override ^
  --cache-duration 00:05:00

REM ── 4. Enable Compression ──────────────────────────────
echo Enabling compression...
az cdn endpoint update ^
  --resource-group %RG% ^
  --profile-name %CDN_PROFILE% ^
  --name %CDN_ENDPOINT% ^
  --enable-compression true

REM ── 5. Upload your content ──────────────────────────────
echo Uploading content to blob storage...
if exist "%DIST%" (
  az storage blob upload-batch ^
    --account-name %SA% ^
    --destination '$web' ^
    --destination-path v1 ^
    --source "%DIST%" ^
    --pattern "*.mp3" ^
    --content-cache-control "public,max-age=31536000,immutable" 
    
  az storage blob upload-batch ^
    --account-name %SA% ^
    --destination '$web' ^
    --destination-path v1 ^
    --source "%DIST%" ^
    --pattern "*.csv" --pattern "*.json" ^
    --content-cache-control "public,max-age=300,must-revalidate"
) else (
  echo WARNING: DIST folder not found at %DIST%
)

REM ── 6. Get your CDN URL ─────────────────────────────────
echo.
echo =====================================================
echo CDN Setup Complete!
echo =====================================================
echo Your CDN URL: https://%CDN_ENDPOINT%.azureedge.net/v1
echo Test URL: https://%CDN_ENDPOINT%.azureedge.net/v1/index_v1.json
echo.
echo Update your constants.js with:
echo export const CDN_BASE = 'https://%CDN_ENDPOINT%.azureedge.net/v1';
echo =====================================================
