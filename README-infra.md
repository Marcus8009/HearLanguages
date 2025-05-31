# Infra Setup (Excerpt)

## 1. Create Storage Account + Static Website
```bash
az storage account create -n langcdn -g rg-langapp -l southeastasia --sku Standard_LRS
az storage blob service-properties update --account-name langcdn --static-website --404-document 404.html --index-document index.html
```

## 2. Upload dist to $web
```bash
az storage blob upload-batch -d '$web/v1' -s ./dist --account-name langcdn --content-cache-control 'public,max-age=31536000,immutable'
```

## 3. Create CDN profile & endpoint
```bash
az cdn profile create -n langcdnprof -g rg-langapp --sku Standard_Microsoft
az cdn endpoint create -n langcdnend -g rg-langapp -p langcdnprof --origin 'langcdn.blob.core.windows.net' --origin-host-header 'langcdn.blob.core.windows.net'
```

## 4. Purge CSV when updating
```bash
az cdn endpoint purge -g rg-langapp -n langcdnend --content-paths '/v1/csv/*'
```
