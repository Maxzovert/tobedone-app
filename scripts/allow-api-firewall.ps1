# Run in PowerShell as Administrator (right-click → Run as administrator)
netsh advfirewall firewall add rule name="Tobedone Dev API 3000" dir=in action=allow protocol=TCP localport=3000
Write-Host "Firewall rule added. Your phone can now reach the API on port 3000."
