$deps = @(
    @{
        Name = "marked.esm.js"
        Url = "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js"
    },
    @{
        Name = "purify.min.js"
        Url = "https://cdn.jsdelivr.net/npm/dompurify@3.0.11/dist/purify.min.js"
    },
    @{
        Name = "prism.min.js"
        Url = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"
    },
    @{
        Name = "prism.min.css"
        Url = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css"
    }
)

# Languages to include
$languages = @(
    "python",
    "javascript",
    "markup", # HTML
    "css",
    "json",
    "bash",
    "markdown"
)

# Download core files
foreach ($dep in $deps) {
    Write-Host "Downloading $($dep.Name)..."
    Invoke-WebRequest -Uri $dep.Url -OutFile $dep.Name
}

# Download language components
foreach ($lang in $languages) {
    Write-Host "Downloading Prism language: $lang..."
    $url = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-$lang.min.js"
    $outFile = "prism-$lang.min.js"
    Invoke-WebRequest -Uri $url -OutFile $outFile
}
