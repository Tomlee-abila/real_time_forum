// Test script to verify all imports work correctly
import('./src/App.jsx')
  .then(module => {
    console.log('✅ App.jsx imported successfully:', module.default);
    return import('./src/components/ContentCard.tsx');
  })
  .then(module => {
    console.log('✅ ContentCard.tsx imported successfully:', module.default);
    return import('./src/hooks/useWatchlist.ts');
  })
  .then(module => {
    console.log('✅ useWatchlist.ts imported successfully:', module.useWatchlist);
    return import('./src/utils/dataIsolation.ts');
  })
  .then(module => {
    console.log('✅ dataIsolation.ts imported successfully');
    return import('./src/types/content.ts');
  })
  .then(module => {
    console.log('✅ content.ts types imported successfully');
    console.log('🎉 All imports working correctly!');
  })
  .catch(error => {
    console.error('❌ Import error:', error);
  });
