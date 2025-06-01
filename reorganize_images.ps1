# PowerShell script to reorganize images according to difficulty batching
# Run this from your project root directory

$projectRoot = "C:\Users\hp\Documents\GenAI\language-learn-mvp"
$sourceDir = "$projectRoot\dist\pictures\batch01"
$targetDir = "$projectRoot\dist\shared\images"

# Create target directory
New-Item -Path $targetDir -ItemType Directory -Force

# Picture distribution by difficulty (from your manifest output)
# A1: 12 pictures → batch001 (1-10) + batch002 (11-12)
# A2: 10 pictures → batch003 (13-22) 
# B1: 8 pictures  → batch004 (23-30)
# B2: 8 pictures  → batch005 (31-38)
# C1: 6 pictures  → batch006 (39-44)
# C2: 6 pictures  → batch007 (45-50)

$batches = @(
    @{ name = "batch001"; start = 1;  end = 10 },   # A1 first 10
    @{ name = "batch002"; start = 11; end = 12 },   # A1 remaining 2
    @{ name = "batch003"; start = 13; end = 22 },   # A2 all 10
    @{ name = "batch004"; start = 23; end = 30 },   # B1 all 8
    @{ name = "batch005"; start = 31; end = 38 },   # B2 all 8
    @{ name = "batch006"; start = 39; end = 44 },   # C1 all 6
    @{ name = "batch007"; start = 45; end = 50 }    # C2 all 6
)

Write-Host "🖼️ Reorganizing images into batch structure..."

foreach ($batch in $batches) {
    $batchDir = "$targetDir\$($batch.name)"
    New-Item -Path $batchDir -ItemType Directory -Force
    
    Write-Host "📁 Creating $($batch.name)..."
    
    for ($i = $batch.start; $i -le $batch.end; $i++) {
        $paddedNum = $i.ToString("000")
        $sourceFile = "$sourceDir\pic_$paddedNum.jpg"
        $targetFile = "$batchDir\pic_$paddedNum.jpg"
        
        if (Test-Path $sourceFile) {
            Copy-Item $sourceFile $targetFile
            Write-Host "✅ Copied pic_$paddedNum.jpg to $($batch.name)"
        } else {
            # Create a placeholder image using PowerShell and .NET
            Write-Host "🎨 Creating placeholder pic_$paddedNum.jpg in $($batch.name)"
            
            # Load required assemblies for image creation
            Add-Type -AssemblyName System.Drawing
            Add-Type -AssemblyName System.Windows.Forms
            
            # Create a 400x300 image with colored background
            $bitmap = New-Object System.Drawing.Bitmap(400, 300)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            
            # Choose different colors for different difficulties
            $colors = @{
                "batch001" = [System.Drawing.Color]::LightBlue    # A1 - Light Blue
                "batch002" = [System.Drawing.Color]::LightBlue    # A1 - Light Blue
                "batch003" = [System.Drawing.Color]::LightGreen   # A2 - Light Green
                "batch004" = [System.Drawing.Color]::LightYellow  # B1 - Light Yellow
                "batch005" = [System.Drawing.Color]::LightCoral   # B2 - Light Coral
                "batch006" = [System.Drawing.Color]::LightPink    # C1 - Light Pink
                "batch007" = [System.Drawing.Color]::LightGray    # C2 - Light Gray
            }
            
            $bgColor = $colors[$batch.name]
            $brush = New-Object System.Drawing.SolidBrush($bgColor)
            $graphics.FillRectangle($brush, 0, 0, 400, 300)
            
            # Add text overlay
            $font = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
            $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
            
            # Main text
            $mainText = "pic_$paddedNum"
            $mainTextSize = $graphics.MeasureString($mainText, $font)
            $mainX = (400 - $mainTextSize.Width) / 2
            $mainY = (300 - $mainTextSize.Height) / 2 - 20
            $graphics.DrawString($mainText, $font, $textBrush, $mainX, $mainY)
            
            # Batch info
            $smallFont = New-Object System.Drawing.Font("Arial", 14)
            $batchText = "$($batch.name)"
            $batchTextSize = $graphics.MeasureString($batchText, $smallFont)
            $batchX = (400 - $batchTextSize.Width) / 2
            $batchY = $mainY + $mainTextSize.Height + 10
            $graphics.DrawString($batchText, $smallFont, $textBrush, $batchX, $batchY)
            
            # Difficulty level info
            $difficultyMap = @{
                "batch001" = "A1"; "batch002" = "A1"; "batch003" = "A2"
                "batch004" = "B1"; "batch005" = "B2"; "batch006" = "C1"; "batch007" = "C2"
            }
            $diffText = "Level: $($difficultyMap[$batch.name])"
            $diffTextSize = $graphics.MeasureString($diffText, $smallFont)
            $diffX = (400 - $diffTextSize.Width) / 2
            $diffY = $batchY + 25
            $graphics.DrawString($diffText, $smallFont, $textBrush, $diffX, $diffY)
            
            # Save as JPEG
            $bitmap.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            
            # Clean up
            $graphics.Dispose()
            $bitmap.Dispose()
            $brush.Dispose()
            $textBrush.Dispose()
            $font.Dispose()
            $smallFont.Dispose()
        }
    }
}

Write-Host ""
Write-Host "🎉 Image reorganization complete!"
Write-Host ""
Write-Host "📊 Final structure:"
Write-Host "dist/shared/images/"
foreach ($batch in $batches) {
    $count = $batch.end - $batch.start + 1
    Write-Host "├── $($batch.name)/ ($count images)"
}
Write-Host ""
Write-Host "🚀 Ready to upload to CDN!"
Write-Host ""
Write-Host "Upload command:"
Write-Host "az storage blob upload-batch --account-name teststoreacc32 --destination '`$web/shared' --source 'dist\shared' --overwrite true"