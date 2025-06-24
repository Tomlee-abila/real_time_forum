// Debug helper to catch circular structure errors in real-time
// Run this in your browser console when the error occurs

function debugCircularError() {
  console.log('🔍 Starting circular structure debug...');
  
  // Override JSON.stringify to catch the exact moment of failure
  const originalStringify = JSON.stringify;
  JSON.stringify = function(obj, replacer, space) {
    try {
      return originalStringify.call(this, obj, replacer, space);
    } catch (error) {
      if (error.message.includes('circular structure')) {
        console.error('🚨 CIRCULAR STRUCTURE DETECTED!');
        console.error('Object that caused the error:', obj);
        console.error('Object keys:', Object.keys(obj || {}));
        console.error('Object constructor:', obj?.constructor?.name);
        
        // Try to find the circular property
        if (obj && typeof obj === 'object') {
          for (const key in obj) {
            try {
              originalStringify(obj[key]);
            } catch (nestedError) {
              if (nestedError.message.includes('circular')) {
                console.error(`🎯 Circular property found: ${key}`);
                console.error('Property value:', obj[key]);
                console.error('Property type:', typeof obj[key]);
                console.error('Property constructor:', obj[key]?.constructor?.name);
              }
            }
          }
        }
      }
      throw error;
    }
  };
  
  console.log('✅ Debug override installed. Now try to reproduce the error.');
}

// Call this function in your browser console
debugCircularError();
