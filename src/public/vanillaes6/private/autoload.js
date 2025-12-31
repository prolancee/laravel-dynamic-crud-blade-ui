const baseUrl = new URL('/vendor/prolancee/crud/blade/src/', window.location.origin).href;
const modules = [
  `${baseUrl}bootstrap/boot.js`,
  `${baseUrl}app/registry.js`,
];

const run = async () => {
  for (const path of modules) {
    try {
      const module = await import(path);

      if (typeof module?.default === 'function') {
        await module.default();
      }

      for (const [key, value] of Object.entries(module)) {
        if (typeof value === 'function' && key.startsWith('init')) {
          await value(); 
        }
      }

    } catch (e) {
      throw e;
    }
  }
};

if (document?.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
} else {
    run();
}