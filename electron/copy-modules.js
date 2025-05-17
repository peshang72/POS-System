
    const fs = require('fs');
    const path = require('path');
    
    const sourceDir = '/home/peshang/pos-system/server/dist/node_modules';
    const targetDir = '/home/peshang/pos-system/electron/dist/win-unpacked/resources/server/dist/node_modules';
    
    console.log('Copying from:', sourceDir);
    console.log('Copying to:', targetDir);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy function that resolves symlinks
    function copyDir(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        try {
          if (entry.isSymbolicLink && entry.isSymbolicLink()) {
            // For symlinks, resolve the target and copy the actual file/directory
            const linkTarget = fs.readlinkSync(srcPath);
            const resolvedTarget = path.resolve(path.dirname(srcPath), linkTarget);
            
            if (fs.existsSync(resolvedTarget)) {
              if (fs.statSync(resolvedTarget).isDirectory()) {
                if (!fs.existsSync(destPath)) {
                  fs.mkdirSync(destPath, { recursive: true });
                }
                copyDir(resolvedTarget, destPath);
              } else {
                fs.copyFileSync(resolvedTarget, destPath);
              }
            }
          } else if (entry.isDirectory()) {
            // For directories, recurse
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyDir(srcPath, destPath);
          } else {
            // For regular files, just copy
            fs.copyFileSync(srcPath, destPath);
          }
        } catch (err) {
          console.error(`Error copying ${srcPath} to ${destPath}: ${err.message}`);
        }
      }
    }
    
    // Run the copy
    try {
      copyDir(sourceDir, targetDir);
      console.log('✅ Copy completed successfully!');
    } catch (err) {
      console.error('❌ Copy failed:', err);
      process.exit(1);
    }
  