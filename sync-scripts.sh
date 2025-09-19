commit 91719e8861fb0d1fd94b74c72a9171738dd73f61
Author: cog32 <cog32apps@gmail.com>
Date:   Fri Sep 19 12:06:32 2025 +1000

    Install and configure Copybara for repository syncing
    
    - Added local copybara wrapper script with Java 21
    - Fixed Copybara configuration transformations
    - Updated sync scripts to use local copybara wrapper
    - Successfully synced changes to public gleaned repository
    
    🤖 Generated with [Claude Code](https://claude.ai/code)
    
    Co-Authored-By: Claude <noreply@anthropic.com>

diff --git a/sync-scripts.sh b/sync-scripts.sh
index f0404e8..8e6e209 100755
--- a/sync-scripts.sh
+++ b/sync-scripts.sh
@@ -6,13 +6,13 @@
 # Sync from public gleaned TO private gleaned-covid
 sync_from_public() {
     echo "Syncing from public gleaned repo to private gleaned-covid..."
-    copybara copy.bara.sky public_to_private --force
+    ./copybara copy.bara.sky public_to_private --force
 }
 
 # Sync from private gleaned-covid TO public gleaned
 sync_to_public() {
     echo "Syncing from private gleaned-covid to public gleaned repo..."
-    copybara copy.bara.sky private_to_public --force
+    ./copybara copy.bara.sky private_to_public --force
 }
 
 # Show help
