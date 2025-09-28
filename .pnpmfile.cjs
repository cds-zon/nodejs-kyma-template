/**
 * .pnpmfile.cjs - PNPM hook to expose internal CDS middlewares
 * 
 * This file modifies the @sap/cds package during installation to expose
 * internal middleware functions that are normally not exported.
 */

function readPackage(pkg, context) {
  // Modify @sap/cds package to expose internal middlewares
  if (pkg.name === '@sap/cds') {
    context.log('Modifying @sap/cds to expose internal middlewares');
    
    // Add exports for internal middlewares to package.json
    if (!pkg.exports) {
      pkg.exports = {};
    }
    
    // Expose the middleware modules
    pkg.exports['./lib/srv/middlewares'] = './lib/srv/middlewares/index.js';
    pkg.exports['./lib/srv/middlewares/auth'] = './lib/srv/middlewares/auth/index.js';
    pkg.exports['./lib/srv/middlewares/context'] = './lib/srv/middlewares/cds-context.js';
    pkg.exports['./lib/srv/middlewares/trace'] = './lib/srv/middlewares/trace.js';
    pkg.exports['./lib/srv/middlewares/errors'] = './lib/srv/middlewares/errors.js';
    
    // Also expose via traditional main field extensions
    if (!pkg.files) {
      pkg.files = [];
    }
    
    // Ensure middleware files are included
    if (!pkg.files.includes('lib/srv/middlewares/**/*')) {
      pkg.files.push('lib/srv/middlewares/**/*');
    }
    
    context.log('@sap/cds package modified to expose middlewares');
  }
  
  // Also handle any other CDS-related packages
  if (pkg.name && pkg.name.startsWith('@sap/cds-')) {
    context.log(`Processing CDS-related package: ${pkg.name}`);
    
    // Ensure these packages can access the modified @sap/cds
    if (pkg.peerDependencies && pkg.peerDependencies['@sap/cds']) {
      context.log(`Updating peer dependency for ${pkg.name}`);
    }
  }
  
  return pkg;
}

function afterAllResolved(lockfile, context) {
  context.log('After all packages resolved - CDS middlewares should now be accessible');
  return lockfile;
}

module.exports = {
  hooks: {
    readPackage,
    afterAllResolved
  }
};
